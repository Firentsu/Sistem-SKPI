/**
 * /api/captcha — Gerbang (gate) verifikasi reCAPTCHA sebelum masuk web.
 *
 * POST /verify  → verifikasi token reCAPTCHA v2, tandai sesi lolos captcha.
 * GET  /status  → cek apakah sesi ini sudah lolos captcha.
 */
import { Router } from "express";
import { verifyCaptchaGate } from "../utils/recaptcha.js";

const router = Router();

// POST /api/captcha/verify  Body: { captchaToken }
router.post("/verify", async (req, res) => {
  try {
    const { captchaToken } = req.body;
    const result = await verifyCaptchaGate(req, captchaToken);
    if (!result.ok) return res.status(400).json({ ok: false, error: result.error });
    return res.json({ ok: true });
  } catch (err) {
    console.error("POST /api/captcha/verify error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

// GET /api/captcha/status
router.get("/status", (req, res) => {
  const enabled = !!process.env.RECAPTCHA_SECRET_KEY;
  res.json({ enabled, verified: !enabled || !!req.session?.captchaVerified });
});

export default router;
