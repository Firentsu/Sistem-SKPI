# Sistem SKPI — Arsitektur Lengkap Frontend & Backend

Dokumentasi ini menjelaskan keseluruhan arsitektur `Sistem-SKPI`, mencakup frontend Next.js dan backend Express.js.

## 1. Ikhtisar Sistem

`Sistem-SKPI` adalah aplikasi manajemen Surat Keterangan Pendamping Ijazah untuk Institut Shanti Bhuana.

- Frontend: `Sistem-SKPI/frontend`
- Backend: `Sistem-SKPI/backend`
- Database: MySQL via Prisma
- Autentikasi: session-based (express-session + MySQL store)
- Komunikasi: frontend memanggil backend melalui API `http://localhost:5000`
- File upload: foto profil, bukti kegiatan, template SKPI
- Fitur khusus: generate PDF SKPI, notifikasi real-time, mode demo fallback, pengajuan SKPI mahasiswa

## 2. Frontend (Next.js)

### 2.1 Struktur utama

- `frontend/package.json` = dependensi Next.js, React, jsPDF, lucide-react, xlsx, mammoth
- `frontend/src/app` = aplikasi App Router Next.js
  - `page.js` = landing page / login
  - `layout.js` = root layout global
  - `admin/` = route group admin
  - `mahasiswa/` = route group mahasiswa
  - `lupa-password/` = halaman lupa password

- `frontend/src/components` = reusable components UI:
  - `AvatarCropModal.jsx` = crop + preview foto profil
  - `PreviewModal.jsx` = modal preview

- `frontend/src/context` = state global:
  - `MahasiswaContext.js` = provider dan hook untuk data mahasiswa, auth, profile, avatar, logout

- `frontend/src/lib` = utilitas layanan:
  - `api.js` = API helper utama, fetch wrapper, mock mode fallback
  - `api_sicp.js` = file utilitas kosong untuk tambahan khusus SKPI
  - `masterData.js` = master data dropdown dan cache fallback
  - `prodi-config.js` = konfigurasi warna/branding per prodi
  - `prodi-templates.js` = template prodi
  - `skpi-pdf.js` = generator PDF SKPI klien menggunakan jsPDF
  - `template-sections.js` = struktur bagian SKPI

- `frontend/public` = aset statis
  - `img/` = logo, avatar default
  - `uploads/avatars/` = folder upload / placeholder

- `frontend/.env.example` dan `frontend/.env.local` = konfigurasi `NEXT_PUBLIC_API_URL`

### 2.2 Arsitektur fitur frontend

- Login support admin dan mahasiswa (deteksi username/NIM otomatis)
- Sidebar dan topbar admin dengan notifikasi
- Dashboard admin: statistik, manajemen mahasiswa, master data, generate SKPI
- Dashboard mahasiswa: profil, pengajuan, kegiatan, panduan, notifikasi
- Upload avatar dengan crop dan validasi ukuran/format
- Mode demo ketika backend tidak tersedia
- Render PDF SKPI secara client-side
- Dropdown master data terpusat untuk form
- UI reuse di `src/components` dengan styling modul CSS

### 2.3 Hubungan ke backend

Frontend memanggil API backend melalui `src/lib/api.js`:

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/auth/profile`
- `PATCH /api/auth/profile`
- `POST /api/auth/avatar`
- `GET /api/mahasiswa` dan route mahasiswa lainnya
- `GET /api/master-data` untuk opsi form

> Untuk detail frontend lebih lengkap, lihat `frontend/FRONTEND-ARHITEKTUR.md`.

## 3. Backend (Express.js)

### 3.1 Struktur utama

- `backend/package.json` = dependensi Express, Prisma, bcryptjs, cors, cookie-parser, multer, mysql2, docx, mammoth
- `backend/server.js` = entry point Express
- `backend/prisma/schema.prisma` = model database
- `backend/prisma/seed.js` = seed data awal
- `backend/prisma/migrations/` = riwayat migrasi
- `backend/src/lib/prisma.js` = Prisma client singleton
- `backend/src/middleware/auth.js` = middleware admin auth
- `backend/src/middleware/mahasiswaAuth.js` = middleware mahasiswa auth
- `backend/src/routes/` = semua route API
- `backend/src/utils/` = notifikasi, SSE, generate DOCX/PDF
- `backend/public/uploads/` = penyimpanan file upload
- `backend/.env.example` = konfigurasi database, session, CORS

### 3.2 Mekanisme auth

- Session-based auth menggunakan `express-session`
- Session disimpan di MySQL melalui `express-mysql-session`
- Admin dan mahasiswa terpisah dengan role `admin` dan `mahasiswa`
- Middleware validasi menyuntikkan `req.user` atau `req.mahasiswa`

### 3.3 Endpoint utama backend

#### Auth Admin
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/auth/profile`
- `PATCH /api/auth/profile`
- `POST /api/auth/avatar`

