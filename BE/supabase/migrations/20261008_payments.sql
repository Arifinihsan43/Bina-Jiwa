-- =====================================================================
-- MIGRASI: Pembayaran (simulasi / mock payment) untuk sesi psikolog & event
-- Jalankan sekali di Supabase Dashboard > SQL Editor.
-- Aman dijalankan ulang (idempotent).
--
-- Tidak memakai payment gateway sungguhan. Backend (service role) yang
-- menghitung biaya, membuat tagihan, dan menandai lunas — tombol
-- "Simulasikan Pembayaran Berhasil" di FE berperan sebagai webhook.
--
-- Pembagian biaya (angka persen diatur backend lewat .env, lalu
-- disimpan permanen di setiap transaksi agar riwayat tidak berubah):
--   total            = subtotal + biaya_layanan        -> dibayar user
--   subtotal         = komisi_platform + pendapatan_mitra
--   Psikolog: komisi 15%, Event: komisi 10%, biaya layanan flat.
--
-- Alur:
--   Psikolog : booking (PENDING) -> bayar (PAID) -> psikolog CONFIRMED.
--              Psikolog tidak bisa konfirmasi sebelum lunas (kecuali tarif 0).
--   Event    : event gratis tetap daftar langsung. Event berbayar hanya
--              lewat pembayaran; saat lunas peserta otomatis terdaftar.
--   Batal    : appointment / pendaftaran / event dibatalkan -> tagihan
--              PENDING jadi CANCELLED, yang PAID jadi REFUNDED (simulasi).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tarif sesi psikolog (diatur psikolog sendiri dari profilnya)
-- ---------------------------------------------------------------------
alter table public.psychologists
    add column if not exists tarif_sesi numeric(12, 2) not null default 0;

alter table public.psychologists
    drop constraint if exists chk_psychologist_tarif;
alter table public.psychologists
    add constraint chk_psychologist_tarif check (tarif_sesi >= 0);

comment on column public.psychologists.tarif_sesi is 'Tarif per sesi konsultasi (Rupiah). 0 = gratis';

alter table public.events
    drop constraint if exists chk_event_harga;
alter table public.events
    add constraint chk_event_harga check (harga >= 0);

-- ---------------------------------------------------------------------
-- 2. Tabel PAYMENTS
-- ---------------------------------------------------------------------
create table if not exists public.payments (
    id_payment        uuid primary key default gen_random_uuid(),
    id_user           uuid not null references public.profiles (id_user) on delete cascade,
    jenis             varchar(20) not null check (jenis in ('APPOINTMENT', 'EVENT')),
    id_appointment    uuid references public.psychologist_appointments (id_appointment) on delete cascade,
    id_event          uuid references public.events (id_event) on delete cascade,

    -- Rincian yang dibayar user
    subtotal          numeric(12, 2) not null,
    biaya_layanan     numeric(12, 2) not null default 0,
    total             numeric(12, 2) not null,

    -- Pembagian pendapatan
    persen_komisi     numeric(5, 2) not null,           -- mis. 15.00 = 15%
    komisi_platform   numeric(12, 2) not null,          -- bagian Bina Jiwa
    pendapatan_mitra  numeric(12, 2) not null,          -- bagian psikolog / penyelenggara

    metode            varchar(30) not null
                        check (metode in ('QRIS', 'VA_BCA', 'VA_BNI', 'VA_MANDIRI', 'GOPAY', 'OVO', 'DANA')),
    kode_bayar        varchar(50) not null,             -- nomor VA / kode QRIS palsu
    status            varchar(20) not null default 'PENDING'
                        check (status in ('PENDING', 'PAID', 'EXPIRED', 'CANCELLED', 'REFUNDED')),
    expired_at        timestamptz not null,
    paid_at           timestamptz,
    refunded_at       timestamptz,
    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now(),

    constraint chk_payment_target check (
        (jenis = 'APPOINTMENT' and id_appointment is not null and id_event is null)
        or (jenis = 'EVENT' and id_event is not null and id_appointment is null)
    ),
    constraint chk_payment_nominal check (
        subtotal >= 0 and biaya_layanan >= 0 and komisi_platform >= 0 and pendapatan_mitra >= 0
        and total = subtotal + biaya_layanan
        and subtotal = komisi_platform + pendapatan_mitra
    ),
    constraint chk_payment_persen check (persen_komisi between 0 and 100)
);

