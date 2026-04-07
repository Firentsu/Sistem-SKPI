# SKPI Backend — Express.js API Server

Backend standalone untuk Sistem SKPI Institut Shanti Bhuana.  
Berjalan di port **5000**, terpisah dari frontend Next.js.

---

## 🗂️ Struktur Folder

```
skpi-backend/
├── prisma/
│   ├── schema.prisma       ← definisi model database
│   ├── seed.js             ← data awal
│   └── migrations/         ← riwayat migrasi
├── src/
│   ├── lib/
│   │   ├── auth.js         ← JWT sign & verify
│   │   └── prisma.js       ← Prisma client singleton
│   ├── middleware/
│   │   └── auth.js         ← middleware requireAuth
│   └── routes/
│       ├── auth.js         ← /api/auth/*
│       ├── admin.js        ← /api/admin/*
│       └── mahasiswa.js    ← /api/mahasiswa/*
├── public/uploads/avatars/ ← hasil upload foto profil
├── server.js               ← entry point Express
├── package.json
├── .env.example
└── .gitignore
```

---

## ⚙️ Setup Awal

### 1. Install dependencies
```bash
npm install
```

### 2. Buat file .env
```bash
cp .env.example .env
# Lalu edit .env dan isi DATABASE_URL dan JWT_SECRET
```

### 3. Generate Prisma client
```bash
npm run db:generate
```

### 4. Jalankan migrasi database
```bash
npm run db:migrate
```

### 5. (Opsional) Isi data awal
```bash
npm run seed
```

### 6. Jalankan server
```bash
npm run dev        # development (auto-restart)
npm run start      # production
```

---

## 📡 Daftar Endpoint API

### Auth — `/api/auth`
| Method | Endpoint             | Deskripsi               | Auth? |
|--------|----------------------|-------------------------|-------|
| POST   | /api/auth/login      | Login admin             | ❌    |
| POST   | /api/auth/logout     | Logout                  | ❌    |
| GET    | /api/auth/me         | Cek sesi aktif          | ✅    |
| GET    | /api/auth/profile    | Ambil profil            | ✅    |
| PATCH  | /api/auth/profile    | Update username/email/password | ✅ |
| POST   | /api/auth/avatar     | Upload foto profil      | ✅    |
| POST   | /api/auth/register   | Daftar akun baru        | ❌    |

### Admin — `/api/admin`
| Method | Endpoint             | Deskripsi               | Auth? |
|--------|----------------------|-------------------------|-------|
| GET    | /api/admin/profile   | Profil admin            | ✅    |
| PATCH  | /api/admin/profile   | Update nama admin       | ✅    |
| POST   | /api/admin/password  | Ganti password          | ✅    |

### Mahasiswa — `/api/mahasiswa`
| Method | Endpoint             | Deskripsi               | Auth? |
|--------|----------------------|-------------------------|-------|
| GET    | /api/mahasiswa       | List + search + paging  | ✅    |
| GET    | /api/mahasiswa/:id   | Detail satu mahasiswa   | ✅    |
| POST   | /api/mahasiswa       | Tambah mahasiswa        | ✅    |
| PATCH  | /api/mahasiswa/:id   | Update data mahasiswa   | ✅    |
| DELETE | /api/mahasiswa/:id   | Hapus mahasiswa         | ✅    |

### Health Check
| Method | Endpoint      | Deskripsi       |
|--------|---------------|-----------------|
| GET    | /api/health   | Cek server aktif |

---

## 🔧 Cara Menambah Route Baru

Contoh: membuat route untuk **Aktivitas**

1. Buat file `src/routes/aktivitas.js`
2. Import dan daftarkan di `server.js`:
```js
import aktivitasRoutes from "./src/routes/aktivitas.js";
app.use("/api/aktivitas", aktivitasRoutes);
```

---

## 🤝 Cara Frontend Terhubung

Frontend Next.js harus memanggil endpoint ini dengan URL penuh:

```js
// Di frontend, gunakan env variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const res = await fetch(`${API_URL}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",   // ← wajib agar cookie terkirim
  body: JSON.stringify({ username, password }),
});
```
