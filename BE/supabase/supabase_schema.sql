-- =====================================================================
-- SCHEMA SQL UNTUK SUPABASE — Aplikasi "BinaJiwa"
-- Forum kesehatan mental anonim + mood tracker + journal + konsultasi
-- psikolog + event + moderasi
-- =====================================================================
-- CATATAN PENTING SEBELUM DIJALANKAN:
-- 1. Semua nama kolom pakai snake_case (konvensi Postgres/Supabase);
--    PDF sumbernya sudah snake_case jadi tidak ada perubahan nama.
-- 2. Beberapa kolom "status"/"type" di PDF tidak dijelaskan daftar
--    nilainya (posts.status, answers.status, answer_comments.status,
--    events.status, event_participants.status, reports.status,
--    reports.target_type). Saya isi dengan nilai yang masuk akal
--    (ditandai komentar "ASUMSI" di setiap CHECK constraint) —
--    SESUAIKAN dulu sebelum run kalau beda dengan rencana kamu.
-- 3. Saya tambahkan role 'ADMIN' ke profiles.role (PDF cuma sebut
--    USER/PSYCHOLOGIST) karena tabel REPORTS butuh admin (reviewed_by)
--    dan beberapa aksi (verifikasi psikolog, moderasi, kelola
--    categories/emergency_contacts) butuh konsep admin. Kalau kamu
--    sudah punya mekanisme admin lain (mis. tabel terpisah), bilang saja.
-- =====================================================================

create extension if not exists "pgcrypto";
create extension if not exists "btree_gist"; -- untuk EXCLUDE constraint anti double-booking

-- =====================================================================
-- 1. PROFILES
-- =====================================================================
create table public.profiles (
    id_user       uuid primary key references auth.users (id) on delete cascade,
    nama_lengkap  varchar(100) not null,
    username      varchar(50)  not null unique,
    role          varchar(20)  not null default 'USER'
                    check (role in ('USER', 'PSYCHOLOGIST', 'ADMIN')), -- 'ADMIN' ditambahkan, lihat catatan di atas
    foto_profil   varchar(255),
    kota          varchar(50),
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);

comment on table public.profiles is 'Profil dasar tiap akun (USER, PSYCHOLOGIST, atau ADMIN)';

-- =====================================================================
-- 2. PERSONAS
-- =====================================================================
-- Identitas anonim yang dipakai user saat posting/menjawab/berkomentar
-- di forum, supaya identitas asli (id_user) tidak terekspos ke user lain.
create table public.personas (
    id_persona    uuid primary key default gen_random_uuid(),
    id_user       uuid not null unique references public.profiles (id_user) on delete cascade,
    nama_persona  varchar(50) not null,
    foto_persona  varchar(255),
    is_active     boolean not null default true,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);

comment on table public.personas is 'Identitas anonim satu-per-user untuk aktivitas forum';

-- =====================================================================
-- 3. MOOD_ENTRIES
-- =====================================================================
create table public.mood_entries (
    id_mood_entry  uuid primary key default gen_random_uuid(),
    id_user        uuid not null references public.profiles (id_user) on delete cascade,
    mood           varchar(30) not null,
    intensitas     smallint not null check (intensitas between 1 and 5),
    catatan        text,
    created_at     timestamptz not null default now()
);

comment on table public.mood_entries is 'Catatan mood harian user (data pribadi, tidak dibagikan)';

