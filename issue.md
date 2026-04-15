# Rencana Implementasi — Issue #2

Sumber: https://github.com/saputroandi/muslim-wear-ecommerce/issues/2  
Fokus: **Autentikasi admin tunggal + hardening akses dashboard** untuk operasional 1 admin.

## Tujuan

1. Hanya admin yang sudah login bisa akses halaman admin.
2. Aktivitas penting tercatat dengan timestamp.
3. Tersedia reset password yang aman.

## Prinsip Implementasi (untuk junior/AI murah)

1. Kerjakan **bertahap dalam PR kecil** (jangan sekaligus).
2. Satu PR = satu scope jelas + test.
3. Hindari refactor besar di luar scope issue #2.

## Tahapan Eksekusi

## Tahap 1 — Fondasi Data & Konfigurasi

**Target hasil:** struktur data untuk auth, session, audit log, dan reset password siap dipakai.

### Status implementasi saat ini
- ✅ `AdminUser` sudah dipakai sebagai sumber akun admin.
- ✅ Entity `audit_logs` dan `password_reset_tokens` sudah ditambahkan.
- ✅ Seeder admin berbasis ENV sudah ada (`scripts/seed-admin.ts`) dan memakai bcrypt hash.
- ✅ Variabel ENV admin/session sudah ditambahkan ke `.env.example`.
- ⚠️ Migration TypeORM formal untuk tabel baru **belum** disiapkan (masih tersisa).

### Tugas
1. Pastikan entity `AdminUser` dipakai sebagai sumber akun admin tunggal.
2. Tambah entity/tabel:
   - `audit_logs` (id, admin_user_id, action, metadata_json, created_at)
   - `password_reset_tokens` (id, admin_user_id, token_hash, expires_at, used_at, created_at)
3. Tambah migration untuk tabel baru.
4. Tambah seed/init admin awal dari ENV:
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
5. Hash password saat seed (bcrypt, bukan plaintext).

### File yang disentuh (indikatif)
- `src/persistence/entities/*`
- folder migration TypeORM
- konfigurasi ENV (`.env.example`, config loader jika diperlukan)

---

## Tahap 2 — Login/Logout dengan Session (Server-side)

**Target hasil:** admin bisa login/logout, session tersimpan aman di server.

### Status implementasi saat ini
- ✅ Session middleware sudah terpasang (`express-session` + `connect-pg-simple`).
- ✅ Endpoint `GET /auth/login`, `POST /auth/login`, `POST /auth/logout` sudah dibuat.
- ✅ Login gagal memakai pesan error generik.
- ✅ Cookie session sudah memakai `httpOnly`, `sameSite=lax`, dan `secure` by environment.
- ✅ Session table PostgreSQL sudah dikonfigurasi explicit (`user_sessions`) + auto-create.
- ✅ Rotasi/regenerate session id setelah login sukses sudah diimplementasikan.

### Tugas
1. Pasang session middleware di bootstrap Nest (`main.ts`):
   - `express-session`
   - store PostgreSQL (mis. `connect-pg-simple`)
2. Buat endpoint auth:
   - `GET /auth/login` (render form)
   - `POST /auth/login` (validasi kredensial)
   - `POST /auth/logout`
3. Saat login sukses:
   - simpan `adminUserId` di session
   - rotate/regenerate session id
4. Saat logout:
   - destroy session
   - clear cookie
5. Jika login gagal:
   - pesan error generik (jangan bocorkan email mana yang valid).

### Catatan keamanan
- Cookie: `httpOnly: true`
- `sameSite: "lax"`
- `secure: true` hanya di production

---

## Tahap 3 — Proteksi Route Dashboard Admin

**Target hasil:** route `/admin` tidak bisa diakses tanpa login.

### Tugas
1. Buat `AdminSessionGuard` (atau middleware auth guard) untuk cek session.
2. Terapkan guard ke semua route admin.
3. Jika belum login, redirect ke `/auth/login`.
4. Jika sudah login, lanjut ke controller admin.

### File yang disentuh (indikatif)
- `src/modules/admin/admin.controller.ts`
- modul/guard auth baru di `src/modules/auth/*`

---

## Tahap 4 — Session Timeout & Idle Auto Logout

**Target hasil:** user otomatis logout ketika idle melewati batas waktu.

### Tugas
1. Tentukan timeout idle (contoh: 30 menit).
2. Simpan `lastActivityAt` di session.
3. Pada request terproteksi:
   - cek selisih waktu
   - jika lewat batas → destroy session + redirect login
   - jika belum lewat batas → update `lastActivityAt`
4. Tampilkan pesan “Sesi berakhir, silakan login ulang”.

---

## Tahap 5 — Audit Log Aktivitas Penting

**Target hasil:** aktivitas kritikal tercatat untuk jejak operasional.

### Tugas
1. Buat `AuditLogService` dengan method standar:
   - `record(adminUserId, action, metadata?)`
2. Catat minimal event berikut:
   - login sukses
   - login gagal
   - logout
   - ubah produk
   - ubah status pesanan
3. Simpan timestamp otomatis (`created_at`).
4. Metadata disimpan JSON (contoh: orderId, productId, IP jika tersedia).

---

## Tahap 6 — Reset Password Aman

**Target hasil:** admin bisa reset password via token yang aman.

### Tugas
1. Buat endpoint:
   - `POST /auth/forgot-password`
   - `POST /auth/reset-password`
2. Flow forgot password:
   - generate token random
   - simpan **hash token** ke DB (jangan token plaintext)
   - set expired time (contoh 15–30 menit)
   - kirim link reset (sementara bisa log ke console/dev)
3. Flow reset password:
   - verifikasi token hash + expiry + belum pernah dipakai
   - update `password_hash`
   - tandai token `used_at`
   - revoke session aktif sebelumnya

---

## Tahap 7 — Hardening Minimum

**Target hasil:** perlindungan dasar terhadap abuse.

### Tugas
1. Pasang rate limiter untuk endpoint login dan forgot-password.
2. Terapkan CSRF protection untuk form POST auth/admin.
3. Validasi input pakai DTO + `class-validator`.
4. Pastikan tidak ada log yang mencetak password/token mentah.

---

## Tahap 8 — Testing & Kriteria Selesai

**Target hasil:** implementasi siap merge, sesuai acceptance issue #2.

### Test minimum
1. Login sukses/gagal.
2. Akses `/admin` tanpa login ditolak.
3. Session idle timeout bekerja.
4. Event audit log tercatat.
5. Reset password valid/invalid/expired.

### Perintah cek
1. `npm run lint`
2. `npm run build`
3. `npm run test`

## Breakdown PR yang Disarankan

1. **PR-1:** entity + migration + seed admin awal (**sebagian selesai; migration tersisa**)  
2. **PR-2:** login/logout + session store (**sebagian besar selesai; rotate session id tersisa**)  
3. **PR-3:** admin guard + proteksi route  
4. **PR-4:** idle timeout  
5. **PR-5:** audit log  
6. **PR-6:** reset password  
7. **PR-7:** hardening + test tambahan

## Definisi Done Issue #2

1. Hanya admin terautentikasi yang bisa akses halaman admin.
2. Aktivitas penting tercatat dengan timestamp.
3. Reset password aman tersedia dan tervalidasi.
