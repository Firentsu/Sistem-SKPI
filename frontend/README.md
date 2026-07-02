# SKPI Frontend — Next.js

Frontend untuk Sistem SKPI Institut Shanti Bhuana.
Berjalan di port **3000**, terhubung ke backend Express di port 5000.

---

## 🗂️ Struktur Folder

```
skpi-frontend/
├── src/
│   ├── lib/
│   │   └── api.js          ← Utility API terpusat + mock fallback
│   └── app/
│       ├── page.js          ← Landing page + Login
│       ├── layout.js
│       ├── globals.css
│       └── admin/
│           ├── layout.js    ← Sidebar + Topbar + Auth check
│           ├── dashboard/
│           ├── mahasiswa/
│           ├── profile/
│           └── ...
├── public/
│   ├── img/                 ← Logo ISB, avatar default
│   └── uploads/avatars/     ← (kosong, avatar disimpan di backend)
├── .env.example
└── next.config.mjs
```

---

## ⚙️ Setup Awal

### 1. Install dependencies
```bash
npm install
```

### 2. Buat file .env.local
```bash
cp .env.example .env.local
```

Isi `NEXT_PUBLIC_API_URL` dengan URL backend lokal:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Jika Anda ingin mengakses backend dari perangkat lain di jaringan lokal, gunakan IP komputer backend:
```
NEXT_PUBLIC_API_URL=http://192.168.x.x:5000
```

### 3. Jalankan
```bash
npm install
npm run dev    # buka http://localhost:3000
```

---

## ✅ Bisa Jalan Tanpa Backend (Mode Demo)

Jika backend tidak aktif atau `NEXT_PUBLIC_API_URL` dikosongkan,
frontend otomatis masuk **Mode Demo** dengan data simulasi.

Login demo: **admin** / **admin123**

Banner kuning akan muncul saat mode demo aktif.

---

## 🔗 Cara Terhubung ke Backend

Semua request API melewati `src/lib/api.js`.
Setiap fungsi punya fallback mock jika backend tidak aktif:

| Fungsi          | Endpoint Backend           |
|-----------------|---------------------------|
| `login()`       | POST /api/auth/login       |
| `logout()`      | POST /api/auth/logout      |
| `getMe()`       | GET  /api/auth/me          |
| `getProfile()`  | GET  /api/auth/profile     |
| `updateProfile()`| PATCH /api/auth/profile   |
| `uploadAvatar()`| POST /api/auth/avatar      |
| `getMahasiswa()`| GET  /api/mahasiswa        |

---

## 📋 Menambah Halaman Baru yang Terhubung API

1. Tambah fungsi di `src/lib/api.js`
2. Import di halaman yang membutuhkan:
```js
import { getMahasiswa } from "@/lib/api";
```
