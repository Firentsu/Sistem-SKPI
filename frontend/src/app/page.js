"use client";

import { useEffect, useCallback } from "react";
import { useState, useRef } from "react";
import styles from "./page.module.css";
import {
  User, Lock, Info, ArrowLeft, ArrowRight,
  GraduationCap, Award, ChevronRight,
  Eye, EyeOff, CheckCircle, FileText, Users,
  AlertCircle, X, WifiOff,
} from "lucide-react";
import Image from "next/image";
import { login, loginMahasiswa, isMockMode } from "@/lib/api";

// ── Toast Notification ────────────────────────────────────────
function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className={styles.toast}>
      <div className={styles.toastIcon}><AlertCircle size={18} /></div>
      <span className={styles.toastMessage}>{message}</span>
      <button className={styles.toastClose} onClick={onClose} aria-label="Tutup"><X size={14} /></button>
      <div className={styles.toastProgress} />
    </div>
  );
}

// ── Mode Demo Banner ──────────────────────────────────────────
function DemoBanner() {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
      background: "#fef3c7", borderBottom: "1px solid #f59e0b",
      padding: "6px 16px", display: "flex", alignItems: "center",
      gap: 8, fontSize: 12, color: "#92400e",
    }}>
      <WifiOff size={13} />
      <strong>Mode Demo</strong> — Backend tidak terdeteksi. Login dengan:
      <code style={{ background: "#fde68a", padding: "1px 6px", borderRadius: 4 }}>admin</code> /
      <code style={{ background: "#fde68a", padding: "1px 6px", borderRadius: 4 }}>admin123</code>
      &nbsp;·&nbsp; atau mahasiswa:&nbsp;
      <code style={{ background: "#fde68a", padding: "1px 6px", borderRadius: 4 }}>2021001</code> /
      <code style={{ background: "#fde68a", padding: "1px 6px", borderRadius: 4 }}>mhs123</code>
    </div>
  );
}

