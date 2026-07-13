/**
 * recaptcha.js — Verifikasi Google reCAPTCHA (v2 checkbox) di sisi server.
 *
 * Alur:
 *   1. Frontend menampilkan widget "Saya bukan robot" (site key publik).
 *   2. Setelah dicentang, browser mengirim `captchaToken` bersama request login.
 *   3. Backend memanggil Google siteverify memakai SECRET key (rahasia, di .env).
 *
 * Catatan penting:
 *   - Token reCAPTCHA hanya SEKALI PAKAI. Halaman login SKPI mencoba dua peran
 *     (admin lalu mahasiswa, atau sebaliknya) dengan satu kali centang, jadi
 *     `ensureCaptcha` memverifikasi token SEKALI lalu menandai sesi lolos captcha
 *     untuk jendela singkat — percobaan peran kedua tidak ikut terblokir.
 *   - Bila `RECAPTCHA_SECRET_KEY` tidak diset (mis. dev/demo tanpa captcha),
 *     verifikasi otomatis dilewati agar sistem tetap berjalan.
 */

const SITEVERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

// Jendela "lolos captcha" per sesi (menjembatani percobaan login dua peran).
const CAPTCHA_PASS_TTL_MS = 3 * 60 * 1000; // 3 menit

/** Panggil Google siteverify untuk satu token. */
export async function verifyRecaptchaToken(token, remoteip) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return { ok: true, skipped: true }; // captcha nonaktif
  if (!token) return { ok: false, error: "Verifikasi captcha wajib diisi" };

  try {
    const params = new URLSearchParams({ secret, response: token });
    if (remoteip) params.append("remoteip", remoteip);

    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = await res.json();

    if (data.success) return { ok: true, data };
    return {
      ok: false,
      error: "Verifikasi captcha gagal. Silakan centang ulang captcha.",
      data,
    };
  } catch (err) {
    console.error("verifyRecaptchaToken error:", err);
    return { ok: false, error: "Gagal menghubungi layanan captcha. Coba lagi." };
  }
}

/**
 * Pastikan request sudah lolos captcha.
 * - Jika sesi sudah lolos captcha dalam jendela singkat → langsung lolos.
 * - Jika belum → verifikasi token ke Google, lalu tandai sesi lolos.
 *
 * @returns {{ ok: boolean, error?: string }}
 */
export async function ensureCaptcha(req, token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return { ok: true }; // captcha nonaktif → lewati

  // Sudah lolos captcha baru-baru ini pada sesi ini?
  if (req.session?.captchaOkUntil && req.session.captchaOkUntil > Date.now()) {
    return { ok: true };
  }

  const result = await verifyRecaptchaToken(token, req.ip);
  if (!result.ok) return { ok: false, error: result.error };

  // Tandai sesi lolos captcha untuk jendela singkat.
  if (req.session) req.session.captchaOkUntil = Date.now() + CAPTCHA_PASS_TTL_MS;
  return { ok: true };
}
