# Dokumentasi API — Sistem SKPI

Institut Shanti Bhuana · REST API backend Sistem SKPI (Surat Keterangan Pendamping Ijazah).

## 1. Informasi Umum

| Aspek | Keterangan |
|-------|-----------|
| **Base URL** | `http://<host>:5000` (dev: `http://127.0.0.1:5000`) |
| **Prefix** | Semua endpoint diawali `/api` |
| **Format** | Request & response **JSON** (kecuali unggah berkas → `multipart/form-data`, unduh → biner) |
| **Autentikasi** | `express-session` + cookie `skpi_session` (disimpan di MySQL). **Tanpa JWT.** |
| **Peran (role)** | **Admin** (`requireAuth`) dan **Mahasiswa** (`requireMahasiswaAuth`) — sesi terpisah |
| **Realtime** | Notifikasi via **SSE** (`/sse`) |

### Kode Status
| Kode | Arti |
|------|------|
| `200` | Berhasil |
| `201` | Data berhasil dibuat |
| `400` | Permintaan tidak valid (validasi gagal) |
| `401` | Belum login / sesi tidak valid |
| `403` | Login tetapi tidak berhak (mis. akun nonaktif / bukan admin) |
| `404` | Data tidak ditemukan |
| `409` | Konflik (mis. username sudah dipakai, relasi masih terpakai) |
| `500` | Kesalahan server |
| `502` | Gangguan sistem eksternal (SICP) |

### Peta Modul
| Prefix | Modul | Peran |
|--------|-------|-------|
| `/api/health` | Health check | Publik |
| `/api/auth` | Autentikasi admin | Publik/Admin |
| `/api/admin` | Manajemen admin, dashboard, notifikasi | Admin |
| `/api/aktivitas` | Verifikasi kegiatan mahasiswa | Admin |
| `/api/skpi` | Generasi & manajemen dokumen SKPI | Admin |
| `/api/icp` | Kategori & poin ICP | Admin |
| `/api/master-data` | Data master (jenis, kategori, prodi, dll.) | Admin |
| `/api/template-skpi` | Template dokumen SKPI per prodi | Admin |
| `/api/sicp-sync` | Integrasi & sinkronisasi SICP | Admin |
| `/api/mahasiswa` | Manajemen data mahasiswa | Admin |
| `/api/mahasiswa/auth` | Autentikasi mahasiswa | Publik/Mahasiswa |
| `/api/mahasiswa/kegiatan` | Kegiatan milik mahasiswa | Mahasiswa |
| `/api/mahasiswa/pengajuan` | Pengajuan SKPI mahasiswa | Mahasiswa |
| `/api/mahasiswa/notifikasi` | Notifikasi mahasiswa | Mahasiswa |
| `/api/mahasiswa/master-data` | Data master untuk form mahasiswa | Mahasiswa |

> Detail integrasi SICP dipisah di **[DOKUMENTASI-INTEGRASI-SICP.md](DOKUMENTASI-INTEGRASI-SICP.md)**.

---

## 2. Health Check

| Method | Path | Auth | Deskripsi |
|--------|------|:----:|-----------|
| `GET` | `/api/health` | — | Cek server hidup |

---

## 3. Autentikasi Admin — `/api/auth`

| Method | Path | Auth | Deskripsi |
|--------|------|:----:|-----------|
| `GET`   | `/cek-akun?username=` | — | Cek ketersediaan/keberadaan akun |
| `POST`  | `/login`   | — | Login admin (`{ username, password }`) → set cookie sesi |
| `POST`  | `/logout`  | Admin | Logout, hapus sesi |
| `GET`   | `/me`      | Admin | Data user sesi aktif |
| `GET`   | `/profile` | Admin | Ambil profil admin |
| `PATCH` | `/profile` | Admin | Update username / email / password |
| `POST`  | `/avatar`  | Admin | Unggah foto profil (`multipart`, field `avatar`) |
| `DELETE`| `/avatar`  | Admin | Hapus foto profil |
| `GET`   | `/sse`     | Admin | Stream notifikasi realtime (Server-Sent Events) |

