# Panduan Sinkronisasi Data Tailscale

## Deskripsi
Fitur ini memungkinkan Anda untuk mengambil data mahasiswa dan ICP (Indeks Capaian Pembelajaran) dari API Tailscale dan memasukkannya ke dalam database sistem SKPI secara otomatis.

## Konfigurasi

### 1. Setup Backend

File konfigurasi API Tailscale terletak di:
```
backend/.env
```

Konfigurasi yang perlu diisi:
```env
TAILSCALE_API_URL="http://100.110.153.63:5001"
TAILSCALE_API_KEY="your-jwt-token-here"
TAILSCALE_MAHASISWA_ENDPOINT="/api/users/by-role/mahasiswa"
TAILSCALE_ICP_ENDPOINT="/api/icp/balance/ranking"
```

- `TAILSCALE_API_URL`: URL API Tailscale (SICP - Student Integrity Credit Point)
- `TAILSCALE_API_KEY`: JWT Bearer token untuk autentikasi (wajib diisi)
- `TAILSCALE_MAHASISWA_ENDPOINT`: Endpoint untuk mengambil data mahasiswa
- `TAILSCALE_ICP_ENDPOINT`: Endpoint untuk mengambil data poin ICP mahasiswa

**Cara mendapatkan JWT Token:**
1. Login ke sistem SICP Tailscale melalui endpoint `/api/auth/login`
2. Copy token JWT yang dikembalikan
3. Paste token tersebut ke `TAILSCALE_API_KEY`

### 2. Format Data API

API Tailscale yang digunakan adalah **SICP (Student Integrity Credit Point)** dengan format response standar:
```json
{
  "success": true,
  "message": "Sukses",
  "data": [...]
}
```

#### Data Mahasiswa
Endpoint: `GET http://100.110.153.63:5001/api/users/by-role/mahasiswa`

Format data yang diharapkan:
```json
{
  "success": true,
  "data": [
    {
      "user_id": 123,
      "username": "123456",
      "nama": "John Doe",
      "email": "john@example.com",
      "jurusan_id": 1,
      "angkatan": 2020
    }
  ]
}
```

**Mapping Field:**
- `username` atau `user_id` → `nim`
- `nama` atau `name` atau `full_name` → `nama`
- `jurusan_id` atau `id_prodi` atau `prodi_id` → `id_prodi`
- `angkatan` atau `tahun_masuk` → `angkatan`
- `email` → `email`

#### Data ICP
Endpoint: `GET http://100.110.153.63:5001/api/icp/balance/ranking`

Format data yang diharapkan:
```json
{
  "success": true,
  "data": [
    {
      "user_id": "123456",
      "nim": "123456",
      "nama": "John Doe",
      "total_poin": 850,
      "balance": 850
    }
  ]
}
```

**Mapping Field:**
- `nim` atau `user_id` atau `username` → NIM mahasiswa (untuk lookup)
- `total_poin` atau `poin` atau `balance` → total poin ICP

**Catatan:** Data ICP akan disimpan ke kategori ICP default (id=1). Sesuaikan logika jika sistem Anda menggunakan multiple kategori ICP.

## Cara Penggunaan

### Melalui Web Interface (Admin Panel)

1. Login ke sistem sebagai admin
2. Buka menu **Sinkronisasi Data** di sidebar
3. Terdapat 4 opsi sinkronisasi:

#### a. Test Koneksi
- Klik tombol **Test Koneksi**
- Sistem akan mengecek apakah API Tailscale dapat diakses
- Hasil akan menampilkan status koneksi

#### b. Sinkronisasi Mahasiswa
- Klik tombol **Sync Mahasiswa**
- Sistem akan:
  - Mengambil data mahasiswa dari Tailscale API
  - Membuat akun login otomatis (username = NIM)
  - Password default = NIM (jika tidak disediakan)
  - Update data jika mahasiswa sudah ada
  - Insert data baru jika mahasiswa belum ada
- Hasil akan menampilkan:
  - Total data
  - Jumlah data yang ditambahkan
  - Jumlah data yang diperbarui
  - Jumlah yang gagal (beserta error detail)

#### c. Sinkronisasi ICP
- Klik tombol **Sync ICP**
- Sistem akan:
  - Mengambil data ICP dari Tailscale API
  - Update data jika ICP dengan id yang sama sudah ada
  - Insert data baru jika ICP belum ada
- Hasil akan menampilkan statistik serupa dengan sinkronisasi mahasiswa

#### d. Sinkronisasi Semua
- Klik tombol **Sync Semua Data**
- Sistem akan melakukan sinkronisasi ICP dan Mahasiswa sekaligus
- Hasil akan menampilkan statistik terpisah untuk ICP dan Mahasiswa

### Melalui API Endpoint

Anda juga dapat memanggil endpoint API secara langsung:

```bash
# Test koneksi
GET http://localhost:5000/api/tailscale-sync/test

# Sinkronisasi mahasiswa
GET http://localhost:5000/api/tailscale-sync/mahasiswa

# Sinkronisasi ICP
GET http://localhost:5000/api/tailscale-sync/icp

# Sinkronisasi semua
GET http://localhost:5000/api/tailscale-sync/both
```

**Note:** Semua endpoint memerlukan autentikasi (login sebagai admin)

## Logika Sinkronisasi

### Mahasiswa
1. Cek apakah mahasiswa dengan NIM yang sama sudah ada
2. Jika sudah ada:
   - Update data mahasiswa (nama, prodi, angkatan, dll)
3. Jika belum ada:
   - Cek apakah user dengan username (NIM) sudah ada
   - Jika user sudah ada: hubungkan mahasiswa ke user tersebut
   - Jika user belum ada: buat user baru dan mahasiswa dalam satu transaksi
   - Password default = NIM (bisa diubah nanti oleh admin/mahasiswa)

### ICP
1. Cek apakah ICP dengan id yang sama sudah ada
2. Jika sudah ada: Update data (nama_indo, nama_eng, bobot_poin)
3. Jika belum ada: Insert data baru

## Catatan Penting

1. **Backup Database**: Selalu backup database sebelum melakukan sinkronisasi massal
2. **Password Default**: Mahasiswa yang baru ditambahkan akan memiliki password = NIM mereka
3. **Resolusi Prodi**: Sistem akan mencoba mencocokkan nama prodi secara otomatis (case-insensitive, partial match)
4. **Error Handling**: Jika ada data yang gagal diproses, sistem akan tetap melanjutkan data lainnya
5. **Duplikasi**: Sistem akan skip data mahasiswa yang NIM-nya sudah ada (tidak akan membuat duplikat)

## Troubleshooting

### Koneksi Gagal
- Pastikan URL API Tailscale sudah benar di file `.env`
- Pastikan server Tailscale dapat diakses dari server backend
- Cek firewall dan network settings

### Data Gagal Diimport
- Periksa format data dari API Tailscale
- Pastikan field wajib (`nim`, `nama` untuk mahasiswa; `nama_indo`, `nama_eng`, `bobot_poin` untuk ICP) tidak kosong
- Lihat detail error di response sinkronisasi

### Prodi Tidak Terdeteksi
- Pastikan data program studi sudah ada di database
- Gunakan id_prodi (angka) jika memungkinkan
- Atau gunakan nama prodi yang exact match dengan data di database

## Support

Jika mengalami masalah, hubungi administrator sistem atau developer.
