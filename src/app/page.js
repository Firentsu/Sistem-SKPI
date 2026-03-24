"use client";

import { useState, useRef } from "react";
import styles from "./page.module.css";
import { 
  User, Lock, Mail, Info, ArrowLeft, ArrowRight, 
  GraduationCap, Award, Briefcase, ChevronRight,
  Eye, EyeOff, CheckCircle
} from "lucide-react";
import Image from "next/image";

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const containerRef = useRef(null);

  const slides = [
    {
      id: "register",
      title: "Daftar",
      subtitle: "Buat akun baru untuk mengakses SKPI",
      content: (
        <>
          <div className={styles.inputGroup}>
            <div className={styles.input}>
              <User size={18} />
              <input type="text" placeholder="Nama Lengkap" />
            </div>
            <div className={styles.input}>
              <User size={18} />
              <input type="text" placeholder="Username / NIM" />
            </div>
            <div className={styles.input}>
              <Mail size={18} />
              <input type="email" placeholder="Email" />
            </div>
            <div className={styles.input}>
              <Lock size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Password" 
              />
              <button 
                type="button" 
                className={styles.eyeButton}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button className={styles.button}>
            Daftar
            <ChevronRight size={16} />
          </button>
          <p className={styles.switchText}>
            Sudah punya akun?{" "}
            <span onClick={() => setCurrentIndex(1)}>Login</span>
          </p>
        </>
      ),
    },
    {
      id: "login",
      title: "Login",
      subtitle: "Masuk ke akun SKPI Anda",
      content: (
        <>
          <div className={styles.inputGroup}>
            <div className={styles.input}>
              <User size={18} />
              <input type="text" placeholder="Username / NIM" />
            </div>
            <div className={styles.input}>
              <Lock size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Password" 
              />
              <button 
                type="button" 
                className={styles.eyeButton}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className={styles.loginOptions}>
            <label className={styles.checkbox}>
              <input type="checkbox" />
              <span>Ingat saya</span>
            </label>
            <a href="#" className={styles.forgotPassword}>Lupa password?</a>
          </div>
          <button className={styles.button}>
            Login
            <ChevronRight size={16} />
          </button>
          <p className={styles.switchText}>
            Belum punya akun?{" "}
            <span onClick={() => setCurrentIndex(0)}>Daftar</span>
          </p>
        </>
      ),
    },
    {
      id: "about",
      title: "Tentang SKPI",
      subtitle: "Surat Keterangan Pendamping Ijazah",
    },
  ];

  const handleDragStart = (e) => {
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

  return (
    <div className={styles.container}>
      {/* LEFT SIDE - BRAND AREA */}
      <div className={styles.left}>
        <div className={styles.leftContent}>
          <div className={styles.logoWrapper}>
            <Image
              src="/img/logo_isb.png"
              alt="ISB Logo"
              width={160}
              height={100}
              className={styles.logo}
            />
          </div>
          
          <h1>SKPI ISB</h1>
          
          <h2>
            Selamat Datang di <br />
            Sistem SKPI
          </h2>
          
          <p>
            Surat Keterangan Pendamping Ijazah (SKPI) merupakan dokumen resmi
            yang menjelaskan capaian akademik, kegiatan, dan kompetensi lulusan
            Institut Sains dan Bisnis.
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
  );
}