comment on table public.payments is 'Transaksi pembayaran (simulasi) untuk sesi psikolog dan event berbayar';
comment on column public.payments.kode_bayar is 'Kode bayar simulasi (nomor VA / kode QRIS), bukan transaksi nyata';

create unique index if not exists payments_kode_bayar_key on public.payments (kode_bayar);
create index if not exists payments_id_user_idx on public.payments (id_user, created_at desc);

-- Satu appointment / satu (event, user) hanya boleh punya 1 tagihan aktif.
create unique index if not exists payments_active_appointment_key
    on public.payments (id_appointment)
    where status in ('PENDING', 'PAID');
create unique index if not exists payments_active_event_key
    on public.payments (id_event, id_user)
    where status in ('PENDING', 'PAID');

drop trigger if exists trg_payments_updated_at on public.payments;
create trigger trg_payments_updated_at
    before update on public.payments
    for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 3. RLS: user hanya bisa MEMBACA. Insert & ubah status hanya lewat
--    backend (service role), supaya tidak bisa "lunas sendiri" dari FE.
-- ---------------------------------------------------------------------
alter table public.payments enable row level security;

drop policy if exists "payments_select_own_or_partner" on public.payments;
create policy "payments_select_own_or_partner"
    on public.payments for select
    to authenticated
    using (
        auth.uid() = id_user
        or public.is_admin()
        -- psikolog bisa melihat pembayaran untuk sesinya (pendapatan)
        or exists (
            select 1
            from public.psychologist_appointments a
            join public.psychologists p on p.id_psychologist = a.id_psychologist
            where a.id_appointment = payments.id_appointment
              and p.id_user = auth.uid()
        )
    );

-- ---------------------------------------------------------------------
-- 4. Appointment: psikolog hanya bisa CONFIRMED bila sudah lunas
--    (sama seperti 20260929_janji_temu.sql + cek pembayaran)
-- ---------------------------------------------------------------------
create or replace function public.protect_appointment_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
    v_is_client boolean;
    v_is_psychologist boolean;
begin
    if coalesce(auth.role(), '') not in ('anon', 'authenticated') then
        return new;
    end if;

    v_is_client := old.id_user = auth.uid();
    v_is_psychologist := exists (
        select 1 from public.psychologists p
        where p.id_psychologist = old.id_psychologist
          and p.id_user = auth.uid()
    );

    if new.id_user is distinct from old.id_user
       or new.id_psychologist is distinct from old.id_psychologist
       or new.tanggal_mulai is distinct from old.tanggal_mulai
       or new.tanggal_selesai is distinct from old.tanggal_selesai
       or new.type is distinct from old.type then
        raise exception 'Jadwal janji temu tidak dapat diubah' using errcode = '42501';
    end if;

    if new.status is distinct from old.status and not (
        (v_is_client
            and old.status in ('PENDING', 'CONFIRMED')
            and new.status = 'CANCELLED')
        or (v_is_psychologist and (
            (old.status = 'PENDING' and new.status in ('CONFIRMED', 'CANCELLED'))
            or (old.status = 'CONFIRMED' and new.status in ('COMPLETED', 'CANCELLED'))
        ))
    ) then
        raise exception 'Perubahan status janji temu tidak diizinkan' using errcode = '42501';
    end if;

    if old.status = 'PENDING' and new.status = 'CONFIRMED'
       and not exists (
           select 1 from public.payments pay
           where pay.id_appointment = old.id_appointment and pay.status = 'PAID'
       )
       and exists (
           select 1 from public.psychologists p
           where p.id_psychologist = old.id_psychologist and p.tarif_sesi > 0
       ) then
        raise exception 'Klien belum menyelesaikan pembayaran' using errcode = '42501';
    end if;

    if new.catatan is distinct from old.catatan
       and not (v_is_client and old.status = 'PENDING') then
        raise exception 'Catatan hanya bisa diubah pemesan selama menunggu konfirmasi' using errcode = '42501';
    end if;

    if new.lokasi is distinct from old.lokasi and not v_is_psychologist then
        raise exception 'Hanya psikolog yang dapat mengubah lokasi sesi' using errcode = '42501';
    end if;

    return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 5. Event berbayar: user tidak bisa daftar langsung, harus lewat
