# SICP — Student Integrity Credit Point (Backend API)

Backend REST API untuk sistem poin integritas mahasiswa.
**Stack:** Node.js + Express 5 + MariaDB (mysql2). Arsitektur **modular per domain**.

---

## Struktur Folder (Modular per Domain)

```
src/
├── app.js                  # Express app + mount semua route modul
│
├── modules/                # ★ Setiap domain berdiri sendiri (route+controller+service+model)
│   ├── auth/               # Login & autentikasi
│   ├── user/               # Kelola user, role, akses super, dosen-management, jurusan-management
│   ├── icp/                # Inti ICP: pengajuan, approval, validasi, saldo, ranking, edit
│   ├── transfer/           # Transfer ICP antar mahasiswa
│   ├── potongan/           # Potongan ICP + limit potongan
│   ├── kegiatan/           # Kegiatan, divisi, kepanitiaan, pendaftaran panitia
│   ├── akademik/           # Mata kuliah, info dosen/mahasiswa, semester, jurusan, kategori
│   ├── unit/               # Unit organisasi + limit per user per konteks
│   ├── informasi/          # Pengumuman kampus
│   ├── import/             # Import massal via Excel
│   ├── dashboard/          # Dashboard agregat
│   ├── audit/              # Audit log & report
│   └── system/             # Setting sistem, integrity check, health
│
├── shared/                 # Dipakai lintas domain
│   ├── config/             # db.js (koneksi MariaDB)
│   ├── constants/          # accessKeys, icpSourceType
│   ├── middlewares/        # auth, role, accessSuper, idempotency, upload, validate
│   ├── models/             # base.model (parent semua model)
│   ├── policies/           # Aturan domain (transfer, reward, validation, dll)
│   └── utils/              # response, excelParser, validator, dll
│
├── core/                   # Engine inti
│   └── ledger.engine.js    # Single source-of-truth transaksi ICP
│
└── uploads/                # File upload (bukti, excel, informasi) — gitignored
```

### Pola Tiap Modul

```
modules/<domain>/
├── routes/        # Definisi endpoint + guard (auth/role/accessSuper)
├── controllers/   # Handler request → panggil service
├── services/      # Business logic
└── models/        # Query database (extends shared/models/base.model)
```

**Menambah fitur baru:** cukup buat folder `modules/<fitur-baru>/` dengan 4 sub-folder, lalu daftarkan route-nya di `app.js`. Tidak mengganggu modul lain.

## Role & Akses

4 role: `mahasiswa`, `dosen`, `admin`, `super_admin`.
Admin dapat diberi **akses super** granular via 10 access keys (`shared/constants/accessKeys.js`):
`input_mata_kuliah`, `kelola_kegiatan`, `input_unit_organisasi`, `kelola_unit_kategori`,
`kelola_nama_icp`, `manage_transfer_rules`, `validasi_final`, `kelola_limit`,
`validasi_potongan`, `potongan_super`. Super Admin bypass semua.

## Setup

```bash
npm install
cp .env.example .env          # isi JWT_SECRET & kredensial DB
# jalankan migrations 002 → 013 berurutan
npm run dev                   # development
npm start                     # production
```

Server: `http://localhost:5001`. Total **161 endpoint**.
