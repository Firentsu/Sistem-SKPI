# Cara Mendapatkan JWT Token dari API Tailscale (SICP)

## Menggunakan Postman / Thunder Client / Insomnia

### 1. Login ke API SICP

**Endpoint:** `POST http://100.110.153.63:5001/api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "username": "your-username",
  "password": "your-password"
}
```

### 2. Ambil Token dari Response

Response yang sukses akan berbentuk:
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "user_id": 1,
      "username": "your-username",
      "role": "admin"
    }
  }
}
```

Copy nilai `data.token` (string panjang yang dimulai dengan `eyJ...`)

### 3. Paste ke File .env

Buka file `backend/.env` dan paste token ke:
```env
TAILSCALE_API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 4. Restart Backend

Restart server backend agar konfigurasi baru ter-load:
```bash
cd backend
npm run dev
```

---

## Menggunakan cURL (Command Line)

```bash
curl -X POST http://100.110.153.63:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"your-username","password":"your-password"}'
```

Copy token dari response, lalu edit file `.env`.

---

## Menggunakan PowerShell (Windows)

```powershell
$body = @{
    username = "your-username"
    password = "your-password"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://100.110.153.63:5001/api/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body

$response.data.token
```

Copy output token, lalu paste ke file `.env`.

---

## Testing Token

Setelah mengisi `TAILSCALE_API_KEY` di `.env`, test koneksi melalui:

1. Login ke admin panel sistem SKPI
2. Buka menu **Sinkronisasi Data**
3. Klik tombol **Test Koneksi**
4. Jika berhasil, akan muncul pesan sukses dengan status 200

---

## Catatan Penting

- Token JWT memiliki masa berlaku (expiry). Jika expired, Anda perlu login ulang dan mendapatkan token baru.
- Jangan share token JWT Anda ke orang lain.
- Simpan token dengan aman.
- Gunakan akun dengan role yang memiliki akses ke endpoint mahasiswa dan ICP (biasanya Admin atau Super Admin).