--    pembayaran (sama seperti 20261001_events.sql + cek harga)
-- ---------------------------------------------------------------------
create or replace function public.protect_event_participant_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    if coalesce(auth.role(), '') not in ('anon', 'authenticated') then
        return new;
    end if;
    if exists (select 1 from public.events where id_event = new.id_event and harga > 0) then
        raise exception 'Event berbayar, selesaikan pembayaran untuk mendaftar' using errcode = '42501';
    end if;
    perform public.check_event_seat(new.id_event, new.id_user);
    new.status := 'REGISTERED';
    new.attended_at := null;
    new.registered_at := now();
    return new;
end;
$$;

create or replace function public.protect_event_participant_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
    v_mulai timestamptz;
    v_harga numeric;
begin
    if coalesce(auth.role(), '') not in ('anon', 'authenticated') then
        return new;
    end if;

    if new.id_event is distinct from old.id_event
       or new.id_user is distinct from old.id_user
       or old.id_user is distinct from auth.uid() then
        raise exception 'Tidak diizinkan' using errcode = '42501';
    end if;

    if new.status is distinct from old.status then
        select tanggal_mulai, harga into v_mulai, v_harga
        from public.events where id_event = old.id_event;
        if old.status = 'REGISTERED' and new.status = 'CANCELLED' then
            if now() >= v_mulai then
                raise exception 'Event sudah dimulai' using errcode = '42501';
            end if;
        elsif old.status = 'CANCELLED' and new.status = 'REGISTERED' then
            if v_harga > 0 then
                raise exception 'Event berbayar, selesaikan pembayaran untuk mendaftar ulang' using errcode = '42501';
            end if;
            perform public.check_event_seat(old.id_event, old.id_user);
            new.registered_at := now();
        else
            raise exception 'Perubahan status pendaftaran tidak diizinkan' using errcode = '42501';
        end if;
    end if;

    new.attended_at := old.attended_at;
    return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 6. Konfirmasi pembayaran (dipanggil backend saat tombol simulasi
--    ditekan). Atomik: tandai PAID + daftarkan peserta event.
-- ---------------------------------------------------------------------
create or replace function public.confirm_payment(p_id_payment uuid)
returns public.payments
language plpgsql
security definer set search_path = public
as $$
declare
    v_pay public.payments%rowtype;
begin
    select * into v_pay from public.payments where id_payment = p_id_payment for update;

    if not found then
        raise exception 'Tagihan tidak ditemukan' using errcode = 'P0002';
    end if;
    if v_pay.status <> 'PENDING' then
        raise exception 'Tagihan sudah tidak aktif' using errcode = '42501';
    end if;
    if now() >= v_pay.expired_at then
        update public.payments set status = 'EXPIRED' where id_payment = p_id_payment;
        raise exception 'Batas waktu pembayaran sudah lewat' using errcode = '42501';
    end if;

    if v_pay.jenis = 'APPOINTMENT' then
        if not exists (
            select 1 from public.psychologist_appointments
            where id_appointment = v_pay.id_appointment and status = 'PENDING'
        ) then
            raise exception 'Janji temu sudah tidak aktif' using errcode = '42501';
        end if;
    else
        perform public.check_event_seat(v_pay.id_event, v_pay.id_user);
        insert into public.event_participants (id_event, id_user, status, registered_at, attended_at)
        values (v_pay.id_event, v_pay.id_user, 'REGISTERED', now(), null)
        on conflict (id_event, id_user) do update
            set status = 'REGISTERED', registered_at = now(), attended_at = null;
    end if;

    update public.payments
    set status = 'PAID', paid_at = now()
    where id_payment = p_id_payment
    returning * into v_pay;

    return v_pay;
end;
$$;

revoke execute on function public.confirm_payment(uuid) from public, anon, authenticated;
grant execute on function public.confirm_payment(uuid) to service_role;
grant execute on function public.check_event_seat(uuid, uuid) to service_role;

