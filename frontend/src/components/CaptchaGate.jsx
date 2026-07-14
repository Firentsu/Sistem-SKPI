"use client";

/**
 * CaptchaGate.jsx — Layar verifikasi captcha SEBELUM masuk ke landing page.
 *
 * Alur:
 *   1. Tampil penuh saat web dibuka (bila site key reCAPTCHA diaktifkan).
 *   2. Pengguna mencentang "Saya bukan robot" (reCAPTCHA v2).
 *   3. Token diverifikasi ke backend (POST /api/captcha/verify).
 *   4. Bila lolos → panggil onVerified() → landing/login ditampilkan.
 */

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import Recaptcha from "./Recaptcha";
import { verifyCaptcha } from "@/lib/api";
import styles from "./CaptchaGate.module.css";

export default function CaptchaGate({ siteKey, onVerified }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const captchaRef = useRef(null);

  const handleChange = useCallback(async (token) => {
    if (!token) return;               // ter-reset / kadaluarsa
    setError("");
    setLoading(true);
    const r = await verifyCaptcha(token);
    if (r.ok) {
      onVerified();
    } else {
      setError(r.error || "Verifikasi gagal. Silakan coba lagi.");
      captchaRef.current?.reset();
      setLoading(false);
    }
  }, [onVerified]);

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <Image src="/img/Logo_isb.png" alt="ISB Logo" width={72} height={44} priority />
        </div>

        <div className={styles.badge}><ShieldCheck size={16} /><span>Verifikasi Keamanan</span></div>

        <h1 className={styles.title}>Verifikasi dulu untuk melanjutkan</h1>
        <p className={styles.subtitle}>
          Centang kotak di bawah untuk memastikan Anda bukan robot, lalu Anda
          akan diarahkan ke halaman SKPI.
        </p>

        <div className={styles.captchaBox}>
          <Recaptcha ref={captchaRef} siteKey={siteKey} onChange={handleChange} />
        </div>

        {loading && (
          <div className={styles.status}>
            <span className={styles.spinner} /> Memverifikasi…
          </div>
        )}
        {error && <p className={styles.error}>{error}</p>}

        <p className={styles.footer}>© {new Date().getFullYear()} Institut Shanti Bhuana</p>
      </div>
    </div>
  );
}
