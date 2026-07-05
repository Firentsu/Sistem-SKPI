# Dokumentasi Integrasi & Sinkronisasi SICP — Sistem SKPI

Institut Shanti Bhuana · Modul integrasi data mahasiswa & poin ICP dari sistem **SICP**
(*Student Integrity Credit Point*) ke sistem **SKPI**.

Berkas sumber terkait:
- Endpoint sinkronisasi (backend) — [`src/routes/sicpSync.js`](src/routes/sicpSync.js)
- Klien SICP (backend) — [`src/utils/sicpClient.js`](src/utils/sicpClient.js)
- Klien pemanggil (frontend) — [`../frontend/src/lib/api_sicp.js`](../frontend/src/lib/api_sicp.js)
- Skema basis data — [`prisma/schema.prisma`](prisma/schema.prisma)
- Riwayat migrasi — [`prisma/migrations/`](prisma/migrations/)

---

## 1. Arsitektur Integrasi

Frontend **tidak pernah** memanggil SICP secara langsung. Backend SKPI bertindak sebagai
*proxy* yang menyimpan kredensial, login otomatis, menarik data, lalu meng-*upsert* ke
basis data SKPI. Dengan pola ini token/kredensial SICP tidak pernah bocor ke browser.

```
┌──────────────┐   cookie session   ┌────────────────────┐   JWT Bearer    ┌──────────────┐
│  Frontend    │  ───────────────▶  │   Backend SKPI     │  ────────────▶  │  Sistem SICP │
│ (admin UI)   │   /api/sicp-sync   │  (proxy + upsert)  │  /auth/login    │  (via         │
│ api_sicp.js  │  ◀───────────────  │  sicpClient.js     │  /icp/balance/  │   Tailscale)  │
└──────────────┘   hasil sinkron    └─────────┬──────────┘   ranking       └──────────────┘
                                              │ Prisma upsert
                                              ▼
                                   ┌────────────────────────┐
                                   │  DB SKPI (MySQL)        │
                                   │  mahasiswa · users ·    │
                                   │  icpmahasiswa           │
                                   └────────────────────────┘
```

Alur ringkas:
1. Admin menekan tombol *Test / Sinkron* di UI → `api_sicp.js` memanggil `/api/sicp-sync/*`.
2. Backend (`sicpClient.js`) login ke SICP (`POST /auth/login`), meng-*cache* JWT selama ±50 menit.
3. Backend menarik data ranking saldo (`GET /icp/balance/ranking`) — satu panggilan berisi
   identitas mahasiswa **sekaligus** total poin ICP.
4. Backend meng-*upsert* ke tabel `mahasiswa`, `users`, dan `icpmahasiswa`.
5. Hasil (jumlah dibuat/diperbarui/gagal) dikembalikan ke frontend sebagai JSON.

---

## 2. Endpoint Sinkronisasi SICP (Backend SKPI)

Prefix: **`/api/sicp-sync`** — seluruh endpoint memerlukan **sesi admin** (`requireAuth`).

| # | Method | Path | Fungsi | Mengubah data? |
|---|--------|------|--------|----------------|
| 1 | `GET`  | `/api/sicp-sync/test`      | Cek koneksi + autentikasi ke SICP | Tidak (read-only) |
| 2 | `POST` | `/api/sicp-sync/mahasiswa` | Sinkron data mahasiswa (buat/update akun) | Ya |
| 3 | `POST` | `/api/sicp-sync/icp`       | Sinkron total poin ICP (dicocokkan per NIM) | Ya |
| 4 | `POST` | `/api/sicp-sync/both`      | Sinkron keduanya (mahasiswa lalu ICP) | Ya |

### 2.1 `GET /api/sicp-sync/test` — Uji Koneksi
Memastikan konfigurasi ada (`isSicpConfigured`), login berhasil, dan membaca sampel data.

**Respons sukses (200):**
```json
{
  "success": true,
  "baseUrl": "http://<host-sicp>:<port>",
  "sampleCount": 42,
  "sample": [
    { "nim": "2021001", "nama": "Budi", "nama_jurusan": "Teknik Informatika", "jurusan_id": 3, "total_icp": 80 }
  ]
}
```

### 2.2 `POST /api/sicp-sync/mahasiswa` — Sinkron Mahasiswa
Untuk tiap mahasiswa dari SICP: memetakan `nama_jurusan → id_prodi` (cocokkan *exact* lalu
*partial*, tanpa peduli huruf besar/kecil), lalu:
- Jika NIM sudah ada → **update** (`nama`, `id_prodi`).
- Jika belum ada → **create** mahasiswa + akun `users` (username = NIM, password default = NIM di-hash, role `mahasiswa`).

