/**
 * rateLimiter.js — Proteksi brute force pada endpoint login
 *
 * Tujuan: mencegah upaya menebak kredensial melalui percobaan login berulang
 * (brute force / credential stuffing) tanpa mengganggu pengguna sah.
 *
 * Dua lapis pertahanan (pasang berurutan pada route /login):
 *   1) loginAccountLimiter — batas per AKUN (username / NIM).
 *      Pertahanan utama: satu akun hanya boleh gagal N kali per jendela,
 *      berapa pun IP yang dipakai penyerang (tahan serangan terdistribusi).
 *   2) loginIpLimiter — batas per IP.
 *      Jaring pengaman kasar: satu perangkat tidak bisa menyemprot banyak akun.
 *
 * Kunci desain: `skipSuccessfulRequests: true` → hanya percobaan GAGAL yang
 * dihitung. Login yang BERHASIL tidak pernah menghabiskan kuota, sehingga
 * pengguna sah nyaris tidak mungkin terblokir secara keliru.
 *
 * Catatan: `app.set("trust proxy", 1)` di server.js membuat `req.ip` berisi IP
 * klien asli (dari X-Forwarded-For proxy Railway), bukan IP proxy.
 */
import { rateLimit, ipKeyGenerator } from "express-rate-limit";

// ── Parameter (ubah di sini bila perlu) ─────────────────────
const WINDOW_MS      = 15 * 60 * 1000; // jendela 15 menit
const MAX_PER_ACCOUNT = 10;            // maks percobaan GAGAL per akun / jendela
const MAX_PER_IP      = 50;            // maks percobaan GAGAL per IP  / jendela
const WINDOW_MENIT    = Math.round(WINDOW_MS / 60000);

const pesan = {
  error:
    `Terlalu banyak percobaan login gagal. ` +
    `Demi keamanan, akun untuk sementara dikunci. ` +
    `Silakan coba lagi dalam ${WINDOW_MENIT} menit.`,
};

// Ambil identitas akun dari body login (admin: username, mahasiswa: nim).
// Dinormalisasi agar "Budi", "budi ", dan "budi" dihitung sebagai satu kunci.
function ambilIdentitasAkun(req) {
  const raw = req.body?.username ?? req.body?.nim ?? "";
  return String(raw).trim().toLowerCase();
}

// ── 1) Batas per AKUN ───────────────────────────────────────
export const loginAccountLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_PER_ACCOUNT,
  standardHeaders: true,          // sertakan header RateLimit-* & Retry-After
  legacyHeaders: false,
  skipSuccessfulRequests: true,   // login sukses tidak mengurangi kuota
  message: pesan,
  keyGenerator: (req) => {
    const akun = ambilIdentitasAkun(req);
    // Jika body tak berisi identitas (mis. request rusak), jatuh ke kunci IP
    // yang aman untuk IPv6 lewat helper bawaan express-rate-limit.
    return akun ? `akun:${akun}` : ipKeyGenerator(req.ip);
  },
  // Jangan hitung request yang memang tidak menyertakan kredensial.
  skip: (req) => !ambilIdentitasAkun(req) || !req.body?.password,
});

// ── 2) Batas per IP ─────────────────────────────────────────
export const loginIpLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_PER_IP,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: pesan,
  // keyGenerator default sudah memakai req.ip (aman IPv6) — tidak perlu diubah.
});