-- =====================================================================
-- 4. JOURNALS
-- =====================================================================
create table public.journals (
    id_journal  uuid primary key default gen_random_uuid(),
    id_user     uuid not null references public.profiles (id_user) on delete cascade,
    judul       varchar(150) not null,
    isi         text not null,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

comment on table public.journals is 'Jurnal pribadi user (data pribadi, tidak dibagikan)';

-- =====================================================================
-- 5. CATEGORIES
-- =====================================================================
create table public.categories (
    id_category    uuid primary key default gen_random_uuid(),
    nama_kategori  varchar(50) not null unique,
    slug           varchar(60) not null unique,
    deskripsi      text,
    is_active      boolean not null default true,
    created_at     timestamptz not null default now()
);

comment on table public.categories is 'Kategori topik forum (dikelola admin)';

-- =====================================================================
-- 6. POSTS
-- =====================================================================
create table public.posts (
    id_post       uuid primary key default gen_random_uuid(),
    id_user       uuid not null references public.profiles (id_user) on delete cascade,
    id_persona    uuid not null references public.personas (id_persona) on delete cascade,
    id_category   uuid references public.categories (id_category) on delete set null,
    judul         varchar(200) not null,
    isi           text not null,
    status        varchar(20) not null default 'PUBLISHED'
                    check (status in ('PUBLISHED', 'HIDDEN', 'DELETED')), -- ASUMSI
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);

comment on table public.posts is 'Postingan/pertanyaan di forum anonim';

-- =====================================================================
-- 7. ANSWERS
-- =====================================================================
create table public.answers (
    id_answer   uuid primary key default gen_random_uuid(),
    id_post     uuid not null references public.posts (id_post) on delete cascade,
    id_user     uuid not null references public.profiles (id_user) on delete cascade,
    id_persona  uuid not null references public.personas (id_persona) on delete cascade,
    isi         text not null,
    status      varchar(20) not null default 'PUBLISHED'
                  check (status in ('PUBLISHED', 'HIDDEN', 'DELETED')), -- ASUMSI
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

comment on table public.answers is 'Jawaban atas sebuah post';

-- =====================================================================
-- 8. ANSWER_COMMENTS
-- =====================================================================
create table public.answer_comments (
    id_comment  uuid primary key default gen_random_uuid(),
    id_answer   uuid not null references public.answers (id_answer) on delete cascade,
    id_user     uuid not null references public.profiles (id_user) on delete cascade,
    id_persona  uuid not null references public.personas (id_persona) on delete cascade,
    isi         text not null,
    status      varchar(20) not null default 'PUBLISHED'
                  check (status in ('PUBLISHED', 'HIDDEN', 'DELETED')), -- ASUMSI
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

comment on table public.answer_comments is 'Komentar atas sebuah jawaban';

-- =====================================================================
-- 9. POST_HUGS
-- =====================================================================
create table public.post_hugs (
    id_post     uuid not null references public.posts (id_post) on delete cascade,
    id_user     uuid not null references public.profiles (id_user) on delete cascade,
    created_at  timestamptz not null default now(),
    primary key (id_post, id_user)
);

comment on table public.post_hugs is 'Reaksi "peluk" (dukungan) user terhadap sebuah post';

-- =====================================================================
-- 10. ANSWER_HUGS
-- =====================================================================
create table public.answer_hugs (
    id_answer   uuid not null references public.answers (id_answer) on delete cascade,
    id_user     uuid not null references public.profiles (id_user) on delete cascade,
    created_at  timestamptz not null default now(),
    primary key (id_answer, id_user)
);

comment on table public.answer_hugs is 'Reaksi "peluk" (dukungan) user terhadap sebuah jawaban';

-- =====================================================================
-- 11. PSYCHOLOGISTS
-- =====================================================================
create table public.psychologists (
    id_psychologist          uuid primary key default gen_random_uuid(),
    id_user                  uuid not null unique references public.profiles (id_user) on delete cascade,
    nama_profesional         varchar(100) not null,
    spesialisasi             varchar(150),
    bio                      text,
    kota                     varchar(50),
    alamat_praktik           text,
    latitude                 decimal(10, 7),
    longitude                decimal(10, 7),
    tarif_sesi               numeric(12, 2) not null default 0
                                constraint chk_psychologist_tarif check (tarif_sesi >= 0), -- 0 = gratis
    status                   varchar(20) not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
    nomor_himpsi             varchar(50),
    nomor_sipp               varchar(50),
    dokumen_verifikasi_url   varchar(500),
    verification_status      varchar(20) not null default 'PENDING'
                                check (verification_status in ('PENDING', 'VERIFIED', 'REJECTED')),
    catatan_verifikasi       text,
    created_at               timestamptz not null default now(),
    updated_at               timestamptz not null default now()
);

comment on table public.psychologists is 'Data tambahan untuk profile dengan role PSYCHOLOGIST';
comment on column public.psychologists.nomor_himpsi is 'Nomor keanggotaan Himpunan Psikologi Indonesia (HIMPSI)';
comment on column public.psychologists.nomor_sipp is 'Nomor Surat Izin Praktik Psikolog (SIPP)';
comment on column public.psychologists.verification_status is 'PENDING (baru daftar), VERIFIED (sudah divalidasi admin), REJECTED (ditolak)';
comment on column public.psychologists.catatan_verifikasi is 'Alasan penolakan dari admin (diisi saat REJECTED, dikosongkan saat diajukan ulang / VERIFIED)';

-- =====================================================================
-- 12. PSYCHOLOGIST_SCHEDULES
-- =====================================================================
create table public.psychologist_schedules (
    id_schedule      uuid primary key default gen_random_uuid(),
    id_psychologist  uuid not null references public.psychologists (id_psychologist) on delete cascade,
    hari             smallint not null check (hari between 1 and 7), -- 1 = Senin ... 7 = Minggu
    jam_mulai        time not null,
    jam_selesai      time not null,
    is_active        boolean not null default true,
    created_at       timestamptz not null default now(),

    constraint chk_jam_valid check (jam_selesai > jam_mulai)
);

comment on table public.psychologist_schedules is 'Jadwal ketersediaan mingguan psikolog';

-- =====================================================================
-- 13. PSYCHOLOGIST_APPOINTMENTS
-- =====================================================================
create table public.psychologist_appointments (
    id_appointment   uuid primary key default gen_random_uuid(),
    id_user          uuid not null references public.profiles (id_user) on delete cascade,
    id_psychologist  uuid not null references public.psychologists (id_psychologist) on delete cascade,
    tanggal_mulai    timestamptz not null,
    tanggal_selesai  timestamptz not null,
    type             varchar(20) not null check (type in ('ONLINE', 'OFFLINE')),
    lokasi           text,
    catatan          text,
    status           varchar(20) not null default 'PENDING'
                        check (status in ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now(),

    constraint chk_appointment_waktu_valid check (tanggal_selesai > tanggal_mulai),

    -- Cegah double-booking: psikolog yang sama tidak boleh punya 2 sesi
    -- PENDING/CONFIRMED yang jamnya tumpang tindih.
    constraint psychologist_appointments_no_overlap
        exclude using gist (
            id_psychologist with =,
            tstzrange(tanggal_mulai, tanggal_selesai) with &&
        )
        where (status in ('PENDING', 'CONFIRMED'))
);

comment on table public.psychologist_appointments is 'Reservasi sesi konsultasi antara user dan psikolog';

-- =====================================================================
-- 14. CONVERSATIONS
-- =====================================================================
-- Satu conversation = satu pasangan (user, psikolog), dipakai ulang
-- lintas appointment.
create table public.conversations (
    id_conversation  uuid primary key default gen_random_uuid(),
    id_appointment   uuid references public.psychologist_appointments (id_appointment) on delete set null,
    id_user          uuid not null references public.profiles (id_user) on delete cascade,
    id_psychologist  uuid not null references public.psychologists (id_psychologist) on delete cascade,
    status           varchar(20) not null default 'ACTIVE'
                        check (status in ('ACTIVE', 'COMPLETED', 'ARCHIVED')),
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now(),

    constraint conversations_user_psychologist_unique unique (id_user, id_psychologist)
);

comment on table public.conversations is 'Ruang percakapan 1:1 user-psikolog, dipakai ulang lintas appointment';
comment on column public.conversations.id_appointment is 'Appointment pemicu awal percakapan; nullable, tidak ikut hilang kalau appointment dihapus';

-- =====================================================================
-- 15. MESSAGES
-- =====================================================================
create table public.messages (
    id_message       uuid primary key default gen_random_uuid(),
    id_conversation  uuid not null references public.conversations (id_conversation) on delete cascade,
    id_sender        uuid not null references public.profiles (id_user) on delete cascade,
    message_type     varchar(20) not null default 'TEXT' check (message_type in ('TEXT', 'AUDIO')),
    isi              text,
    attachment_url   varchar(500),
    is_read          boolean not null default false,
    created_at       timestamptz not null default now(),

    constraint chk_message_content check (isi is not null or attachment_url is not null)
);

comment on table public.messages is 'Pesan dalam sebuah conversation';

-- =====================================================================
-- 16. EVENTS
-- =====================================================================
create table public.events (
    id_event           uuid primary key default gen_random_uuid(),
    id_creator         uuid references public.profiles (id_user) on delete set null, -- null = dibuat admin
    penyelenggara      varchar(150),
    penyelenggara_info varchar(200),
    judul              varchar(200) not null,
    deskripsi          text,
    gambar_url         varchar(500),
    tanggal_mulai      timestamptz not null,
    tanggal_selesai    timestamptz not null,
    lokasi             text,
    type               varchar(20) not null check (type in ('ONLINE', 'OFFLINE')),
    link_meeting       varchar(500),
    harga              numeric(12, 2) not null default 0
                          constraint chk_event_harga check (harga >= 0),
    kapasitas          integer,
    batas_pendaftaran  timestamptz,
    status             varchar(20) not null default 'DRAFT'
                          check (status in ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED')), -- ASUMSI
    created_at         timestamptz not null default now(),
    updated_at         timestamptz not null default now(),

    constraint chk_event_waktu_valid check (tanggal_selesai > tanggal_mulai),
    constraint chk_event_kapasitas check (kapasitas is null or kapasitas > 0)
);

comment on table public.events is 'Event/webinar/kegiatan yang bisa didaftari user';

-- =====================================================================
-- 17. EVENT_PARTICIPANTS
-- =====================================================================
create table public.event_participants (
    id_event       uuid not null references public.events (id_event) on delete cascade,
    id_user        uuid not null references public.profiles (id_user) on delete cascade,
    status         varchar(20) not null default 'REGISTERED'
                     check (status in ('REGISTERED', 'CANCELLED', 'ATTENDED')), -- ASUMSI
    registered_at  timestamptz not null default now(),
    attended_at    timestamptz,
    primary key (id_event, id_user)
);

comment on table public.event_participants is 'Pendaftaran user ke sebuah event';

-- =====================================================================
-- 18. NOTIFICATIONS
-- =====================================================================
create table public.notifications (
    id_notification  uuid primary key default gen_random_uuid(),
    id_user          uuid not null references public.profiles (id_user) on delete cascade,
    type             varchar(30) not null,
    title            varchar(150) not null,
    message          text not null,
    reference_id     uuid,
    is_read          boolean not null default false,
    created_at       timestamptz not null default now()
);

comment on table public.notifications is 'Notifikasi untuk user';

-- =====================================================================
-- 19. REPORTS
-- =====================================================================
create table public.reports (
    id_report     uuid primary key default gen_random_uuid(),
    id_reporter   uuid not null references public.profiles (id_user) on delete cascade,
    target_type   varchar(30) not null
                    check (target_type in ('POST', 'ANSWER', 'ANSWER_COMMENT', 'USER')), -- ASUMSI
    target_id     uuid not null,
    reason        varchar(50) not null,
    description   text,
    status        varchar(20) not null default 'PENDING'
                    check (status in ('PENDING', 'REVIEWED', 'RESOLVED', 'REJECTED')), -- ASUMSI
    reviewed_by   uuid references public.profiles (id_user) on delete set null,
    reviewed_at   timestamptz,
    created_at    timestamptz not null default now()
);

comment on table public.reports is 'Laporan moderasi untuk post/jawaban/komentar/user';
comment on column public.reports.target_id is 'ID objek yang dilaporkan; tabel rujukannya ditentukan oleh target_type (tidak ada FK langsung karena target_type berbeda-beda tabel)';

-- =====================================================================
-- 20. EMERGENCY_CONTACTS
-- =====================================================================
create table public.emergency_contacts (
    id_emergency_contact  uuid primary key default gen_random_uuid(),
    nama                  varchar(150) not null,
    jenis                 varchar(50) not null,
    nomor_telepon         varchar(30),
    website_url           varchar(500),
    deskripsi             text,
    is_active             boolean not null default true,
    created_at            timestamptz not null default now(),
    updated_at            timestamptz not null default now()
);

comment on table public.emergency_contacts is 'Daftar kontak layanan bantuan darurat (hotline krisis, dsb) — publik, bisa diakses tanpa login';

-- =====================================================================
-- 21. PAYMENTS (simulasi, lihat migrations/20261008_payments.sql)
-- =====================================================================
create table public.payments (
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

create unique index payments_kode_bayar_key on public.payments (kode_bayar);
create index payments_id_user_idx on public.payments (id_user, created_at desc);

-- Satu appointment / satu (event, user) hanya boleh punya 1 tagihan aktif.
create unique index payments_active_appointment_key
    on public.payments (id_appointment)
    where status in ('PENDING', 'PAID');
create unique index payments_active_event_key
    on public.payments (id_event, id_user)
    where status in ('PENDING', 'PAID');

-- =====================================================================
-- INDEXES
-- =====================================================================
create index idx_personas_id_user on public.personas (id_user);

create index idx_mood_entries_id_user on public.mood_entries (id_user);
create index idx_mood_entries_created_at on public.mood_entries (created_at);

create index idx_journals_id_user on public.journals (id_user);

create index idx_categories_is_active on public.categories (is_active);

create index idx_posts_id_user on public.posts (id_user);
create index idx_posts_id_persona on public.posts (id_persona);
create index idx_posts_id_category on public.posts (id_category);
create index idx_posts_status on public.posts (status);
create index idx_posts_created_at on public.posts (created_at);

create index idx_answers_id_post on public.answers (id_post);
create index idx_answers_id_user on public.answers (id_user);
create index idx_answers_status on public.answers (status);

create index idx_answer_comments_id_answer on public.answer_comments (id_answer);
create index idx_answer_comments_id_user on public.answer_comments (id_user);

create index idx_post_hugs_id_user on public.post_hugs (id_user);
create index idx_answer_hugs_id_user on public.answer_hugs (id_user);

create index idx_psychologists_id_user on public.psychologists (id_user);
create index idx_psychologists_status on public.psychologists (status);
create index idx_psychologists_verification_status on public.psychologists (verification_status);
create index idx_psychologists_kota on public.psychologists (kota);

create index idx_schedules_id_psychologist on public.psychologist_schedules (id_psychologist);
create index idx_schedules_hari on public.psychologist_schedules (hari);

create index idx_appointments_id_user on public.psychologist_appointments (id_user);
create index idx_appointments_id_psychologist on public.psychologist_appointments (id_psychologist);
create index idx_appointments_status on public.psychologist_appointments (status);
create index idx_appointments_tanggal_mulai on public.psychologist_appointments (tanggal_mulai);

create index idx_conversations_id_user on public.conversations (id_user);
create index idx_conversations_id_psychologist on public.conversations (id_psychologist);
create index idx_conversations_id_appointment on public.conversations (id_appointment);

create index idx_messages_id_conversation on public.messages (id_conversation);
create index idx_messages_created_at on public.messages (created_at);

create index idx_events_id_creator on public.events (id_creator);
create index idx_events_status on public.events (status);
create index idx_events_tanggal_mulai on public.events (tanggal_mulai);

create index idx_event_participants_id_user on public.event_participants (id_user);

create index idx_notifications_id_user on public.notifications (id_user);
create index idx_notifications_is_read on public.notifications (id_user, is_read);

create index idx_reports_target on public.reports (target_type, target_id);
create index idx_reports_status on public.reports (status);
create index idx_reports_id_reporter on public.reports (id_reporter);

-- =====================================================================
-- FUNCTION: is_admin() — helper dipakai di banyak policy
-- =====================================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
    select exists (
        select 1 from public.profiles
        where id_user = auth.uid() and role = 'ADMIN'
    );
$$;

-- =====================================================================
-- FUNCTION & TRIGGER: auto-update kolom updated_at
-- =====================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger trg_profiles_updated_at
    before update on public.profiles
    for each row execute function public.set_updated_at();

create trigger trg_personas_updated_at
    before update on public.personas
    for each row execute function public.set_updated_at();

create trigger trg_journals_updated_at
    before update on public.journals
    for each row execute function public.set_updated_at();

create trigger trg_posts_updated_at
    before update on public.posts
    for each row execute function public.set_updated_at();

create trigger trg_answers_updated_at
    before update on public.answers
    for each row execute function public.set_updated_at();

create trigger trg_answer_comments_updated_at
    before update on public.answer_comments
    for each row execute function public.set_updated_at();

create trigger trg_psychologists_updated_at
    before update on public.psychologists
    for each row execute function public.set_updated_at();

create trigger trg_appointments_updated_at
    before update on public.psychologist_appointments
    for each row execute function public.set_updated_at();

create trigger trg_conversations_updated_at
    before update on public.conversations
    for each row execute function public.set_updated_at();

create trigger trg_events_updated_at
    before update on public.events
    for each row execute function public.set_updated_at();

create trigger trg_emergency_contacts_updated_at
    before update on public.emergency_contacts
    for each row execute function public.set_updated_at();

create trigger trg_payments_updated_at
    before update on public.payments
    for each row execute function public.set_updated_at();

-- =====================================================================
-- FUNCTION & TRIGGER: auto-create profiles saat user baru daftar
-- =====================================================================
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
        -- Hanya USER / PSYCHOLOGIST yang boleh dipilih saat daftar; ADMIN diset manual.
        case
            when new.raw_user_meta_data ->> 'role' = 'PSYCHOLOGIST' then 'PSYCHOLOGIST'
            else 'USER'
        end
    );
    return new;
end;
$$;

create trigger trg_on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- =====================================================================
-- FUNCTION & TRIGGER: proteksi verification_status psikolog
-- =====================================================================
-- Psikolog tidak bisa self-verify. Hanya admin (role ADMIN) atau backend
-- yang pakai service_role key yang boleh mengubah verification_status.
-- Kalau psikolog mengubah nomor_himpsi/nomor_sipp/dokumen_verifikasi_url,
-- status otomatis di-reset ke PENDING supaya direview ulang.
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

create trigger trg_protect_verification_status
    before update on public.psychologists
    for each row execute function public.protect_verification_status();

-- =====================================================================
-- FUNCTION & TRIGGER: proteksi role profile
-- =====================================================================
-- policy profiles_update_own mengizinkan user mengubah baris sendiri,
-- jadi kolom role harus dijaga agar user tidak bisa menjadikan dirinya
-- ADMIN lewat API. Perubahan lewat Dashboard / SQL Editor tetap boleh.
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

create trigger trg_protect_profile_role
    before update on public.profiles
    for each row execute function public.protect_profile_role();

-- =====================================================================
-- FUNCTION: find_or_create_conversation
-- =====================================================================
create or replace function public.find_or_create_conversation(
    p_id_user uuid,
    p_id_psychologist uuid,
    p_id_appointment uuid
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
    v_id_conversation uuid;
begin
    insert into public.conversations (id_appointment, id_user, id_psychologist)
    values (p_id_appointment, p_id_user, p_id_psychologist)
    on conflict (id_user, id_psychologist)
    do update set updated_at = now()
    returning id_conversation into v_id_conversation;

    return v_id_conversation;
end;
$$;

-- =====================================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.personas enable row level security;
alter table public.mood_entries enable row level security;
alter table public.journals enable row level security;
alter table public.categories enable row level security;
alter table public.posts enable row level security;
alter table public.answers enable row level security;
alter table public.answer_comments enable row level security;
alter table public.post_hugs enable row level security;
alter table public.answer_hugs enable row level security;
alter table public.psychologists enable row level security;
alter table public.psychologist_schedules enable row level security;
alter table public.psychologist_appointments enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.events enable row level security;
alter table public.event_participants enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
alter table public.emergency_contacts enable row level security;
alter table public.payments enable row level security;

-- ---------------------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------------------
create policy "profiles_select_authenticated"
    on public.profiles for select
    to authenticated
    using (true);

create policy "profiles_update_own"
    on public.profiles for update
    to authenticated
    using (auth.uid() = id_user)
    with check (auth.uid() = id_user);

-- ---------------------------------------------------------------------
-- PERSONAS
-- ---------------------------------------------------------------------
-- Semua orang login bisa lihat persona (untuk tampilkan nama/avatar
-- anonim di post/jawaban/komentar) — yang dirahasiakan adalah id_user
-- pemiliknya, bukan personanya sendiri.
create policy "personas_select_authenticated"
    on public.personas for select
    to authenticated
    using (true);

create policy "personas_insert_own"
    on public.personas for insert
    to authenticated
    with check (auth.uid() = id_user);

create policy "personas_update_own"
    on public.personas for update
    to authenticated
    using (auth.uid() = id_user)
    with check (auth.uid() = id_user);

-- ---------------------------------------------------------------------
-- MOOD_ENTRIES (privat, hanya pemilik)
-- ---------------------------------------------------------------------
create policy "mood_entries_all_own"
    on public.mood_entries for all
    to authenticated
    using (auth.uid() = id_user)
    with check (auth.uid() = id_user);

-- ---------------------------------------------------------------------
-- JOURNALS (privat, hanya pemilik)
-- ---------------------------------------------------------------------
create policy "journals_all_own"
    on public.journals for all
    to authenticated
    using (auth.uid() = id_user)
    with check (auth.uid() = id_user);

-- ---------------------------------------------------------------------
-- CATEGORIES (baca publik untuk login, kelola hanya admin)
-- ---------------------------------------------------------------------
create policy "categories_select_authenticated"
    on public.categories for select
    to authenticated
    using (true);

create policy "categories_manage_admin"
    on public.categories for all
    to authenticated
    using (public.is_admin())
    with check (public.is_admin());

-- ---------------------------------------------------------------------
-- POSTS
-- ---------------------------------------------------------------------
-- Semua login bisa baca post yang PUBLISHED; pemilik tetap bisa lihat
-- post miliknya sendiri walau status lain; admin bisa lihat semua.
create policy "posts_select_visible"
    on public.posts for select
    to authenticated
    using (status = 'PUBLISHED' or auth.uid() = id_user or public.is_admin());

-- Insert: pemilik post, dan persona yang dipakai harus persona miliknya sendiri
create policy "posts_insert_own"
    on public.posts for insert
    to authenticated
    with check (
        auth.uid() = id_user
        and exists (
            select 1 from public.personas p
            where p.id_persona = posts.id_persona and p.id_user = auth.uid()
        )
    );

-- Update: pemilik post (mis. edit isi/status) atau admin (moderasi)
create policy "posts_update_own_or_admin"
    on public.posts for update
    to authenticated
    using (auth.uid() = id_user or public.is_admin())
    with check (auth.uid() = id_user or public.is_admin());

-- ---------------------------------------------------------------------
-- ANSWERS
-- ---------------------------------------------------------------------
create policy "answers_select_visible"
    on public.answers for select
    to authenticated
    using (status = 'PUBLISHED' or auth.uid() = id_user or public.is_admin());

create policy "answers_insert_own"
    on public.answers for insert
    to authenticated
    with check (
        auth.uid() = id_user
        and exists (
            select 1 from public.personas p
            where p.id_persona = answers.id_persona and p.id_user = auth.uid()
        )
    );

create policy "answers_update_own_or_admin"
    on public.answers for update
    to authenticated
    using (auth.uid() = id_user or public.is_admin())
    with check (auth.uid() = id_user or public.is_admin());

-- ---------------------------------------------------------------------
-- ANSWER_COMMENTS
-- ---------------------------------------------------------------------
create policy "answer_comments_select_visible"
    on public.answer_comments for select
    to authenticated
    using (status = 'PUBLISHED' or auth.uid() = id_user or public.is_admin());

create policy "answer_comments_insert_own"
    on public.answer_comments for insert
    to authenticated
    with check (
        auth.uid() = id_user
        and exists (
            select 1 from public.personas p
            where p.id_persona = answer_comments.id_persona and p.id_user = auth.uid()
        )
    );

create policy "answer_comments_update_own_or_admin"
    on public.answer_comments for update
    to authenticated
    using (auth.uid() = id_user or public.is_admin())
    with check (auth.uid() = id_user or public.is_admin());

-- ---------------------------------------------------------------------
-- POST_HUGS / ANSWER_HUGS
-- ---------------------------------------------------------------------
create policy "post_hugs_select_authenticated"
    on public.post_hugs for select
    to authenticated
    using (true);

create policy "post_hugs_insert_own"
    on public.post_hugs for insert
    to authenticated
    with check (auth.uid() = id_user);

create policy "post_hugs_delete_own"
    on public.post_hugs for delete
    to authenticated
    using (auth.uid() = id_user);

create policy "answer_hugs_select_authenticated"
    on public.answer_hugs for select
    to authenticated
    using (true);

create policy "answer_hugs_insert_own"
    on public.answer_hugs for insert
    to authenticated
    with check (auth.uid() = id_user);

create policy "answer_hugs_delete_own"
    on public.answer_hugs for delete
    to authenticated
    using (auth.uid() = id_user);

-- ---------------------------------------------------------------------
-- PSYCHOLOGISTS
-- ---------------------------------------------------------------------
create policy "psychologists_select_verified_or_own"
    on public.psychologists for select
    to authenticated
    using (verification_status = 'VERIFIED' or id_user = auth.uid() or public.is_admin());

create policy "psychologists_insert_own"
    on public.psychologists for insert
    to authenticated
    with check (auth.uid() = id_user);

create policy "psychologists_update_own_or_admin"
    on public.psychologists for update
    to authenticated
    using (auth.uid() = id_user or public.is_admin())
    with check (auth.uid() = id_user or public.is_admin());

-- ---------------------------------------------------------------------
-- PSYCHOLOGIST_SCHEDULES
-- ---------------------------------------------------------------------
create policy "schedules_select_authenticated"
    on public.psychologist_schedules for select
    to authenticated
    using (true);

create policy "schedules_manage_own"
    on public.psychologist_schedules for all
    to authenticated
    using (
        exists (
            select 1 from public.psychologists p
            where p.id_psychologist = psychologist_schedules.id_psychologist
              and p.id_user = auth.uid()
        )
    )
    with check (
        exists (
            select 1 from public.psychologists p
            where p.id_psychologist = psychologist_schedules.id_psychologist
              and p.id_user = auth.uid()
        )
    );

-- ---------------------------------------------------------------------
-- PSYCHOLOGIST_APPOINTMENTS
-- ---------------------------------------------------------------------
create policy "appointments_select_participant"
    on public.psychologist_appointments for select
    to authenticated
    using (
        auth.uid() = id_user
        or exists (
            select 1 from public.psychologists p
            where p.id_psychologist = psychologist_appointments.id_psychologist
              and p.id_user = auth.uid()
        )
    );

create policy "appointments_insert_own"
    on public.psychologist_appointments for insert
    to authenticated
    with check (auth.uid() = id_user);

create policy "appointments_update_participant"
    on public.psychologist_appointments for update
    to authenticated
    using (
        auth.uid() = id_user
        or exists (
            select 1 from public.psychologists p
            where p.id_psychologist = psychologist_appointments.id_psychologist
              and p.id_user = auth.uid()
        )
    )
    with check (
        auth.uid() = id_user
        or exists (
            select 1 from public.psychologists p
            where p.id_psychologist = psychologist_appointments.id_psychologist
              and p.id_user = auth.uid()
        )
    );

-- ---------------------------------------------------------------------
-- CONVERSATIONS
-- ---------------------------------------------------------------------
create policy "conversations_select_participant"
    on public.conversations for select
    to authenticated
    using (
        auth.uid() = id_user
        or exists (
            select 1 from public.psychologists p
            where p.id_psychologist = conversations.id_psychologist
              and p.id_user = auth.uid()
        )
    );

-- ---------------------------------------------------------------------
-- MESSAGES
-- ---------------------------------------------------------------------
create policy "messages_select_participant"
    on public.messages for select
    to authenticated
    using (
        exists (
            select 1 from public.conversations c
            where c.id_conversation = messages.id_conversation
              and (
                  c.id_user = auth.uid()
                  or exists (
                      select 1 from public.psychologists p
                      where p.id_psychologist = c.id_psychologist
                        and p.id_user = auth.uid()
                  )
              )
        )
    );

create policy "messages_insert_participant"
    on public.messages for insert
    to authenticated
    with check (
        id_sender = auth.uid()
        and exists (
            select 1 from public.conversations c
            where c.id_conversation = messages.id_conversation
              and (
                  c.id_user = auth.uid()
                  or exists (
                      select 1 from public.psychologists p
                      where p.id_psychologist = c.id_psychologist
                        and p.id_user = auth.uid()
                  )
              )
        )
    );

create policy "messages_update_mark_read"
    on public.messages for update
    to authenticated
    using (
        exists (
            select 1 from public.conversations c
            where c.id_conversation = messages.id_conversation
              and (
                  c.id_user = auth.uid()
                  or exists (
                      select 1 from public.psychologists p
                      where p.id_psychologist = c.id_psychologist
                        and p.id_user = auth.uid()
                  )
              )
        )
    )
    with check (true);

-- ---------------------------------------------------------------------
-- EVENTS
-- ---------------------------------------------------------------------
create policy "events_select_visible"
    on public.events for select
    to authenticated
    using (status = 'PUBLISHED' or auth.uid() = id_creator or public.is_admin());

-- ---------------------------------------------------------------------
-- EVENT_PARTICIPANTS
-- ---------------------------------------------------------------------
-- User bisa lihat pendaftarannya sendiri; creator event bisa lihat
-- semua peserta event miliknya (untuk kelola kehadiran).
create policy "event_participants_select_own_or_creator"
    on public.event_participants for select
    to authenticated
    using (
        auth.uid() = id_user
        or exists (
            select 1 from public.events e
            where e.id_event = event_participants.id_event
              and e.id_creator = auth.uid()
        )
        or public.is_admin()
    );

create policy "event_participants_insert_own"
    on public.event_participants for insert
    to authenticated
    with check (auth.uid() = id_user);

-- User bisa update pendaftarannya sendiri (mis. cancel); creator bisa
-- update status peserta (mis. tandai attended).
create policy "event_participants_update_own_or_creator"
    on public.event_participants for update
    to authenticated
    using (
        auth.uid() = id_user
        or exists (
            select 1 from public.events e
            where e.id_event = event_participants.id_event
              and e.id_creator = auth.uid()
        )
        or public.is_admin()
    )
    with check (
        auth.uid() = id_user
        or exists (
            select 1 from public.events e
            where e.id_event = event_participants.id_event
              and e.id_creator = auth.uid()
        )
        or public.is_admin()
    );

-- ---------------------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------------------
create policy "notifications_select_own"
    on public.notifications for select
    to authenticated
    using (auth.uid() = id_user);

create policy "notifications_update_own"
    on public.notifications for update
    to authenticated
    using (auth.uid() = id_user)
    with check (auth.uid() = id_user);

-- ---------------------------------------------------------------------
-- REPORTS
-- ---------------------------------------------------------------------
-- Pelapor bisa buat laporan & lihat laporannya sendiri; hanya admin
-- yang bisa lihat semua laporan dan mengubah status/review.
create policy "reports_select_own_or_admin"
    on public.reports for select
    to authenticated
    using (auth.uid() = id_reporter or public.is_admin());

create policy "reports_insert_own"
    on public.reports for insert
    to authenticated
    with check (auth.uid() = id_reporter);

create policy "reports_update_admin_only"
    on public.reports for update
    to authenticated
    using (public.is_admin())
    with check (public.is_admin());

-- ---------------------------------------------------------------------
-- EMERGENCY_CONTACTS
-- ---------------------------------------------------------------------
-- Info hotline krisis harus bisa diakses siapa saja, termasuk yang
-- belum login (anon), demi keselamatan.
create policy "emergency_contacts_select_public"
    on public.emergency_contacts for select
    to anon, authenticated
    using (is_active = true);

create policy "emergency_contacts_manage_admin"
    on public.emergency_contacts for all
    to authenticated
    using (public.is_admin())
    with check (public.is_admin());

-- ---------------------------------------------------------------------
-- PAYMENTS
-- ---------------------------------------------------------------------
-- User hanya membaca. Insert & ubah status hanya lewat backend (service role).
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

-- =====================================================================
-- SELESAI
-- =====================================================================

-- =====================================================================
-- FUNCTION & TRIGGER: pengaman janji temu (lihat migrations/20260929_janji_temu.sql)
-- =====================================================================
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

drop trigger if exists trg_protect_appointment_update on public.psychologist_appointments;
create trigger trg_protect_appointment_update
    before update on public.psychologist_appointments
    for each row execute function public.protect_appointment_update();

-- =====================================================================
-- PENGAMAN FITUR PESAN (lihat migrations/20260929_pesan.sql)
-- =====================================================================
revoke execute on function public.find_or_create_conversation(uuid, uuid, uuid)
    from public, anon, authenticated;
grant execute on function public.find_or_create_conversation(uuid, uuid, uuid)
    to service_role;

-- ---------------------------------------------------------------------
-- 2. User tidak boleh membuat / mengubah percakapan sendiri.
--    (insert: bisa membuka chat dengan psikolog mana pun tanpa janji temu;
--     update: bisa memindahkan percakapan ke psikolog lain)
-- ---------------------------------------------------------------------
-- (conversations sengaja tanpa policy insert/update: hanya dibuat backend)

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

-- =====================================================================
-- PENGAMAN EVENTS & WORKSHOP (lihat migrations/20261001_events.sql)
-- Event dibuat & dikelola admin (service role); user hanya mendaftar.
-- =====================================================================
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

drop trigger if exists trg_protect_event_participant_update on public.event_participants;
create trigger trg_protect_event_participant_update
    before update on public.event_participants
    for each row execute function public.protect_event_participant_update();

-- =====================================================================
-- PEMBAYARAN SIMULASI (lihat migrations/20261008_payments.sql)
-- =====================================================================
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
