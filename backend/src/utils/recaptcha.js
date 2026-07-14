/**
 * recaptcha.js — Verifikasi Google reCAPTCHA (v2 checkbox) di sisi server.
 *
 * Alur (gerbang/gate captcha SEBELUM landing page):
 *   1. Saat membuka web, frontend menampilkan layar captcha "Saya bukan robot".
 *   2. Setelah dicentang, browser mengirim token ke POST /api/captcha/verify.
 *   3. Backend memverifikasi token ke Google (SECRET key), lalu MENANDAI sesi
 *      `captchaVerified = true` — tanda ini bertahan selama sesi (cookie) hidup.
 *   4. Endpoint login memakai `ensureCaptcha`: bila sesi sudah `captchaVerified`,
 *      login diloloskan; bila belum (mis. hit API langsung tanpa lewat gate),
 *      login ditolak. Jadi bot tetap wajib melewati captcha.
 *
 * Catatan:
 *   - Bila `RECAPTCHA_SECRET_KEY` tidak diset (dev/demo tanpa captcha),
 *     verifikasi otomatis dilewati agar sistem tetap berjalan.
 */

const SITEVERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

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
 * Verifikasi token gate lalu tandai sesi sudah lolos captcha.
 * Dipakai oleh endpoint POST /api/captcha/verify.
 *
 * @returns {{ ok: boolean, error?: string }}
 */
export async function verifyCaptchaGate(req, token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    if (req.session) req.session.captchaVerified = true;
    return { ok: true }; // captcha nonaktif → langsung loloskan
  }

  const result = await verifyRecaptchaToken(token, req.ip);
  if (!result.ok) return { ok: false, error: result.error };

  if (req.session) req.session.captchaVerified = true;
  return { ok: true };
}

/**
 * Pastikan request datang dari sesi yang sudah lolos gate captcha.
 * Dipakai oleh endpoint login (lapisan pertahanan agar API tak bisa di-hit
 * langsung oleh bot tanpa melewati captcha).
 *
 * @returns {{ ok: boolean, error?: string }}
 */
export async function ensureCaptcha(req, token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return { ok: true }; // captcha nonaktif → lewati

  // Sudah lolos gate captcha pada sesi ini?
  if (req.session?.captchaVerified) return { ok: true };

  // Fallback: token dikirim langsung bersama login (mis. gate dilewati).
  const result = await verifyRecaptchaToken(token, req.ip);
  if (!result.ok) {
    return { ok: false, error: result.error || "Verifikasi captcha diperlukan." };
  }
  if (req.session) req.session.captchaVerified = true;
  return { ok: true };
}
