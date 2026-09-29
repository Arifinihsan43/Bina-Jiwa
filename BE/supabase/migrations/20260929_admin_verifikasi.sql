-- =====================================================================
-- MIGRASI: Verifikasi psikolog oleh admin + proteksi role
-- Jalankan sekali di Supabase Dashboard > SQL Editor.
-- Aman dijalankan ulang (idempotent).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Kolom alasan penolakan verifikasi
-- ---------------------------------------------------------------------
alter table public.psychologists
    add column if not exists catatan_verifikasi text;

comment on column public.psychologists.catatan_verifikasi is
    'Alasan penolakan dari admin (diisi saat REJECTED, dikosongkan saat diajukan ulang / VERIFIED)';

-- ---------------------------------------------------------------------
-- 2. Proteksi verification_status + catatan_verifikasi
--    Psikolog tidak bisa mengubah status/catatan sendiri. Saat data
--    legalitas diubah, status kembali PENDING dan catatan lama dihapus.
-- ---------------------------------------------------------------------
create or replace function public.protect_verification_status()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    if auth.role() <> 'service_role' and not public.is_admin() then
        new.verification_status := old.verification_status;
        new.catatan_verifikasi := old.catatan_verifikasi;

        if new.nomor_himpsi is distinct from old.nomor_himpsi
           or new.nomor_sipp is distinct from old.nomor_sipp
           or new.dokumen_verifikasi_url is distinct from old.dokumen_verifikasi_url then
            new.verification_status := 'PENDING';
            new.catatan_verifikasi := null;
        end if;
    end if;
    return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 3. [KEAMANAN] User tidak boleh mengubah role-nya sendiri lewat API
--    (policy profiles_update_own mengizinkan update baris sendiri,
--    termasuk kolom role). Perubahan lewat Dashboard/SQL Editor tetap boleh.
-- ---------------------------------------------------------------------
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    if new.role is distinct from old.role
       and coalesce(auth.role(), '') in ('anon', 'authenticated')
       and not public.is_admin() then
        raise exception 'Tidak diizinkan mengubah role akun'
            using errcode = '42501';
    end if;
    return new;
end;
$$;

drop trigger if exists trg_protect_profile_role on public.profiles;
create trigger trg_protect_profile_role
    before update on public.profiles
    for each row execute function public.protect_profile_role();

-- ---------------------------------------------------------------------
-- 4. [KEAMANAN] Pendaftaran hanya boleh sebagai USER atau PSYCHOLOGIST.
--    Sebelumnya role diambil mentah dari metadata signUp, sehingga siapa
--    pun bisa daftar sebagai ADMIN langsung lewat Supabase (anon key).
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.profiles (id_user, nama_lengkap, username, role)
    values (
        new.id,
        coalesce(new.raw_user_meta_data ->> 'nama_lengkap', 'Pengguna Baru'),
        coalesce(new.raw_user_meta_data ->> 'username', 'user_' || substr(new.id::text, 1, 8)),
        case
            when new.raw_user_meta_data ->> 'role' = 'PSYCHOLOGIST' then 'PSYCHOLOGIST'
            else 'USER'
        end
    );
    return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 5. Cek: akun yang saat ini ber-role ADMIN.
--    Pastikan hanya akun yang memang Anda jadikan admin.
-- ---------------------------------------------------------------------
select p.id_user, p.nama_lengkap, p.username, u.email, p.created_at
from public.profiles p
join auth.users u on u.id = p.id_user
where p.role = 'ADMIN';
