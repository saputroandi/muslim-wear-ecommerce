1. # Rencana Implementasi — Issue #2
2. 
3. Sumber: https://github.com/saputroandi/muslim-wear-ecommerce/issues/2  
4. Fokus: **Autentikasi admin tunggal + hardening akses dashboard** untuk operasional 1 admin.
5. 
6. ## Tujuan
7. 
8. 1. Hanya admin yang sudah login bisa akses halaman admin.
9. 2. Aktivitas penting tercatat dengan timestamp.
10. 3. Tersedia reset password yang aman.
11. 
12. ## Prinsip Implementasi (untuk junior/AI murah)
13. 
14. 1. Kerjakan **bertahap dalam PR kecil** (jangan sekaligus).
15. 2. Satu PR = satu scope jelas + test.
16. 3. Hindari refactor besar di luar scope issue #2.
17. 
18. ## Tahapan Eksekusi
19. 
20. ## Tahap 1 — Fondasi Data & Konfigurasi
21. 
22. **Target hasil:** struktur data untuk auth, session, audit log, dan reset password siap dipakai.
23. 
24. ### Status implementasi saat ini
25. - ✅ `AdminUser` sudah dipakai sebagai sumber akun admin.
26. - ✅ Entity `audit_logs` dan `password_reset_tokens` sudah ditambahkan.
27. - ✅ Seeder admin berbasis ENV sudah ada (`scripts/seed-admin.ts`) dan memakai bcrypt hash.
28. - ✅ Variabel ENV admin/session sudah ditambahkan ke `.env.example`.
29. - ⚠️ Migration TypeORM formal untuk tabel baru **belum** disiapkan (masih tersisa).
30. 
31. ### Tugas
32. 1. Pastikan entity `AdminUser` dipakai sebagai sumber akun admin tunggal.
33. 2. Tambah entity/tabel:
34.    - `audit_logs` (id, admin_user_id, action, metadata_json, created_at)
35.    - `password_reset_tokens` (id, admin_user_id, token_hash, expires_at, used_at, created_at)
36. 3. Tambah migration untuk tabel baru.
37. 4. Tambah seed/init admin awal dari ENV:
38.    - `ADMIN_EMAIL`
39.    - `ADMIN_PASSWORD`
40. 5. Hash password saat seed (bcrypt, bukan plaintext).
41. 
42. ### File yang disentuh (indikatif)
43. - `src/persistence/entities/*`
44. - folder migration TypeORM
45. - konfigurasi ENV (`.env.example`, config loader jika diperlukan)
46. 
47. ---
48. 
49. ## Tahap 2 — Login/Logout dengan Session (Server-side)
50. 
51. **Target hasil:** admin bisa login/logout, session tersimpan aman di server.
52. 
53. ### Status implementasi saat ini
54. - ✅ Session middleware sudah terpasang (`express-session` + `connect-pg-simple`).
55. - ✅ Endpoint `GET /auth/login`, `POST /auth/login`, `POST /auth/logout` sudah dibuat.
56. - ✅ Login gagal memakai pesan error generik.
57. - ✅ Cookie session sudah memakai `httpOnly`, `sameSite=lax`, dan `secure` by environment.
58. - ✅ Session table PostgreSQL sudah dikonfigurasi explicit (`user_sessions`) + auto-create.
59. - ✅ Rotasi/regenerate session id setelah login sukses sudah diimplementasikan.
60. 
61. ### Tugas
62. 1. Pasang session middleware di bootstrap Nest (`main.ts`):
63.    - `express-session`
64.    - store PostgreSQL (mis. `connect-pg-simple`)
65. 2. Buat endpoint auth:
66.    - `GET /auth/login` (render form)
67.    - `POST /auth/login` (validasi kredensial)
68.    - `POST /auth/logout`
69. 3. Saat login sukses:
70.    - simpan `adminUserId` di session
71.    - rotate/regenerate session id
72. 4. Saat logout:
73.    - destroy session
74.    - clear cookie
75. 5. Jika login gagal:
76.    - pesan error generik (jangan bocorkan email mana yang valid).
77. 
78. ### Catatan keamanan
79. - Cookie: `httpOnly: true`
80. - `sameSite: "lax"`
81. - `secure: true` hanya di production
82. 
83. ---
84. 
85. ## Tahap 3 — Proteksi Route Dashboard Admin
86. 
87. **Target hasil:** route `/admin` tidak bisa diakses tanpa login.
88. 
89. ### Tugas
90. 1. Buat `AdminSessionGuard` (atau middleware auth guard) untuk cek session.
91. 2. Terapkan guard ke semua route admin.
92. 3. Jika belum login, redirect ke `/auth/login`.
93. 4. Jika sudah login, lanjut ke controller admin.
94. 
95. ### File yang disentuh (indikatif)
96. - `src/modules/admin/admin.controller.ts`
97. - modul/guard auth baru di `src/modules/auth/*`
98. 
99. ---
100. 
101. ## Tahap 4 — Session Timeout & Idle Auto Logout
102. 
103. **Target hasil:** user otomatis logout ketika idle melewati batas waktu.
104. 
105. ### Tugas
106. 1. Tentukan timeout idle (contoh: 30 menit).
107. 2. Simpan `lastActivityAt` di session.
108. 3. Pada request terproteksi:
109.    - cek selisih waktu
110.    - jika lewat batas → destroy session + redirect login
111.    - jika belum lewat batas → update `lastActivityAt`
112. 4. Tampilkan pesan “Sesi berakhir, silakan login ulang”.
113. 
114. ---
115. 
116. ## Tahap 5 — Audit Log Aktivitas Penting
117. 
118. **Target hasil:** aktivitas kritikal tercatat untuk jejak operasional.
119. 
120. ### Tugas
121. 1. Buat `AuditLogService` dengan method standar:
122.    - `record(adminUserId, action, metadata?)`
123. 2. Catat minimal event berikut:
124.    - login sukses
125.    - login gagal
126.    - logout
127.    - ubah produk
128.    - ubah status pesanan
129. 3. Simpan timestamp otomatis (`created_at`).
130. 4. Metadata disimpan JSON (contoh: orderId, productId, IP jika tersedia).
131. 
132. ---
133. 
134. ## Tahap 6 — Reset Password Aman
135. 
136. **Target hasil:** admin bisa reset password via token yang aman.
137. 
138. ### Tugas
139. 1. Buat endpoint:
140.    - `POST /auth/forgot-password`
141.    - `POST /auth/reset-password`
142. 2. Flow forgot password:
143.    - generate token random
144.    - simpan **hash token** ke DB (jangan token plaintext)
145.    - set expired time (contoh 15–30 menit)
146.    - kirim link reset (sementara bisa log ke console/dev)
147. 3. Flow reset password:
148.    - verifikasi token hash + expiry + belum pernah dipakai
149.    - update `password_hash`
150.    - tandai token `used_at`
151.    - revoke session aktif sebelumnya
152. 
153. ---
154. 
155. ## Tahap 7 — Hardening Minimum
156. 
157. **Target hasil:** perlindungan dasar terhadap abuse.
158. 
159. ### Tugas
160. 1. Pasang rate limiter untuk endpoint login dan forgot-password.
161. 2. Terapkan CSRF protection untuk form POST auth/admin.
162. 3. Validasi input pakai DTO + `class-validator`.
163. 4. Pastikan tidak ada log yang mencetak password/token mentah.
164. 
165. ---
166. 
167. ## Tahap 8 — Testing & Kriteria Selesai
168. 
169. **Target hasil:** implementasi siap merge, sesuai acceptance issue #2.
170. 
171. ### Test minimum
172. 1. Login sukses/gagal.
173. 2. Akses `/admin` tanpa login ditolak.
174. 3. Session idle timeout bekerja.
175. 4. Event audit log tercatat.
176. 5. Reset password valid/invalid/expired.
177. 
178. ### Perintah cek
179. 1. `npm run lint`
180. 2. `npm run build`
181. 3. `npm run test`
182. 
183. ## Breakdown PR yang Disarankan
184. 
185. 1. **PR-1:** entity + migration + seed admin awal (**sebagian selesai; migration tersisa**)  
186. 2. **PR-2:** login/logout + session store (**sebagian besar selesai; rotate session id tersisa**)  
187. 3. **PR-3:** admin guard + proteksi route  
188. 4. **PR-4:** idle timeout  
189. 5. **PR-5:** audit log  
190. 6. **PR-6:** reset password  
191. 7. **PR-7:** hardening + test tambahan
192. 
193. ## Definisi Done Issue #2
194. 
195. 1. Hanya admin terautentikasi yang bisa akses halaman admin.
196. 2. Aktivitas penting tercatat dengan timestamp.
197. 3. Reset password aman tersedia dan tervalidasi.
198. 