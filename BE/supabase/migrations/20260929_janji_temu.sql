-- =====================================================================
-- MIGRASI: Pengaman janji temu (psychologist_appointments)
-- Jalankan sekali di Supabase Dashboard > SQL Editor.
-- Aman dijalankan ulang (idempotent).
--
-- Backend sudah memvalidasi semua aturan ini, tetapi anon key Supabase
-- ada di frontend sehingga tabel bisa diakses langsung tanpa backend.
-- Trigger di bawah memastikan aturan yang sama berlaku di database.
-- Perubahan lewat Dashboard / SQL Editor / service role tidak dibatasi.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Saat membuat janji temu (INSERT)
--    - status selalu PENDING
--    - waktu mulai harus di masa depan
--    - psikolog harus VERIFIED & ACTIVE, dan bukan diri sendiri
-- ---------------------------------------------------------------------
create or replace function public.protect_appointment_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    if coalesce(auth.role(), '') not in ('anon', 'authenticated') then
        return new;
    end if;

    new.status := 'PENDING';

    if new.tanggal_mulai <= now() then
        raise exception 'Waktu sesi sudah lewat' using errcode = '23514';
    end if;

    if not exists (
        select 1 from public.psychologists p
        where p.id_psychologist = new.id_psychologist
          and p.verification_status = 'VERIFIED'
          and p.status = 'ACTIVE'
          and p.id_user <> new.id_user
    ) then
        raise exception 'Psikolog ini tidak dapat menerima janji temu' using errcode = '42501';
    end if;

    return new;
end;
$$;

drop trigger if exists trg_protect_appointment_insert on public.psychologist_appointments;
create trigger trg_protect_appointment_insert
    before insert on public.psychologist_appointments
    for each row execute function public.protect_appointment_insert();

-- ---------------------------------------------------------------------
-- 2. Saat mengubah janji temu (UPDATE)
--    - pemesan, psikolog, jadwal, dan tipe sesi tidak boleh diubah
--    - pemesan hanya boleh membatalkan (PENDING/CONFIRMED -> CANCELLED)
--      dan mengubah catatan selama PENDING
--    - psikolog: PENDING -> CONFIRMED/CANCELLED, CONFIRMED -> COMPLETED/CANCELLED,
--      dan boleh mengubah lokasi (mis. tautan sesi online)
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

drop trigger if exists trg_protect_appointment_update on public.psychologist_appointments;
create trigger trg_protect_appointment_update
    before update on public.psychologist_appointments
    for each row execute function public.protect_appointment_update();

-- ---------------------------------------------------------------------
-- Cek: harus mengembalikan 2 baris
-- ---------------------------------------------------------------------
select tgname from pg_trigger
where tgname in ('trg_protect_appointment_insert', 'trg_protect_appointment_update');
