# BinaJiwa — Backend

API FastAPI untuk aplikasi kesehatan mental **BinaJiwa** (forum anonim, mood tracker,
journal pribadi, konsultasi psikolog, event, dan moderasi). Database & auth dipakai
langsung dari **Supabase** (Postgres + Auth + Storage); backend ini adalah satu-satunya
pintu masuk API — frontend tidak perlu memanggil Supabase secara langsung.

## Arsitektur singkat

- **Auth**: Supabase Auth (email/password). Backend meneruskan sign up/login/refresh
  ke Supabase lalu mengembalikan access & refresh token ke client.
- **Otorisasi**: setiap request yang butuh login membawa `Authorization: Bearer <access_token>`.
  Token diverifikasi lokal (JWKS untuk project baru yang pakai ES256/RS256, atau
  `SUPABASE_JWT_SECRET` untuk project lama yang masih HS256) tanpa panggil Auth API
  tiap request — kalau verifikasi lokal gagal karena sebab apa pun, backend otomatis
  fallback ke `auth.get_user()` (lebih lambat tapi selalu benar).
- **Query ke database**: setiap request memakai *client Supabase yang di-scope ke JWT
  user* (`postgrest.auth(token)`), jadi semua aturan akses **ditegakkan oleh Row Level
  Security (RLS) di Postgres**, bukan dihitung ulang di Python. Endpoint di backend ini
  pada dasarnya validasi input + orkestrasi, sementara "siapa boleh apa" mengikuti
  kebijakan di [`supabase/supabase_schema.sql`](supabase/supabase_schema.sql).
- **Operasi admin/bypass-RLS** (verifikasi psikolog, moderasi paksa, upload file) pakai
  `service_role` key lewat client terpisah.
- **Chat**: realtime dipegang oleh **Supabase Realtime** langsung dari frontend
  (subscribe ke tabel `messages`); backend hanya menyediakan REST untuk kirim/lihat
  pesan dan menandai sudah dibaca.

## Menjalankan secara lokal

```bash
cd BE
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env          # lalu isi nilai di .env (lihat bawah)
uvicorn app.main:app --reload
```

Buka `http://127.0.0.1:8000/docs` untuk Swagger UI interaktif.

### Isi `.env`

| Variabel | Wajib? | Keterangan |
| --- | --- | --- |
| `SUPABASE_URL` | ya | URL project (Project Settings → API) |
| `SUPABASE_ANON_KEY` | ya | anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | untuk fitur admin | dipakai untuk verifikasi psikolog, moderasi, upload storage, dan logout (revoke token). Endpoint yang butuh ini akan menolak dengan pesan jelas kalau kosong. |
| `SUPABASE_JWT_SECRET` | opsional | hanya relevan untuk project lama yang masih menandatangani JWT dengan HS256. Project baru (ES256/RS256) diverifikasi otomatis lewat JWKS, tidak butuh variabel ini. |
| `CORS_ORIGINS` | opsional | daftar origin frontend dipisah koma. **Ganti dari `*` sebelum production** — browser menolak `*` dikombinasikan dengan cookie/credential. |

## Struktur folder

```
app/
  core/        konfigurasi, koneksi Supabase, auth/JWT, mapping error
  schemas/     model request/response (Pydantic) per domain
  services/    logika akses data (bungkus supabase-py + penanganan error)
  routers/     endpoint FastAPI, satu file per domain
  main.py      perakitan FastAPI app
supabase/
  supabase_schema.sql   skema database (dijalankan di SQL Editor Supabase)
```

## Peta endpoint

| Domain | Prefix | Contoh |
| --- | --- | --- |
| Auth | `/auth` | register, login, refresh, logout, me |
| Profil & Persona | `/profiles` | lihat profil, edit profil sendiri, kelola persona anonim |
| Mood & Journal | `/wellness` | CRUD mood entry & jurnal pribadi (privat, hanya pemilik) |
| Forum | `/forum` | kategori, post, jawaban, komentar, "peluk" (hug) |
| Psikolog | `/psychologists`, `/appointments` | daftar/verifikasi psikolog, jadwal, booking konsultasi |
| Chat | `/chat` | percakapan & pesan user↔psikolog |
| Event | `/events` | CRUD event, pendaftaran peserta |
| Pembayaran (simulasi) | `/payments` | Rincian biaya, buat tagihan, simulasi lunas, batalkan |
| Notifikasi | `/notifications` | daftar notifikasi, tandai dibaca |
| Laporan | `/reports` | lapor konten/user, moderasi oleh admin |
| Kontak darurat | `/emergency-contacts` | daftar hotline krisis (publik, tanpa login) |
| File | `/storage/upload/{bucket}` | upload avatar/foto persona/gambar event/dokumen verifikasi/lampiran chat |

Detail lengkap tiap endpoint (request/response, status code) ada di Swagger `/docs`.

### Bucket Supabase Storage yang perlu dibuat

Endpoint upload mengasumsikan bucket berikut sudah dibuat di **Storage** dashboard
Supabase (nama harus persis sama): `avatars`, `personas`, `events`,
`verification-docs`, `chat-attachments`. Backend memvalidasi tipe file & ukuran per
bucket sebelum upload (lihat `app/services/storage_service.py`).

## Catatan penting / rekomendasi

1. **Role self-escalation di RLS**: kebijakan `profiles_update_own` di
   `supabase_schema.sql` mengizinkan user mengubah *seluruh kolom* profilnya sendiri,
   termasuk `role` — secara teori user bisa set `role` jadi `ADMIN` sendiri kalau ada
   jalur yang memanggil Supabase langsung dengan JWT-nya (bukan lewat backend ini).
   Backend ini sudah aman (schema `ProfileUpdate` tidak mengekspos field `role` sama
   sekali), tapi ini best-effort defense-in-depth: sebaiknya tambahkan trigger di
   Postgres (mirip `protect_verification_status` yang sudah ada untuk psikolog) yang
   mengunci kolom `role` kecuali diubah oleh `service_role` atau admin. Beri tahu saya
   kalau mau saya buatkan migration-nya.
2. **Notifikasi tidak otomatis**: tabel `notifications` tersedia dan endpoint CRUD-nya
   sudah ada, tapi belum ada trigger/logic otomatis yang mengisi notifikasi saat mis.
   ada jawaban baru di post kamu, appointment dikonfirmasi, dll. Ini keputusan sadar
   supaya scope awal tidak membengkak — bisa ditambahkan sebagai trigger Postgres atau
   di layer service kalau sudah dibutuhkan.
3. **Mendaftar sebagai psikolog** (`POST /psychologists/me`) belum otomatis mengubah
   `profiles.role` jadi `PSYCHOLOGIST` — kolom itu hanya diset saat registrasi awal.
   Kebanyakan RLS policy sudah memeriksa lewat tabel `psychologists` langsung (bukan
   `profiles.role`), jadi secara fungsional tidak masalah, tapi field `role` bisa jadi
   tidak sinkron untuk tampilan UI.
4. Semua endpoint sudah diuji langsung ke project Supabase yang kamu konfigurasi
   (register → login → CRUD di tiap domain → cleanup), termasuk kasus RLS
   forbidden (403), constraint bentrok jadwal appointment (409), dan validasi input
   (422).