export default function Home() {
  useEffect(() => { document.title = "Landing Page | SKPI"; }, []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const containerRef = useRef(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [message, setMessage] = useState("");
  const [shake, setShake] = useState(false);

  const triggerError = (msg) => {
    setMessage(msg);
    setShake(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setShake(true)));
  };

  const clearError = () => { setMessage(""); setShake(false); };

  // ── handleLogin ───────────────────────────────────────────
  const handleLogin = useCallback(async () => {
    clearError();
    setLoadingLogin(true);
    try {
      const input = username.trim();
      // Pola NIM (angka semua) → coba login MAHASISWA dulu; selain itu ADMIN dulu.
      // Selalu ada FALLBACK ke peran satunya, karena username mahasiswa dari SICP
      // bisa non-numerik (mis. "sicpmhs") sehingga tak keliru dikira admin.
      const isNumeric = /^\d+$/.test(input);

      const tryMahasiswa = async () => {
        const r = await loginMahasiswa(input, password);
        if (r.ok) {
          if (isMockMode()) setShowDemo(true);
          window.location.href = "/mahasiswa/dashboard";
          return true;
        }
        return false;
      };
      const tryAdmin = async () => {
        const r = await login(input, password);
        if (r.ok) {
          if (isMockMode()) setShowDemo(true);
          window.location.href = "/admin/dashboard";
          return true;
        }
        return false;
      };

      const ok = isNumeric
        ? (await tryMahasiswa()) || (await tryAdmin())
        : (await tryAdmin())     || (await tryMahasiswa());

      if (!ok) {
        triggerError("Login gagal. Periksa username/NIM dan password Anda.");
        if (isMockMode()) setShowDemo(true);
      }
    } finally {
      setLoadingLogin(false);
    }
  }, [username, password]);

  // ── FIX UTAMA: slides sebagai const biasa (bukan useMemo) ─
  // useMemo dengan [] membuat slides hanya dibuat SEKALI saat
  // mount pertama, sehingga value={username} dan value={password}
  // di dalam input selalu membaca nilai "" (frozen/stale).
  // Dengan const biasa, slides dibuat ulang tiap render dan
  // selalu membaca state terbaru → input bisa diketik normal.
  const slides = [
    {
      id: "login",
      title: "Login",
      subtitle: "Masuk ke akun SKPI Anda",
      content: (
        <>
          <form
            suppressHydrationWarning
            className={`${styles.inputGroup} ${shake ? styles.shakeForm : ""}`}
            onSubmit={(e) => { e.preventDefault(); handleLogin(); }}
            onMouseDown={(e) => e.stopPropagation()}
            onAnimationEnd={() => setShake(false)}
          >
            <div className={`${styles.input} ${message ? styles.inputError : ""}`}>
              <User size={18} />
              <input
                type="text"
                suppressHydrationWarning
                placeholder="Username / NIM"
                value={username}
                onChange={(e) => { setUsername(e.target.value); clearError(); }}
                onFocus={() => setIsDragging(false)}
                required
              />
            </div>
            <div className={`${styles.input} ${message ? styles.inputError : ""}`}>
              <Lock size={18} />
              <input
                type={showPassword ? "text" : "password"}
                suppressHydrationWarning
                placeholder="Password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError(); }}
                onFocus={() => setIsDragging(false)}
                required
              />
              <button
                type="button"
                suppressHydrationWarning
                className={styles.eyeButton}
                onClick={() => setShowPassword(v => !v)}
                aria-label="Toggle password"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className={styles.loginOptions}>
              <label className={styles.checkbox}>
                <input suppressHydrationWarning type="checkbox" /><span>Ingat saya</span>
              </label>
              <a href="/lupa-password" className={styles.forgotPassword}>Lupa password?</a>
            </div>

            <button
              type="submit"
              suppressHydrationWarning
              className={styles.button}
              disabled={loadingLogin}
            >
              {loadingLogin
                ? <><span className={styles.spinner} />Memproses...</>
                : <>Login<ChevronRight size={16} /></>}
            </button>
          </form>

          <p className={styles.noteText}>* Gunakan username dan password SIAKAD Anda</p>
          <Toast message={message} onClose={clearError} />
        </>
      ),
    },
    {
      id: "about",
      title: "Tentang SKPI",
      subtitle: "Surat Keterangan Pendamping Ijazah",
      content: (
        <div className={styles.aboutContent}>
          <div className={styles.aboutCards}>
            {[
              { icon: <FileText size={22} />, title: "Dokumen Resmi", desc: "Pendamping ijazah yang diakui" },
              { icon: <GraduationCap size={22} />, title: "Capaian Akademik", desc: "IPK & prestasi akademik" },
              { icon: <Award size={22} />, title: "Sertifikasi", desc: "Kompetensi & keahlian" },
              { icon: <Users size={22} />, title: "Pengalaman", desc: "Organisasi & magang" },
            ].map((c, i) => (
              <div key={i} className={styles.aboutCard}>
                <div className={styles.aboutIcon}>{c.icon}</div>
                <div><strong>{c.title}</strong><span>{c.desc}</span></div>
              </div>
            ))}
          </div>
          <div className={styles.aboutFooter}>
            <div className={styles.infoBox}>
              <Info size={14} /><span>Diakui oleh Dunia Industri & Pendidikan</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  // ── Drag handlers ─────────────────────────────────────────
  const handleDragStart = useCallback((e) => {
    const tag = e.target.tagName;
    if (tag === "INPUT" || tag === "BUTTON" || tag === "TEXTAREA") return;
    setIsDragging(true);
    setStartX(e.clientX);
  }, []);

  const handleDragMove = useCallback((e) => {
    if (!isDragging) return;
    setTranslateX(e.clientX - startX);
  }, [isDragging, startX]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    if (Math.abs(translateX) > 80) {
      if (translateX > 0 && currentIndex > 0) setCurrentIndex(currentIndex - 1);
      else if (translateX < 0 && currentIndex < slides.length - 1) setCurrentIndex(currentIndex + 1);
    }
    setTranslateX(0);
  }, [isDragging, translateX, currentIndex, slides.length]);

  // ── Touch handlers (mobile swipe) ─────────────────────────
  const handleTouchStart = useCallback((e) => {
    const tag = e.target.tagName;
    if (tag === "INPUT" || tag === "BUTTON" || tag === "TEXTAREA") return;
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    setTranslateX(e.touches[0].clientX - startX);
  }, [isDragging, startX]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    if (Math.abs(translateX) > 50) {
      if (translateX > 0 && currentIndex > 0) setCurrentIndex(currentIndex - 1);
      else if (translateX < 0 && currentIndex < slides.length - 1) setCurrentIndex(currentIndex + 1);
    }
    setTranslateX(0);
  }, [isDragging, translateX, currentIndex, slides.length]);

  return (
    <div className={styles.container}>
      {showDemo && <DemoBanner />}

      <header className={styles.header} style={showDemo ? { marginTop: 32 } : {}}>
        <div className={styles.headerContent}>
          <div className={styles.headerLogo}>
            {/* FIX: nama file asli "Logo_isb.png" — huruf L kapital */}
            <Image src="/img/Logo_isb.png" alt="ISB Logo" width={70} height={40} className={styles.headerLogoImg} priority />
            <div className={styles.headerTitle}><span>INSTITUT</span><span>SHANTI BHUANA</span></div>
          </div>
        </div>
      </header>

      <div className={styles.mainContent}>
        <div className={styles.left}>
          <div className={styles.leftContent}>
            <div className={styles.logoWrapper}>
              {/* FIX: konsisten "Logo_isb.png" — huruf L kapital */}
              <Image src="/img/Logo_isb.png" alt="ISB Logo" width={150} height={90} className={styles.logo} priority />
            </div>
            <div className={styles.leftTextGroup}>
              <h1>SKPI ISB</h1>
              <h2>Surat Keterangan<br />Pendamping Ijazah</h2>
            </div>
            <p className={styles.leftDesc}>Dokumen resmi yang menjelaskan capaian akademik,<br />kegiatan, dan kompetensi lulusan<br />Institut Shanti Bhuana.</p>
            <div className={styles.infoBadges}>
              {["Terakreditasi", "Resmi", "Terpercaya"].map(b => (
                <div key={b} className={styles.badge}><CheckCircle size={12} /><span>{b}</span></div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.right}>
          <div className={styles.sliderContainer}>
            {currentIndex > 0 && (
              <button suppressHydrationWarning className={`${styles.navArrow} ${styles.prevArrow}`} onClick={() => setCurrentIndex(currentIndex - 1)}>
                <ArrowLeft size={20} />
              </button>
            )}
            {currentIndex < slides.length - 1 && (
              <button suppressHydrationWarning className={`${styles.navArrow} ${styles.nextArrow}`} onClick={() => setCurrentIndex(currentIndex + 1)}>
                <ArrowRight size={20} />
              </button>
            )}

            <div
              className={styles.sliderWrapper}
              onMouseDown={handleDragStart}
              onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className={styles.sliderTrack}
                style={{
                  transform: `translateX(calc(-${currentIndex * 100}% + ${translateX}px))`,
                  transition: isDragging ? "none" : "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                }}
              >
                {slides.map((slide) => (
                  <div key={slide.id} className={styles.slide}>
                    <div className={styles.card}>
                      <h2>{slide.title}</h2>
                      <p className={styles.cardSubtitle}>{slide.subtitle}</p>
                      {slide.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.dots}>
              {slides.map((_, index) => (
                <button
                  key={index}
                  suppressHydrationWarning
                  className={`${styles.dot} ${currentIndex === index ? styles.activeDot : ""}`}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerBottom}>
          <p>&copy; {new Date().getFullYear()} Institut Shanti Bhuana. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}