#### Admin
- `GET /api/admin/stats`
- `GET /api/admin/notifikasi`
- `PATCH /api/admin/notifikasi/baca-semua`
- `PATCH /api/admin/notifikasi/:id/baca`
- `DELETE /api/admin/notifikasi/:id`
- `GET /api/admin/profile`
- `PATCH /api/admin/profile`
- `POST /api/admin/password`
- CRUD admin akun
- CRUD akun mahasiswa via admin

#### Aktivitas dan Verifikasi
- `GET /api/aktivitas`
- `GET /api/aktivitas/:id`
- `PATCH /api/aktivitas/:id/verifikasi`

#### Master Data
- `GET /api/master-data`
- CRUD jenis aktivitas, kategori, kelompok, level, posisi, periode akademik

#### SKPI / Template
- `GET /api/skpi`
- `GET /api/skpi/riwayat`
- `GET /api/skpi/template`
- `POST /api/skpi/template`
- `/api/template-skpi/*` untuk upload, preview, dan manajemen template

#### Mahasiswa Auth
- `POST /api/mahasiswa/auth/login`
- `POST /api/mahasiswa/auth/logout`
- `GET /api/mahasiswa/auth/me`
- `GET /api/mahasiswa/auth/profile`
- `PATCH /api/mahasiswa/auth/profile`
- `POST /api/mahasiswa/auth/avatar`
- `PATCH /api/mahasiswa/auth/password`

#### Mahasiswa Kegiatan
- `GET /api/mahasiswa/kegiatan`
- `POST /api/mahasiswa/kegiatan`
- `GET /api/mahasiswa/kegiatan/:id`
- `PATCH /api/mahasiswa/kegiatan/:id`
- `DELETE /api/mahasiswa/kegiatan/:id`
- `POST /api/mahasiswa/kegiatan/:id/bukti`

#### Mahasiswa Pengajuan
- `GET /api/mahasiswa/pengajuan`
- `GET /api/mahasiswa/pengajuan/riwayat`
- `GET /api/mahasiswa/pengajuan/icp`
- `POST /api/mahasiswa/pengajuan`

#### Mahasiswa Notifikasi
- `GET /api/mahasiswa/notifikasi`
- `PATCH /api/mahasiswa/notifikasi/baca-semua`
- `PATCH /api/mahasiswa/notifikasi/:id/baca`
- `DELETE /api/mahasiswa/notifikasi/:id`
- `DELETE /api/mahasiswa/notifikasi`

#### Mahasiswa Master Data
- `GET /api/mahasiswa/master-data`

### 3.4 Fitur utama backend

- Session management untuk admin dan mahasiswa
- Login/logout dan validasi role
- CRUD mahasiswa, admin, kegiatan, master data
- Generate dokumen SKPI (DOCX/PDF) dan template upload
- Notifikasi real-time via SSE
- Upload file: avatar dan bukti kegiatan
- Validasi NIM, username, duplikasi, dan status akun
- Statistik dashboard admin
- Sinkronisasi, notifikasi, dan logs sederhana

### 3.5 Setup backend

1. `npm install`
2. `cp .env.example .env`
3. `npm run db:generate`
4. `npm run db:migrate`
5. `npm run seed` (opsional)
6. `npm run dev`

> Pastikan MySQL XAMPP berjalan dan database `skpi_db` aktif.

## 4. Koneksi FE ↔ BE

- Frontend `NEXT_PUBLIC_API_URL` diset ke backend `http://localhost:5000`
- Semua request API melampirkan `credentials: include` untuk cookie session
- Backend menyajikan file upload di `/uploads`
- Frontend fallback ke mode demo ketika backend tidak tersedia
- Backend CORS mengizinkan `FRONTEND_URL=http://localhost:3000`

## 5. Folder penting dan fungsinya

### `frontend`
- `src/app` = halaman dan route Next.js
- `src/components` = UI komponen reusable
- `src/context` = provider state global mahasiswa
- `src/lib` = helper API, data master, konfigurasi, PDF generator
- `public/` = aset statis dan upload frontend
- `.env.local` = alamat backend

### `backend`
- `server.js` = konfigurasi Express dan route register
- `src/lib/prisma.js` = koneksi Prisma singleton
- `src/middleware` = auth middleware admin & mahasiswa
- `src/routes` = semua endpoint API
- `src/utils` = helper notifikasi, SSE, dokumen
- `prisma/schema.prisma` = model database
- `public/uploads` = penyimpanan file upload

## 6. Ringkasan fitur sistem

### FE
- Login admin/mahasiswa
- Dashboard admin & mahasiswa
- Profil dan update akun
- Upload avatar + crop
- Pengajuan kegiatan mahasiswa
- Pengajuan SKPI mahasiswa
- Notifikasi dan history
- Generate PDF SKPI
- Mode demo offline

### BE
- Session-based auth
- Admin & mahasiswa role check
- CRUD mahasiswa dan master data
- Verifikasi kegiatan admin
- Generate dokumen SKPI
- Template SKPI upload & convert
- Notifikasi SSE
- File upload avatar/bukti
- Statistik dashboard

---

Dokumentasi ini mencakup arsitektur dan fitur utama seluruh sistem `Sistem-SKPI`.