---

## 4. Admin — `/api/admin`

| Method | Path | Auth | Deskripsi |
|--------|------|:----:|-----------|
| `GET`    | `/stats` | Admin | Statistik dashboard + per prodi. Query: `?prodi=<id_prodi>` |
| `GET`    | `/notifikasi?limit=` | Admin | Daftar notifikasi admin login |
| `PATCH`  | `/notifikasi/baca-semua` | Admin | Tandai semua notifikasi terbaca |
| `PATCH`  | `/notifikasi/:id/baca` | Admin | Tandai satu notifikasi terbaca |
| `DELETE` | `/notifikasi/:id` | Admin | Hapus satu notifikasi |
| `DELETE` | `/notifikasi` | Admin | Hapus semua notifikasi terbaca |
| `GET`    | `/profile` | Admin | Profil admin login |
| `PATCH`  | `/profile` | Admin | Update nama admin |
| `POST`   | `/password` | Admin | Ganti password (`{ currentPassword, newPassword }`) |
| `GET`    | `/mahasiswa/:id/akun` | Admin | Cek apakah mahasiswa punya akun login |
| `POST`   | `/mahasiswa/:id/akun` | Admin | Buatkan akun login mahasiswa |
| `PATCH`  | `/mahasiswa/:id/akun` | Admin | Reset password / aktif-nonaktifkan akun (`{ action }`) |
| `GET`    | `/admins?q=&page=` | Admin | Daftar admin (paginasi + pencarian) |
| `POST`   | `/admins` | Admin | Tambah admin baru |
| `PATCH`  | `/admins/:id` | Admin | Edit admin |
| `DELETE` | `/admins/:id` | Admin | Hapus admin |
| `POST`   | `/admins/:id/reset` | Admin | Reset password admin |

---

## 5. Kegiatan Mahasiswa (verifikasi admin) — `/api/aktivitas`

| Method | Path | Auth | Deskripsi |
|--------|------|:----:|-----------|
| `GET`   | `/` | Admin | Daftar kegiatan. Query: `?status=diproses\|disetujui\|ditolak\|revisi&mahasiswa_id=&page=` |
| `GET`   | `/:id` | Admin | Detail satu kegiatan |
| `PATCH` | `/:id/verifikasi` | Admin | Verifikasi kegiatan (setujui/tolak/revisi) |

---

## 6. Dokumen SKPI — `/api/skpi`

| Method | Path | Auth | Deskripsi |
|--------|------|:----:|-----------|
| `GET`  | `/` | Admin | Daftar SKPI. Query: `?status=draft\|resmi&mahasiswa_id=&page=` |
| `GET`  | `/riwayat` | Admin | Riwayat SKPI |
| `GET`  | `/template` | Admin | Ambil konfigurasi template |
| `POST` | `/template` | Admin | Simpan konfigurasi template |
| `POST` | `/generate` | Admin | Generate dokumen SKPI mahasiswa |
| `PATCH`| `/:id/status` | Admin | Ubah status SKPI (draft/resmi) |
| `GET`  | `/download/:mahasiswaId` | Admin | Unduh dokumen SKPI (.docx) |
| `GET`  | `/preview-docx/:mahasiswaId` | Admin | Pratinjau dokumen (.docx) |
| `GET`  | `/preview-pdf/:mahasiswaId` | Admin | Pratinjau dokumen (.pdf) |

---

## 7. ICP (Indeks Capaian Pembelajaran) — `/api/icp`

