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
    status                   varchar(20) not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
    nomor_himpsi             varchar(50),
    nomor_sipp               varchar(50),
    dokumen_verifikasi_url   varchar(500),
    verification_status      varchar(20) not null default 'PENDING'
                                check (verification_status in ('PENDING', 'VERIFIED', 'REJECTED')),
    created_at               timestamptz not null default now(),
    updated_at               timestamptz not null default now()
);

comment on table public.psychologists is 'Data tambahan untuk profile dengan role PSYCHOLOGIST';
comment on column public.psychologists.nomor_himpsi is 'Nomor keanggotaan Himpunan Psikologi Indonesia (HIMPSI)';
comment on column public.psychologists.nomor_sipp is 'Nomor Surat Izin Praktik Psikolog (SIPP)';
comment on column public.psychologists.verification_status is 'PENDING (baru daftar), VERIFIED (sudah divalidasi admin), REJECTED (ditolak)';

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
    id_creator         uuid not null references public.profiles (id_user) on delete cascade,
    judul              varchar(200) not null,
    deskripsi          text,
    gambar_url         varchar(500),
    tanggal_mulai      timestamptz not null,
    tanggal_selesai    timestamptz not null,
    lokasi             text,
    type               varchar(20) not null check (type in ('ONLINE', 'OFFLINE')),
    link_meeting       varchar(500),
    harga              numeric(12, 2) not null default 0,
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
        coalesce(new.raw_user_meta_data ->> 'role', 'USER')
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

        if new.nomor_himpsi is distinct from old.nomor_himpsi
           or new.nomor_sipp is distinct from old.nomor_sipp
           or new.dokumen_verifikasi_url is distinct from old.dokumen_verifikasi_url then
            new.verification_status := 'PENDING';
        end if;
    end if;
    return new;
end;
$$;

create trigger trg_protect_verification_status
    before update on public.psychologists
    for each row execute function public.protect_verification_status();

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

create policy "conversations_update_participant"
    on public.conversations for update
    to authenticated
    using (
        auth.uid() = id_user
        or exists (
            select 1 from public.psychologists p
            where p.id_psychologist = conversations.id_psychologist
              and p.id_user = auth.uid()
        )
    )
    with check (
        auth.uid() = id_user
        or exists (
            select 1 from public.psychologists p
            where p.id_psychologist = conversations.id_psychologist
              and p.id_user = auth.uid()
        )
    );

create policy "conversations_insert_participant"
    on public.conversations for insert
    to authenticated
    with check (
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

create policy "events_insert_own"
    on public.events for insert
    to authenticated
    with check (auth.uid() = id_creator);

create policy "events_update_own_or_admin"
    on public.events for update
    to authenticated
    using (auth.uid() = id_creator or public.is_admin())
    with check (auth.uid() = id_creator or public.is_admin());

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

-- =====================================================================
-- SELESAI
-- =====================================================================
