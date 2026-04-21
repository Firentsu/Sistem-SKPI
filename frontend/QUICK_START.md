# 🚀 QUICK START - Sistem SKPI Frontend

**Untuk membaca dokumentasi lengkap, buka file `DOKUMENTASI_FRONTEND.md`**

---

## ⚡ 5-Minute Setup

### 1. Install Dependencies

```bash
cd Projeck_Kampus/Sistem-SKPI/frontend
npm install
```

### 2. Setup Environment

Buat file `.env.local` di folder `frontend/`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Run Development Server

```bash
npm run dev
```

Buka: **http://localhost:3000**

### 4. Login

- Username: `admin`
- Password: `admin123`

---

## 🎯 Yang Sudah Ada (✓ READY)

- ✅ **Dashboard** - Statistik & ringkasan
- ✅ **Mahasiswa** - Daftar & filter mahasiswa
- ✅ **Aktivitas** - Kelola aktivitas/kegiatan (baru diupgrade!)
- ✅ **Profile** - Ubah data admin (perlu fix untuk persist data)

---

## 🔴 ISSUE UTAMA: Profile Update Tidak Tersimpan

**BACA:** `PERBAIKAN_PROFILE.md` untuk solusi lengkap

**Quick Fix:**
1. Pastikan backend running: `npm run dev` di folder `backend/`
2. Pastikan `.env.local` punya: `NEXT_PUBLIC_API_URL=http://localhost:5000`
3. Clear cache: `rm -r .next`
4. Restart frontend: `npm run dev`

---

## 📂 File Penting

| File | Apa |
|------|-----|
| `src/lib/api.js` | **TERPENTING** - Semua API calls harus melalui file ini |
| `src/app/admin/layout.js` | Sidebar & navigasi admin |
| `.env.example` → `.env.local` | Environment config |
| `PERBAIKAN_PROFILE.md` | Fix untuk profile issue |
| `GUIDE_DEVELOPMENT.md` | Panduan development lengkap |

---

## 🛠️ Backend Harus Running Dulu!

**Terminal 1 - Backend:**

```bash
cd Projeck_Kampus/Sistem-SKPI/backend
npm run dev
```

Expected: `✔ Server running at http://localhost:5000`

**Terminal 2 - Frontend:**

```bash
cd Projeck_Kampus/Sistem-SKPI/frontend
npm run dev
```

Expected: `✔ http://localhost:3000 (localhost:3000)`

---

## 🧪 Testing

### Test Login
1. Buka http://localhost:3000
2. Masuk username `admin`, password `admin123`
3. Seharusnya ke dashboard

### Test Profile (Issue!)
1. Click avatar atau Settings
2. Go ke Profile
3. Coba ubah username → klik Save
4. Refresh page → **SEHARUSNYA TETAP** tapi mungkin balik ke lama
5. **INI ADALAH BUG** yang perlu di-fix (lihat PERBAIKAN_PROFILE.md)

---

## 📚 Dokumentasi Lengkap

| File | Untuk Apa |
|------|-----------|
| `DOKUMENTASI_FRONTEND.md` | Overview project, struktur, API |
| `PERBAIKAN_PROFILE.md` | **Perbaikan bug profile update** |
| `GUIDE_DEVELOPMENT.md` | Cara development, patterns, workflow |
| `FRONTEND_IMPLEMENTATION_CHECKLIST.md` | Progress tracking |

---

## ❓ FAQ

### Q: Backend offline, frontend masih bisa jalan?
**A:** Ya! System support "mock mode". Tapi profile update tidak akan jadi (ini expected).

### Q: Bagaimana cara membuat halaman baru?
**A:** Baca `GUIDE_DEVELOPMENT.md` - section "Membuat Halaman Baru"

### Q: API endpoint mana yang tersedia?
**A:** Lihat `DOKUMENTASI_FRONTEND.md` - section "API Backend yang Tersedia"

### Q: Styling follow standard apa?
**A:** Brown warm theme ISB. Lihat `GUIDE_DEVELOPMENT.md` - Color Palette

---

## 🆘 Troubleshooting

### Problem: "Server tidak aktif" saat login
**Solution:** Backend belum running. Jalankan `npm run dev` di folder `backend/`

### Problem: Environment variable tidak kebaca
**Solution:** 
1. Rename `.env.example` → `.env.local`
2. Set: `NEXT_PUBLIC_API_URL=http://localhost:5000`
3. Restart dev server

### Problem: Style tidak muncul
**Solution:** Clear cache: `rm -r .next` lalu restart dev server

### Problem: Profile update masih tidak tersimpan setelah fix
**Solution:** Lihat `PERBAIKAN_PROFILE.md` section "Jika masih tidak berhasil"

---

## 📞 Need Help?

1. **Setup Issues** → `GUIDE_DEVELOPMENT.md`
2. **Profile Bug** → `PERBAIKAN_PROFILE.md`
3. **API Questions** → `src/lib/api.js` (ada comments)
4. **General Info** → `DOKUMENTASI_FRONTEND.md`

---

**Ready?** Jalankan `npm run dev` dan buka http://localhost:3000! 🚀
