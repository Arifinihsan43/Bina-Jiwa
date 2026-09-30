-- =====================================================================
-- MIGRASI: Pengaman fitur Pesan (conversations & messages)
-- Jalankan sekali di Supabase Dashboard > SQL Editor.
-- Aman dijalankan ulang (idempotent).
--
-- Aturan: percakapan hanya antara user <-> psikolog, dan hanya dibuat
-- oleh backend (service role) saat psikolog mengonfirmasi janji temu.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Fungsi find_or_create_conversation menerima id user & psikolog
--    sembarang, jadi hanya boleh dipanggil backend (service role).
-- ---------------------------------------------------------------------
revoke execute on function public.find_or_create_conversation(uuid, uuid, uuid)
    from public, anon, authenticated;
grant execute on function public.find_or_create_conversation(uuid, uuid, uuid)
    to service_role;

-- ---------------------------------------------------------------------
-- 2. User tidak boleh membuat / mengubah percakapan sendiri.
--    (insert: bisa membuka chat dengan psikolog mana pun tanpa janji temu;
--     update: bisa memindahkan percakapan ke psikolog lain)
-- ---------------------------------------------------------------------
drop policy if exists "conversations_insert_participant" on public.conversations;
drop policy if exists "conversations_update_participant" on public.conversations;

-- ---------------------------------------------------------------------
-- 3. Pesan tidak boleh diedit. Satu-satunya perubahan yang diizinkan:
--    penerima menandai pesan sebagai sudah dibaca.
--    (policy messages_update_mark_read memakai "with check (true)")
-- ---------------------------------------------------------------------
create or replace function public.protect_message_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    if coalesce(auth.role(), '') not in ('anon', 'authenticated') then
        return new;
    end if;

    if new.id_conversation is distinct from old.id_conversation
       or new.id_sender is distinct from old.id_sender
       or new.message_type is distinct from old.message_type
       or new.isi is distinct from old.isi
       or new.attachment_url is distinct from old.attachment_url
       or new.created_at is distinct from old.created_at then
        raise exception 'Pesan tidak dapat diubah' using errcode = '42501';
    end if;

    if new.is_read is distinct from old.is_read
       and (old.id_sender = auth.uid() or new.is_read = false) then
        raise exception 'Status baca hanya bisa diubah penerima' using errcode = '42501';
    end if;

    return new;
end;
$$;

drop trigger if exists trg_protect_message_update on public.messages;
create trigger trg_protect_message_update
    before update on public.messages
    for each row execute function public.protect_message_update();

-- ---------------------------------------------------------------------
-- 4. Pesan hanya bisa dikirim di percakapan yang masih ACTIVE.
-- ---------------------------------------------------------------------
create or replace function public.protect_message_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    if coalesce(auth.role(), '') not in ('anon', 'authenticated') then
        return new;
    end if;

    if not exists (
        select 1 from public.conversations c
        where c.id_conversation = new.id_conversation
          and c.status = 'ACTIVE'
    ) then
        raise exception 'Percakapan ini sudah ditutup' using errcode = '42501';
    end if;

    new.is_read := false;
    new.created_at := now();
    return new;
end;
$$;

drop trigger if exists trg_protect_message_insert on public.messages;
create trigger trg_protect_message_insert
    before insert on public.messages
    for each row execute function public.protect_message_insert();

-- ---------------------------------------------------------------------
-- 5. Buka percakapan untuk janji temu yang sudah dikonfirmasi/selesai
--    sebelum migrasi ini (jika belum punya).
-- ---------------------------------------------------------------------
insert into public.conversations (id_appointment, id_user, id_psychologist)
select distinct on (a.id_user, a.id_psychologist)
       a.id_appointment, a.id_user, a.id_psychologist
from public.psychologist_appointments a
where a.status in ('CONFIRMED', 'COMPLETED')
order by a.id_user, a.id_psychologist, a.tanggal_mulai desc
on conflict (id_user, id_psychologist) do nothing;

-- ---------------------------------------------------------------------
-- Cek: harus 2 baris trigger, dan tidak ada policy insert/update conversations
-- ---------------------------------------------------------------------
select 'trigger' as jenis, tgname as nama from pg_trigger
where tgname in ('trg_protect_message_update', 'trg_protect_message_insert')
union all
select 'policy conversations', policyname from pg_policies
where schemaname = 'public' and tablename = 'conversations';
