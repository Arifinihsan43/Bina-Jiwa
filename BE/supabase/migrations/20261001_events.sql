-- =====================================================================
-- MIGRASI: Events & Workshop dikelola admin
-- Jalankan sekali di Supabase Dashboard > SQL Editor. Aman dijalankan ulang
-- (juga aman bila versi sebelumnya dari file ini sudah pernah dijalankan).
--
-- Alur: fasilitator / komunitas mengirim proposal lewat email, lalu admin
-- (Panel Admin, memakai service role) yang membuat & mempublikasikan event.
-- Pengguna hanya bisa melihat event yang dipublikasikan dan mendaftar.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Penyelenggara bisa pihak luar tanpa akun Bina Jiwa
-- ---------------------------------------------------------------------
alter table public.events
    add column if not exists penyelenggara varchar(150),
    add column if not exists penyelenggara_info varchar(200);

alter table public.events
    alter column id_creator drop not null;

comment on column public.events.penyelenggara is 'Nama fasilitator / komunitas penyelenggara';
comment on column public.events.penyelenggara_info is 'Keterangan singkat penyelenggara (profesi, lembaga, dsb.)';
comment on column public.events.id_creator is 'Opsional: akun pembuat (null bila dibuat admin lewat panel)';

-- ---------------------------------------------------------------------
-- 2. Event hanya dibuat/diubah admin (service role). Tutup jalur API user.
-- ---------------------------------------------------------------------
drop policy if exists "events_insert_own" on public.events;
drop policy if exists "events_update_own_or_admin" on public.events;

-- Sisa versi sebelumnya (event dibuat psikolog) — tidak dipakai lagi.
drop trigger if exists trg_protect_event_insert on public.events;
drop function if exists public.protect_event_insert();

-- ---------------------------------------------------------------------
-- 3. Pendaftaran: event harus PUBLISHED, belum lewat batas pendaftaran,
--    kursi masih ada (baris event dikunci agar tidak rebutan kursi).
-- ---------------------------------------------------------------------
create or replace function public.check_event_seat(p_id_event uuid, p_id_user uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
    v_event public.events%rowtype;
    v_taken integer;
begin
    select * into v_event from public.events where id_event = p_id_event for update;

    if not found or v_event.status <> 'PUBLISHED' then
        raise exception 'Event tidak menerima pendaftaran' using errcode = '42501';
    end if;
    if now() >= coalesce(v_event.batas_pendaftaran, v_event.tanggal_mulai) then
        raise exception 'Pendaftaran event ini sudah ditutup' using errcode = '42501';
    end if;

    if v_event.kapasitas is not null then
        select count(*) into v_taken
        from public.event_participants
        where id_event = p_id_event
          and id_user <> p_id_user
          and status in ('REGISTERED', 'ATTENDED');
        if v_taken >= v_event.kapasitas then
            raise exception 'Kursi event sudah penuh' using errcode = '23P01';
        end if;
    end if;
end;
$$;

revoke execute on function public.check_event_seat(uuid, uuid) from public, anon, authenticated;

create or replace function public.protect_event_participant_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    if coalesce(auth.role(), '') not in ('anon', 'authenticated') then
        return new;
    end if;
    perform public.check_event_seat(new.id_event, new.id_user);
    new.status := 'REGISTERED';
    new.attended_at := null;
    new.registered_at := now();
    return new;
end;
$$;

drop trigger if exists trg_protect_event_participant_insert on public.event_participants;
create trigger trg_protect_event_participant_insert
    before insert on public.event_participants
    for each row execute function public.protect_event_participant_insert();

-- ---------------------------------------------------------------------
-- 4. Peserta hanya boleh: REGISTERED -> CANCELLED (sebelum mulai) dan
--    CANCELLED -> REGISTERED (daftar ulang, cek kursi lagi).
--    Tanda hadir (ATTENDED) hanya oleh admin lewat Panel Admin.
-- ---------------------------------------------------------------------
create or replace function public.protect_event_participant_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
    v_mulai timestamptz;
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
        select tanggal_mulai into v_mulai from public.events where id_event = old.id_event;
        if old.status = 'REGISTERED' and new.status = 'CANCELLED' then
            if now() >= v_mulai then
                raise exception 'Event sudah dimulai' using errcode = '42501';
            end if;
        elsif old.status = 'CANCELLED' and new.status = 'REGISTERED' then
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

drop trigger if exists trg_protect_event_participant_update on public.event_participants;
create trigger trg_protect_event_participant_update
    before update on public.event_participants
    for each row execute function public.protect_event_participant_update();

-- ---------------------------------------------------------------------
-- Cek: kolom baru ada, 2 trigger peserta ada, policy insert/update events hilang
-- ---------------------------------------------------------------------
select 'kolom' as jenis, column_name as nama from information_schema.columns
where table_schema = 'public' and table_name = 'events' and column_name in ('penyelenggara', 'penyelenggara_info')
union all
select 'trigger', tgname from pg_trigger
where tgname in ('trg_protect_event_participant_insert', 'trg_protect_event_participant_update')
union all
select 'policy events', policyname from pg_policies
where schemaname = 'public' and tablename = 'events';
