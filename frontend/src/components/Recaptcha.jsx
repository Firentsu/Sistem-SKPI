"use client";

/**
 * Recaptcha.jsx — Widget Google reCAPTCHA v2 ("Saya bukan robot").
 *
 * Dirender secara eksplisit (bukan auto-scan) agar aman dari re-render React:
 * widget hanya dibuat sekali, token dikirim ke parent lewat `onChange`.
 *
 * Parent bisa memanggil `ref.current.reset()` untuk mengosongkan centang
 * (mis. setelah login gagal — token reCAPTCHA hanya sekali pakai).
 */

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

// Muat script reCAPTCHA sekali saja; resolve saat API siap dipakai.
let readyPromise = null;
function loadRecaptcha() {
  if (readyPromise) return readyPromise;
  readyPromise = new Promise((resolve) => {
    if (typeof window === "undefined") return;
    if (window.grecaptcha && window.grecaptcha.render) return resolve(window.grecaptcha);
    window.__onSkpiRecaptchaLoad = () => resolve(window.grecaptcha);
    const s = document.createElement("script");
    s.src = "https://www.google.com/recaptcha/api.js?render=explicit&onload=__onSkpiRecaptchaLoad";
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  });
  return readyPromise;
}

const Recaptcha = forwardRef(function Recaptcha({ siteKey, onChange, theme = "light" }, ref) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!siteKey) return;
    let mounted = true;
    loadRecaptcha().then((grecaptcha) => {
      if (!mounted || !containerRef.current || widgetIdRef.current !== null) return;
      widgetIdRef.current = grecaptcha.render(containerRef.current, {
        sitekey: siteKey,
        theme,
        callback: (token) => onChangeRef.current?.(token),
        "expired-callback": () => onChangeRef.current?.(""),
        "error-callback": () => onChangeRef.current?.(""),
      });
    });
    return () => { mounted = false; };
  }, [siteKey, theme]);

  useImperativeHandle(ref, () => ({
    reset() {
      if (widgetIdRef.current !== null && window.grecaptcha) {
        try { window.grecaptcha.reset(widgetIdRef.current); } catch { /* noop */ }
      }
      onChangeRef.current?.("");
    },
  }), []);

  if (!siteKey) return null;
  return <div ref={containerRef} />;
});

export default Recaptcha;
