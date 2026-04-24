"use client";

import { useEffect, useMemo, useCallback } from "react";
import { useState, useRef } from "react";
import styles from "./page.module.css";
import {
  User, Lock, Mail, Info, ArrowLeft, ArrowRight,
  GraduationCap, Award, Briefcase, ChevronRight,
  Eye, EyeOff, CheckCircle, FileText, BookOpen, Users,
  Phone, MapPin, Mail as MailIcon, Facebook, Twitter, Instagram,
  AlertCircle, X, Wifi, WifiOff,
} from "lucide-react";
import Image from "next/image";
// ↓ Tambah import loginMahasiswa — satu-satunya perubahan di baris import
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

// ── Mode Demo Banner — tampilkan kredensial kedua role ────────
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

  // ── handleLogin — deteksi role dari input ─────────────────
  const handleLogin = useCallback(async () => {
    clearError();
    setLoadingLogin(true);
    try {
      const input = username.trim();

      // Jika input hanya angka → dianggap NIM mahasiswa
      const isMahasiswa = /^\d+$/.test(input);

      if (isMahasiswa) {
        const result = await loginMahasiswa(input, password);
        if (result.ok) {
          if (isMockMode()) setShowDemo(true);
          window.location.href = "/mahasiswa/dashboard";
        } else {
          triggerError(result.error || "Login gagal. Periksa NIM dan password.");
          if (isMockMode()) setShowDemo(true);
        }
      } else {
        const result = await login(input, password);
        if (result.ok) {
          if (isMockMode()) setShowDemo(true);
          window.location.href = "/admin/dashboard";
        } else {
          triggerError(result.error || "Login gagal. Periksa username dan password.");
          if (isMockMode()) setShowDemo(true);
        }
      }
    } finally {
      setLoadingLogin(false);
    }
  }, [username, password]);

  const slides = useMemo(() => [
    {
      id: "login",
      title: "Login",
      subtitle: "Masuk ke akun SKPI Anda",
      content: (
        <>
          <form
            className={`${styles.inputGroup} ${shake ? styles.shakeForm : ""}`}
            onSubmit={(e) => { e.preventDefault(); handleLogin(); }}
            onMouseDown={(e) => e.stopPropagation()}
            onAnimationEnd={() => setShake(false)}
          >
            <div className={`${styles.input} ${message ? styles.inputError : ""}`}>
              <User size={18} />
              <input type="text" placeholder="Username / NIM"
                value={username} onChange={(e) => { setUsername(e.target.value); clearError(); }}
                onFocus={() => setIsDragging(false)} required />
            </div>
            <div className={`${styles.input} ${message ? styles.inputError : ""}`}>
              <Lock size={18} />
              <input type={showPassword ? "text" : "password"} placeholder="Password"
                value={password} onChange={(e) => { setPassword(e.target.value); clearError(); }}
                onFocus={() => setIsDragging(false)} required />
              <button type="button" className={styles.eyeButton}
                onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </form>

          <div className={styles.loginOptions}>
            <label className={styles.checkbox}><input type="checkbox" /><span>Ingat saya</span></label>
            <a href="#" className={styles.forgotPassword}>Lupa password?</a>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
            <button className={styles.button}
              onClick={(e) => { e.preventDefault(); handleLogin(); }}
              disabled={loadingLogin}>
              {loadingLogin
                ? <><span className={styles.spinner} />Memproses...</>
                : <>Login<ChevronRight size={16} /></>}
            </button>
          </div>

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
            <div className={styles.infoBox}><Info size={14} /><span>Diakui oleh Dunia Industri & Pendidikan</span></div>
          </div>
        </div>
      ),
    },
  ], []);

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

  return (
    <div className={styles.container}>
      {showDemo && <DemoBanner />}

      <header className={styles.header} style={showDemo ? { marginTop: 32 } : {}}>
        <div className={styles.headerContent}>
          <div className={styles.headerLogo}>
            <Image src="/img/Logo_isb.png" alt="ISB Logo" width={70} height={40} className={styles.headerLogoImg} />
            <div className={styles.headerTitle}><span>INSTITUT</span><span>SHANTI BHUANA</span></div>
          </div>
        </div>
      </header>

      <div className={styles.mainContent}>
        <div className={styles.left}>
          <div className={styles.leftContent}>
            <div className={styles.logoWrapper}>
              <Image src="/img/logo_isb.png" alt="ISB Logo" width={150} height={90} className={styles.logo} />
            </div>
            <h1>SKPI ISB</h1>
            <h2>Surat Keterangan<br />Pendamping Ijazah</h2>
            <p>Dokumen resmi yang menjelaskan capaian akademik,<br />kegiatan, dan kompetensi lulusan<br />Institut Shanti Bhuana.</p>
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
              <button className={`${styles.navArrow} ${styles.prevArrow}`} onClick={() => setCurrentIndex(currentIndex - 1)}>
                <ArrowLeft size={20} />
              </button>
            )}
            {currentIndex < slides.length - 1 && (
              <button className={`${styles.navArrow} ${styles.nextArrow}`} onClick={() => setCurrentIndex(currentIndex + 1)}>
                <ArrowRight size={20} />
              </button>
            )}

            <div className={styles.sliderWrapper}
              onMouseDown={handleDragStart} onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd}>
              <div className={styles.sliderTrack}
                style={{
                  transform: `translateX(calc(-${currentIndex * 100}% + ${translateX}px))`,
                  transition: isDragging ? "none" : "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                }}>
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
                <button key={index}
                  className={`${styles.dot} ${currentIndex === index ? styles.activeDot : ""}`}
                  onClick={() => setCurrentIndex(index)} />
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