| Method | Path | Auth | Deskripsi |
|--------|------|:----:|-----------|
| `GET`    | `/` | Admin | Daftar semua kategori ICP |
| `GET`    | `/summary?page=` | Admin | Ringkasan total poin ICP semua mahasiswa |
| `GET`    | `/mahasiswa/:mahasiswa_id` | Admin | ICP satu mahasiswa + total poin |
| `PUT`    | `/mahasiswa/:mahasiswa_id` | Admin | Set/update poin ICP (`{ items:[{id_icp,total_poin}] }`) |
| `POST`   | `/` | Admin | Tambah kategori ICP |
| `PATCH`  | `/:id` | Admin | Update kategori ICP |
| `DELETE` | `/:id` | Admin | Hapus kategori ICP |

---

## 8. Data Master — `/api/master-data`

| Method | Path | Auth | Deskripsi |
|--------|------|:----:|-----------|
| `GET` | `/` | Admin | Semua data master sekaligus (jenis, kategori, kelompok, level, posisi, periode, prodi) |

**CRUD per entitas** — pola berulang **`GET` / `POST` / `PATCH /:id` / `DELETE /:id`** untuk tiap path berikut:

| Path dasar | Entitas |
|------------|---------|
| `/jenis-aktivitas` | Jenis aktivitas |
| `/kategori-aktivitas` | Kategori aktivitas |
| `/kelompok-aktivitas` | Kelompok aktivitas |
| `/level-kegiatan` | Level/tingkat kegiatan |
| `/posisi-kegiatan` | Posisi/peran kegiatan |
| `/periode-akademik` | Periode akademik |
| `/prodi` | Program studi (`{ nama_prodi, fakultas }`) |

Contoh: `GET /api/master-data/prodi`, `POST /api/master-data/prodi`, `PATCH /api/master-data/prodi/:id`, `DELETE /api/master-data/prodi/:id`.

---

## 9. Template SKPI — `/api/template-skpi`

| Method | Path | Auth | Deskripsi |
|--------|------|:----:|-----------|
| `POST`   | `/upload` | Admin | Unggah template `.docx` (auto-convert ke PDF) |
| `GET`    | `/list` | Admin | Daftar template |
| `GET`    | `/preview/:slug` | Admin | Serve PDF pratinjau template |
| `DELETE` | `/:slug` | Admin | Hapus template |
| `POST`   | `/cpl/:slug` | Admin | Simpan data CPL untuk template |
| `GET`    | `/cpl/:slug` | Admin | Ambil data CPL template |

---

## 10. Integrasi SICP — `/api/sicp-sync`

| Method | Path | Auth | Deskripsi |
|--------|------|:----:|-----------|
| `GET`  | `/test` | Admin | Uji koneksi + autentikasi ke SICP (read-only) |
| `POST` | `/mahasiswa` | Admin | Sinkron data mahasiswa dari SICP |
| `POST` | `/icp` | Admin | Sinkron total poin ICP dari SICP |
| `POST` | `/both` | Admin | Sinkron mahasiswa lalu ICP |

> Rincian lengkap (payload SICP, pemetaan field, konfigurasi `.env`) → **[DOKUMENTASI-INTEGRASI-SICP.md](DOKUMENTASI-INTEGRASI-SICP.md)**.

---

## 11. Manajemen Mahasiswa (admin) — `/api/mahasiswa`

| Method | Path | Auth | Deskripsi |
|--------|------|:----:|-----------|
| `GET`    | `/` | Admin | Daftar mahasiswa. Query: `?q=&prodi=&page=` |
| `GET`    | `/:id` | Admin | Detail satu mahasiswa |
| `POST`   | `/` | Admin | Tambah mahasiswa |
| `PATCH`  | `/:id` | Admin | Edit mahasiswa |
| `POST`   | `/bulk` | Admin | Impor massal mahasiswa (mis. dari Excel) |
| `DELETE` | `/:id` | Admin | Hapus mahasiswa |

---

## 12. Autentikasi Mahasiswa — `/api/mahasiswa/auth`