**Respons (200):**
```json
{
  "success": true,
  "mahasiswa": { "total": 42, "created": 5, "updated": 37, "failed": 0, "errors": [] }
}
```

### 2.3 `POST /api/sicp-sync/icp` — Sinkron Poin ICP
Mencocokkan mahasiswa **berdasarkan NIM**. SICP saat ini hanya memberi **total** poin ICP,
sehingga total dibagi **merata ke 6 kategori ISB** (`id_icp` 1–6 = Fisik, Iman,
Intelektualitas, Kepribadian, Keterampilan, Moral) memakai fungsi `splitEven()` sebagai
*placeholder*. Baris ICP lama dihapus (`deleteMany`) lalu 6 baris baru dibuat (`createMany`).

> Catatan: begitu SICP menyediakan endpoint poin **per-kategori**, bagian pembagian merata
> ini diganti dengan nilai asli.

**Respons (200):**
```json
{
  "success": true,
  "icp": { "total": 42, "updated": 40, "notFound": 2, "failed": 0, "errors": [] }
}
```

### 2.4 `POST /api/sicp-sync/both` — Sinkron Keduanya
Menjalankan sinkron mahasiswa **lebih dulu** (agar akun ada), lalu sinkron ICP.
Respons berisi objek `mahasiswa` dan `icp` sekaligus.

### 2.5 Penanganan Error
| Kondisi | HTTP | `code` |
|---------|------|--------|
| `SICP_API_URL`/kredensial kosong | 400 | `SICP_NOT_CONFIGURED`, `SICP_NO_CREDENTIALS` |
| Gagal menghubungi / login / request SICP | 502 | `SICP_UNREACHABLE`, `SICP_LOGIN_FAILED`, `SICP_REQUEST_FAILED` |
| Belum login (sesi admin) | 401 | — |

---

## 3. Endpoint SICP Eksternal yang Dikonsumsi

Dipanggil oleh `sicpClient.js` (semua butuh JWT Bearer kecuali login).

| Method | Path (relatif `SICP_API_URL`) | Kegunaan | Autentikasi |
|--------|-------------------------------|----------|-------------|
| `POST` | `/auth/login`                 | Ambil JWT token | username + password |
| `GET`  | `/icp/balance/ranking?limit=100` | Daftar mahasiswa aktif + total ICP | `Bearer <token>` |

**Bentuk item response `/icp/balance/ranking`** (dipetakan ke bentuk netral internal):

| Field SICP | Dipetakan ke | Keterangan |
|------------|--------------|------------|
| `username` \| `nim` \| `user_id` | `nim` | NIM mahasiswa |
| `nama` \| `name` \| `full_name`  | `nama` | Nama lengkap |
| `nama_jurusan` \| `jurusan`      | `nama_jurusan` | Nama prodi (untuk resolusi `id_prodi`) |
| `jurusan_id`                     | `jurusan_id` | ID jurusan cadangan |
| `total_icp` \| `total_poin` \| `balance` \| `poin` | `total_icp` | Total poin ICP |

Catatan perilaku SICP: ranking hanya memuat mahasiswa **berstatus aktif** dan dibatasi
`limit` (maks 100 di sisi SICP).

---

## 4. Konfigurasi

### 4.1 Variabel Lingkungan (`backend/.env`)
| Kunci | Wajib | Default | Keterangan |
|-------|:----:|---------|------------|
| `SICP_API_URL`        | ✅ | — | Base URL SICP (via Tailscale) |
| `SICP_USERNAME`       | ✅¹ | — | Username admin SICP (login otomatis) |
| `SICP_PASSWORD`       | ✅¹ | — | Password admin SICP |
| `SICP_TOKEN`          | ➖ | — | Token statis cadangan (jika tak pakai username/password) |
| `SICP_RANKING_LIMIT`  | ➖ | `100` | Batas jumlah baris ranking |
| `SICP_ICP_CATEGORY_ID`| ➖ | — | ID kategori ICP (cadangan untuk pengembangan) |

¹ Minimal salah satu: pasangan `SICP_USERNAME`+`SICP_PASSWORD` **atau** `SICP_TOKEN`.
Token hasil login di-*cache* `TOKEN_TTL` = 50 menit dan diperbarui otomatis saat 401.

