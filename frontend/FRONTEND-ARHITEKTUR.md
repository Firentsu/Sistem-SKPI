# Frontend Arsitektur SKPI

Dokumentasi ini menjelaskan arsitektur frontend Next.js, fungsi folder, dan fitur utama yang dikembangkan untuk aplikasi `Sistem-SKPI`.

## 🧱 Arsitektur Frontend yang Dikembangkan

Frontend dibangun sebagai aplikasi **Next.js 16** dengan App Router dan React 19.

Komponen utama:

- `next` + App Router untuk route-based rendering.
- `React` untuk UI interaktif.
- `axios` / `fetch` untuk HTTP request ke backend.
- `jsPDF` untuk generate file PDF SKPI di sisi klien.
- `lucide-react` untuk ikon UI.
- `xlsx`, `docx-preview`, `mammoth` untuk handling dokumen dan preview (jika diperlukan).

### Model arsitektur

- `src/app` = root aplikasi, layout global, halaman login, dan route group untuk `admin` dan `mahasiswa`.
- `src/components` = reusable UI components seperti modal crop avatar dan preview modal.
- `src/context` = provider React untuk state aplikasi, khususnya `MahasiswaContext`.
- `src/lib` = library utilitas dan layanan: API helper, data master, konfigurasi prodi, PDF generator, template SKPI.

### Pola teknis

- Halaman bersifat **server/client hybrid** dengan `use client` di halaman yang memerlukan interaksi.
- `src/lib/api.js` adalah lapisan API sentral untuk semua komunikasi backend.
- Fallback **mode demo** otomatis saat backend tidak tersedia.
- State global terbatas di `src/context/MahasiswaContext.js` untuk data mahasiswa.
- `src/app/admin/layout.js` menjadi layout utama admin dengan sidebar, topbar, avatar, dan notifikasi.

## 📁 Komentar Folder Utama

- `src/app`:
  - `page.js` = landing page / login.
  - `globals.css` = gaya global aplikasi.
  - `lupa-password/` = halaman reset password.
  - `admin/` = semua halaman dashboard admin, pengelolaan data, dan layout admin.
  - `mahasiswa/` = halaman dashboard mahasiswa, profil, pengajuan, panduan.

- `src/components`:
  - `AvatarCropModal.jsx` = komponen crop dan preview upload avatar.
  - `PreviewModal.jsx` = modal preview file / konten.

- `src/context`:
  - `MahasiswaContext.js` = provider untuk autentikasi mahasiswa, pengambilan profil, update profil, upload avatar, dan logout.

- `src/lib`:
  - `api.js` = helper API utama, mock fallback, login, logout, profile, dan request lainnya.
  - `api_sicp.js` = file utilitas kosong saat ini, tempat tambahan API khusus SKPI.
  - `masterData.js` = data master referensi, cache, dan fallback ketika backend tidak bisa diakses.
  - `prodi-config.js` = konfigurasi warna dan branding per program studi.
  - `prodi-templates.js` = template khusus prodi (pengaturan konten per prodi).
  - `skpi-pdf.js` = generator PDF SKPI klien menggunakan jsPDF.
  - `template-sections.js` = struktur bagian SKPI yang terpakai dalam pencetakan.

- `public/`:
  - `img/` = aset gambar statis, logo, avatar default.
  - `uploads/avatars/` = folder default untuk avatar statis atau upload lokal.

- `.env.example`, `.env.local`:
  - konfigurasi environment variable, terutama `NEXT_PUBLIC_API_URL` untuk koneksi backend.

## 🚀 Fitur-Fitur Utama yang Dikembangkan (Frontend)

### Autentikasi & User Flow

- Login untuk:
  - admin
  - mahasiswa (melalui NIM)
- Support input username/NIM campur dan deteksi tipe login otomatis.
- Tombol show/hide password.
- Link `Lupa password` untuk reset password.
- Redirect otomatis ke halaman yang benar setelah login.
- Logout fungsi untuk membersihkan sesi.

### Mode Demo / Offline

- Jika `NEXT_PUBLIC_API_URL` tidak aktif, frontend otomatis beralih ke **Mode Demo**.
- Login demo admin dan mahasiswa tersedia.
- Memberi banner notifikasi bahwa aplikasi berjalan di mode demo.

### Dashboard Admin

Fitur utama dashboard admin:
- tampilan dashboard statistik.
- manajemen data mahasiswa.
- manajemen master data.
- manajemen kegiatan dan ICP.
- generate SKPI.
- preview dan export PDF SKPI.
- notifikasi realtime / SSE.
- pengelolaan template SKPI.
- halaman `riwayat-skpi`.

### Dashboard Mahasiswa

Fitur utama untuk mahasiswa:
- tampilan dashboard mahasiswa.
- akses profil dan update data pribadi.
- upload / edit avatar.
- panduan penggunaan sistem.
- pengajuan SKPI.
- notifikasi mahasiswa.

### Profil & Avatar

- Profil admin/mahasiswa dapat diambil dan dilihat.
- Update profil langsung melalui API.
- Upload avatar dengan validasi ukuran dan format.
- Crop avatar sebelum upload.

### Integrasi Backend & API

- Semua request backend menggunakan `src/lib/api.js`.
- Fallback mock data saat backend mati (`_mockMode`).
- `getAvatarUrl()` membentuk URL avatar yang benar.
- `apiFetchForm()` untuk upload file form data.

### Data Master & Konfigurasi

- `masterData.js` menyimpan jenis aktivitas, kategori, tingkat prestasi, periode semester, dan mata kuliah penciri.
- `prodi-config.js` menyimpan skema warna/kode prodi untuk tampilan yang konsisten.
- `template-sections.js` menyediakan struktur bagian SKPI.

### Generate PDF SKPI

- `skpi-pdf.js` membuat file PDF SKPI klien menggunakan jsPDF.
- Desain mirip dokumen resmi SKPI dengan frame, tabel, dan style teks.
- Dapat mencetak identitas, capaian pembelajaran, kegiatan, dan poin ICP.

## 🔧 Teknologi & Dependensi Utama

- `next` 16.x
- `react` 19.x
- `lucide-react` untuk ikon
- `jsPDF` untuk PDF
- `axios` / fetch untuk request
- `recharts` untuk grafik data (jika digunakan)
- `xlsx`, `docx-preview`, `mammoth` untuk pemrosesan dokumen

## 📌 Catatan Penting

- Struktur ini sudah mendukung pemisahan admin dan mahasiswa dalam route `src/app/admin` dan `src/app/mahasiswa`.
- `src/app/admin/layout.js` berfungsi sebagai layout global admin dengan sidebar, notifikasi, avatar, dan auth guard.
- `src/context/MahasiswaContext.js` adalah satu-satunya context global utama untuk mahasiswa.
- `src/lib/api.js` adalah titik masuk utama untuk semua integrasi backend.

---

Dokumentasi ini dapat digunakan sebagai acuan tim FE saat mengembangkan, menambah fitur, atau memperbaiki bug di aplikasi `Sistem-SKPI`.