| Method | Path | Auth | Deskripsi |
|--------|------|:----:|-----------|
| `GET`    | `/cek-akun?username=` | — | Cek keberadaan akun mahasiswa |
| `POST`   | `/login` | — | Login mahasiswa (`{ nim, password }`) |
| `POST`   | `/logout` | Mahasiswa | Logout |
| `GET`    | `/me` | Mahasiswa | Data sesi aktif |
| `GET`    | `/profile` | Mahasiswa | Profil lengkap mahasiswa |
| `PATCH`  | `/profile` | Mahasiswa | Update username / email |
| `PATCH`  | `/biodata` | Mahasiswa | Update biodata (tempat/tgl lahir, dll.) |
| `POST`   | `/avatar` | Mahasiswa | Unggah foto profil |
| `DELETE` | `/avatar` | Mahasiswa | Hapus foto profil |
| `PATCH`  | `/password` | Mahasiswa | Ganti password |
| `GET`    | `/sse` | Mahasiswa | Stream notifikasi realtime (SSE) |

---

## 13. Kegiatan Mahasiswa (milik sendiri) — `/api/mahasiswa/kegiatan`

| Method | Path | Auth | Deskripsi |
|--------|------|:----:|-----------|
| `GET`    | `/` | Mahasiswa | Daftar kegiatan milik mahasiswa ini |
| `POST`   | `/` | Mahasiswa | Ajukan kegiatan baru |
| `GET`    | `/:id` | Mahasiswa | Detail satu kegiatan |
| `PATCH`  | `/:id` | Mahasiswa | Edit kegiatan (hanya status `diproses`/`revisi`) |
| `DELETE` | `/:id` | Mahasiswa | Hapus kegiatan (hanya status `diproses`/`revisi`) |
| `POST`   | `/:id/bukti` | Mahasiswa | Unggah bukti kegiatan (`multipart`) |

---

## 14. Pengajuan SKPI Mahasiswa — `/api/mahasiswa/pengajuan`

| Method | Path | Auth | Deskripsi |
|--------|------|:----:|-----------|
| `GET`  | `/` | Mahasiswa | Status pengajuan milik mahasiswa ini |
| `GET`  | `/riwayat` | Mahasiswa | Riwayat semua pengajuan |
| `GET`  | `/icp` | Mahasiswa | Poin ICP mahasiswa (untuk pengajuan) |
| `GET`  | `/download` | Mahasiswa | Unduh dokumen SKPI mahasiswa |
| `POST` | `/` | Mahasiswa | Ajukan SKPI (hanya jika belum ada pengajuan aktif) |

---

## 15. Notifikasi Mahasiswa — `/api/mahasiswa/notifikasi`

| Method | Path | Auth | Deskripsi |
|--------|------|:----:|-----------|
| `GET`    | `/` | Mahasiswa | Daftar notifikasi |
| `PATCH`  | `/baca-semua` | Mahasiswa | Tandai semua terbaca |
| `PATCH`  | `/:id/baca` | Mahasiswa | Tandai satu terbaca |
| `DELETE` | `/:id` | Mahasiswa | Hapus satu notifikasi |
| `DELETE` | `/` | Mahasiswa | Hapus semua notifikasi terbaca |

---

## 16. Data Master Mahasiswa — `/api/mahasiswa/master-data`

| Method | Path | Auth | Deskripsi |
|--------|------|:----:|-----------|
| `GET` | `/` | Mahasiswa | Data master untuk form (jenis, kategori, kelompok, level, posisi, periode, prodi) |

---

## Lampiran — Uji Endpoint Otomatis

Skrip pengujian tanpa Postman (mencetak hasil rapi untuk bukti/tangkap layar laporan):

```bash
cd backend
node uji-endpoint.mjs            # uji 20+ endpoint utama (admin & mahasiswa)
node uji-keamanan.mjs            # uji 6 skenario kontrol keamanan (Tabel 3.8)
node uji-sinkronisasi-sicp.mjs   # uji koneksi & sinkronisasi SICP
```