-- ---------------------------------------------------------------------
-- 7. Kedaluwarsa: tagihan PENDING lewat batas -> EXPIRED, dan janji
--    temu yang belum dibayar ikut CANCELLED agar slot jadwal terbuka.
--    Dipanggil backend (mis. sebelum membuat tagihan / menampilkan daftar).
-- ---------------------------------------------------------------------
create or replace function public.expire_payments()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
    with expired as (
        update public.payments
        set status = 'EXPIRED'
        where status = 'PENDING' and expired_at <= now()
        returning id_appointment
    )
    update public.psychologist_appointments a
    set status = 'CANCELLED'
    from expired e
    where a.id_appointment = e.id_appointment
      and a.status = 'PENDING'
      and not exists (
          select 1 from public.payments p
          where p.id_appointment = a.id_appointment and p.status in ('PENDING', 'PAID')
      );
end;
$$;

revoke execute on function public.expire_payments() from public, anon, authenticated;
grant execute on function public.expire_payments() to service_role;

-- ---------------------------------------------------------------------
-- 8. Pembatalan -> tagihan ikut ditutup (PENDING -> CANCELLED,
--    PAID -> REFUNDED). Berlaku dari jalur mana pun (FE, backend, admin).
-- ---------------------------------------------------------------------
create or replace function public.close_payments_on_appointment_cancel()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    if new.status = 'CANCELLED' and old.status is distinct from 'CANCELLED' then
        update public.payments
        set status = case when status = 'PAID' then 'REFUNDED' else 'CANCELLED' end,
            refunded_at = case when status = 'PAID' then now() else refunded_at end
        where id_appointment = new.id_appointment
          and status in ('PENDING', 'PAID');
    end if;
    return new;
end;
$$;

drop trigger if exists trg_close_payments_on_appointment_cancel on public.psychologist_appointments;
create trigger trg_close_payments_on_appointment_cancel
    after update of status on public.psychologist_appointments
    for each row execute function public.close_payments_on_appointment_cancel();

create or replace function public.close_payments_on_participant_cancel()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    if new.status = 'CANCELLED' and old.status is distinct from 'CANCELLED' then
        update public.payments
        set status = case when status = 'PAID' then 'REFUNDED' else 'CANCELLED' end,
            refunded_at = case when status = 'PAID' then now() else refunded_at end
        where id_event = new.id_event
          and id_user = new.id_user
          and status in ('PENDING', 'PAID');
    end if;
    return new;
end;
$$;

drop trigger if exists trg_close_payments_on_participant_cancel on public.event_participants;
create trigger trg_close_payments_on_participant_cancel
    after update of status on public.event_participants
    for each row execute function public.close_payments_on_participant_cancel();

create or replace function public.close_payments_on_event_cancel()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    if new.status = 'CANCELLED' and old.status is distinct from 'CANCELLED' then
        update public.payments
        set status = case when status = 'PAID' then 'REFUNDED' else 'CANCELLED' end,
            refunded_at = case when status = 'PAID' then now() else refunded_at end
        where id_event = new.id_event
          and status in ('PENDING', 'PAID');
    end if;
    return new;
end;
$$;

drop trigger if exists trg_close_payments_on_event_cancel on public.events;
create trigger trg_close_payments_on_event_cancel
    after update of status on public.events
    for each row execute function public.close_payments_on_event_cancel();

-- ---------------------------------------------------------------------
-- Cek: kolom tarif_sesi, tabel payments, 3 fungsi, 4 trigger
-- ---------------------------------------------------------------------
select 'kolom' as jenis, column_name as nama from information_schema.columns
where table_schema = 'public' and table_name = 'psychologists' and column_name = 'tarif_sesi'
union all
select 'tabel', table_name from information_schema.tables
where table_schema = 'public' and table_name = 'payments'
union all
select 'fungsi', proname from pg_proc
where proname in ('confirm_payment', 'expire_payments', 'check_event_seat')
union all
select 'trigger', tgname from pg_trigger
where tgname in ('trg_payments_updated_at', 'trg_close_payments_on_appointment_cancel',
                 'trg_close_payments_on_participant_cancel', 'trg_close_payments_on_event_cancel');