### 4.2 Tabel `tailscale_config` (disiapkan, belum aktif)
Migrasi `20260702132242_db` menambahkan tabel `tailscale_config` (kolom: `api_url`,
`api_key`, `mahasiswa_ep` default `/api/users/by-role/mahasiswa`, `icp_ep` default
`/api/icp/balance/ranking`, `updated_at`, `updated_by`) sebagai opsi menyimpan konfigurasi
di basis data. **Klien aktif saat ini masih membaca konfigurasi dari `.env`**, bukan dari
tabel ini.

---

## 5. Riwayat Migrasi Basis Data (Prisma)

Provider: **MySQL** (`migration_lock.toml`). Tiga migrasi berurutan:

| # | Nama Migrasi | Tanggal¹ | Ringkasan Perubahan |
|---|--------------|----------|---------------------|
| 1 | `20260325084236_init` | 25 Mar | Skema awal — membuat **22 tabel** |
| 2 | `20260326024133_add_admin_avatar` | 26 Mar | Kolom `avatar` & `is_active` pada `Admin`; indeks unik `Admin_id_user_key` |
| 3 | `20260702132242_db` | 02 Jul | Kolom kelulusan pada `Mahasiswa` + tabel baru `tailscale_config` |

¹ Prefiks nama migrasi berformat `YYYYMMDDHHMMSS`.

### 5.1 `20260325084236_init` — Skema Awal (301 baris)
Membuat 22 tabel inti sistem:

```
Users · Mahasiswa · Admin · ProgramStudi · JenisAktivitas · KategoriAktivitas ·
KelompokAktivitas · LevelKegiatan · PosisiKegiatan · PeriodeAkademik ·
KegiatanMahasiswa · BuktiKegiatan · IcpKategori · IcpMahasiswa · Notifikasi ·
PengajuanSkpi · Skpi · RiwayatSkpi · Cpl · TemplateSkpi · SectionTemplate ·
TandaTanganDigital
```

Tabel yang relevan untuk integrasi SICP: **`Mahasiswa`**, **`Users`**, **`IcpKategori`**,
**`IcpMahasiswa`**.

### 5.2 `20260326024133_add_admin_avatar` (12 baris)
```sql
ALTER TABLE `admin` ADD COLUMN `avatar` VARCHAR(191) NULL,
    ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX `Admin_id_user_key` ON `Admin`(`id_user`);
```

### 5.3 `20260702132242_db` (21 baris)
```sql
ALTER TABLE `mahasiswa` ADD COLUMN `gelar` VARCHAR(191) NULL,
    ADD COLUMN `gelar_eng` VARCHAR(191) NULL,
    ADD COLUMN `nomor_ijazah` VARCHAR(191) NULL,
    ADD COLUMN `tanggal_lulus` DATETIME(3) NULL,
    ADD COLUMN `tanggal_masuk` DATETIME(3) NULL,
    ADD COLUMN `tempat_lahir` VARCHAR(191) NULL,
    ADD COLUMN `tgl_lahir` DATETIME(3) NULL;

CREATE TABLE `tailscale_config` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `api_url` VARCHAR(191) NOT NULL DEFAULT '',
    `api_key` VARCHAR(191) NOT NULL DEFAULT '',
    `mahasiswa_ep` VARCHAR(191) NOT NULL DEFAULT '/api/users/by-role/mahasiswa',
    `icp_ep` VARCHAR(191) NOT NULL DEFAULT '/api/icp/balance/ranking',
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` INTEGER NULL,
    PRIMARY KEY (`id`)
);
```

### 5.4 Cara Memeriksa Status Migrasi (untuk bukti laporan)
```bash
cd backend
npx prisma migrate status
```

---

## 6. Model Data Terkait Sinkronisasi

| Tabel | Kolom kunci | Diisi oleh |
|-------|-------------|-----------|
| `mahasiswa`   | `nim`, `nama`, `id_prodi`, `id_user` | `runMahasiswaSync` |
| `users`       | `username` (=NIM), `password` (hash NIM), `role='mahasiswa'` | `runMahasiswaSync` |
| `icpkategori` | `id_icp` 1–6 (Fisik…Moral), `bobot_poin` | seed (`prisma/seed.js`) |
| `icpmahasiswa`| `id_mahasiswa`, `id_icp`, `total_poin` | `runIcpSync` (bagi rata 6 kategori) |
