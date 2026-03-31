"use client";

import { useEffect } from "react";
import { useState, useRef } from "react";
import styles from "./page.module.css";
import {
  User, Lock, Mail, Info, ArrowLeft, ArrowRight,
  GraduationCap, Award, Briefcase, ChevronRight,
  Eye, EyeOff, CheckCircle, FileText, BookOpen, Users,
  Phone, MapPin, Mail as MailIcon, Facebook, Twitter, Instagram,
  AlertCircle, X
} from "lucide-react";
import Image from "next/image";

// ─── Toast Notification Component ────────────────────────────────────────────
function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className={styles.toast}>
      <div className={styles.toastIcon}>
        <AlertCircle size={18} />
      </div>
      <span className={styles.toastMessage}>{message}</span>
      <button className={styles.toastClose} onClick={onClose} aria-label="Tutup notifikasi">
        <X size={14} />
      </button>
      <div className={styles.toastProgress} />
    </div>
  );
}

export default function Home() {
  useEffect(() => {
    document.title = "Landing Page | SKPI";
  }, []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const containerRef = useRef(null);

  // Login state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [message, setMessage] = useState("");

  // Error shake state
  const [shake, setShake] = useState(false);

  // Trigger shake animation on new error
  const triggerError = (msg) => {
    setMessage(msg);
    setShake(false);
    // Re-trigger shake via rAF to restart animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setShake(true));
    });
  };

  const clearError = () => {
    setMessage("");
    setShake(false);
  };

  const slides = [
    {
      id: "login",
      title: "Login",
      subtitle: "Masuk ke akun SKPI Anda",
      content: (
        <>
          <form
            className={`${styles.inputGroup} ${shake ? styles.shakeForm : ""}`}
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onAnimationEnd={() => setShake(false)}
          >
            <div className={`${styles.input} ${message ? styles.inputError : ""}`}>
              <User size={18} />
              <input
                type="text"
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
                placeholder="Password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError(); }}
                onFocus={() => setIsDragging(false)}
                required
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </form>

          <div className={styles.loginOptions}>
            <label className={styles.checkbox}>
              <input type="checkbox" />
              <span>Ingat saya</span>
            </label>
            <a href="#" className={styles.forgotPassword}>Lupa password?</a>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
            <button
              className={styles.button}
              onClick={(e) => { e.preventDefault(); handleLogin(); }}
              disabled={loadingLogin}
            >
              {loadingLogin ? (
                <>
                  <span className={styles.spinner} />
                  Memproses...
                </>
              ) : (
                <>
                  Login
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </div>

          <p className={styles.noteText}>
            * Gunakan username dan password SIAKAD Anda
          </p>

          {/* Toast rendered inside card for correct stacking */}
          <Toast message={message} onClose={clearError} />
        </>
      ),
    },
    {
      id: "about",
      title: "Tentang SKPI",
      subtitle: "Surat Keterangan Pendamping Ijazah",
      content: (
        <>
          <div className={styles.aboutContent}>
            <div className={styles.aboutCards}>
              <div className={styles.aboutCard}>
                <div className={styles.aboutIcon}>
                  <FileText size={22} />
                </div>
                <div>
                  <strong>Dokumen Resmi</strong>
                  <span>Pendamping ijazah yang diakui</span>
                </div>
              </div>
              <div className={styles.aboutCard}>
                <div className={styles.aboutIcon}>
                  <GraduationCap size={22} />
                </div>
                <div>
                  <strong>Capaian Akademik</strong>
                  <span>IPK & prestasi akademik</span>
                </div>
              </div>
              <div className={styles.aboutCard}>
                <div className={styles.aboutIcon}>
                  <Award size={22} />
                </div>
                <div>
                  <strong>Sertifikasi</strong>
                  <span>Kompetensi & keahlian</span>
                </div>
              </div>
              <div className={styles.aboutCard}>
                <div className={styles.aboutIcon}>
                  <Users size={22} />
                </div>
                <div>
                  <strong>Pengalaman</strong>
                  <span>Organisasi & magang</span>
                </div>
              </div>
            </div>
            <div className={styles.aboutFooter}>
              <div className={styles.infoBox}>
                <Info size={14} />
                <span>Diakui oleh Dunia Industri & Pendidikan</span>
              </div>
            </div>
          </div>
        </>
      ),
    },
  ];

  const handleDragStart = (e) => {
    const tag = e.target.tagName;
    if (tag === "INPUT" || tag === "BUTTON" || tag === "TEXTAREA") return;
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    setTranslateX(deltaX);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    if (Math.abs(translateX) > 80) {
      if (translateX > 0 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else if (translateX < 0 && currentIndex < slides.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    }
    setTranslateX(0);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  // Login handler
  async function handleLogin() {
    clearError();
    setLoadingLogin(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();
      if (res.ok) {
        window.location.href = "/admin/dashboard";
      } else {
        triggerError(data.error || "Login gagal. Periksa username dan password.");
      }
    } catch (err) {
      console.error("Login error:", err);
      triggerError("Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setLoadingLogin(false);
    }
  }

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLogo}>
            <Image
              src="/img/Logo_isb.png"
              alt="ISB Logo"
              width={70}
              height={40}
              className={styles.headerLogoImg}
            />
            <div className={styles.headerTitle}>
              <span>INSTITUT</span>
              <span>SHANTI BHUANA</span>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className={styles.mainContent}>
        {/* LEFT SIDE - BRAND AREA */}
        <div className={styles.left}>
          <div className={styles.leftContent}>
            <div className={styles.logoWrapper}>
              <Image
                src="/img/logo_isb.png"
                alt="ISB Logo"
                width={150}
                height={90}
                className={styles.logo}
              />
            </div>

            <h1>SKPI ISB</h1>

            <h2>
              Surat Keterangan<br />
              Pendamping Ijazah
            </h2>

            <p>
              Dokumen resmi yang menjelaskan capaian akademik,<br />
              kegiatan, dan kompetensi lulusan<br />
              Institut Shanti Bhuana.
            </p>

            <div className={styles.infoBadges}>
              <div className={styles.badge}>
                <CheckCircle size={12} />
                <span>Terakreditasi</span>
              </div>
              <div className={styles.badge}>
                <CheckCircle size={12} />
                <span>Resmi</span>
              </div>
              <div className={styles.badge}>
                <CheckCircle size={12} />
                <span>Terpercaya</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - SLIDER */}
        <div className={styles.right}>
          <div className={styles.sliderContainer}>
            {/* Navigation Arrows */}
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

            <div
              className={styles.sliderWrapper}
              onMouseDown={handleDragStart}
              onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
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

            {/* Dots Indicator */}
            <div className={styles.dots}>
              {slides.map((_, index) => (
                <button
                  key={index}
                  className={`${styles.dot} ${currentIndex === index ? styles.activeDot : ""}`}
                  onClick={() => goToSlide(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerBottom}>
          <p>&copy; {new Date().getFullYear()} Institut Shanti Bhuana. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}