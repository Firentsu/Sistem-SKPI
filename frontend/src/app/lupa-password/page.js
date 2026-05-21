"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Lock, ArrowLeft, CheckCircle, AlertCircle,
  RefreshCw, Info, User, Phone, Mail,
} from "lucide-react";
import styles from "./page.module.css";

const API_URL =
  (typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"))
    ? (process.env.NEXT_PUBLIC_API_URL_LOCAL || "")
    : (process.env.NEXT_PUBLIC_API_URL || "");

export default function LupaPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [found, setFound] = useState(null);
  const [error, setError] = useState("");

  const isMahasiswa = /^\d+$/.test(input.trim());
  const role = input.trim() ? (isMahasiswa ? "mahasiswa" : "admin") : null;

  const handleCek = async () => {
    const val = input.trim();
    if (!val) { setError("Mohon masukkan NIM atau username Anda"); return; }
    setLoading(true);
    setError("");
    try {
      const endpoint = isMahasiswa
        ? `/api/mahasiswa/auth/cek-akun?nim=${encodeURIComponent(val)}`
        : `/api/auth/cek-akun?username=${encodeURIComponent(val)}`;
      const res = await fetch(`${API_URL}${endpoint}`, { credentials: "include" });
      const data = res.ok ? await res.json() : { exists: false };
      setFound(data.exists ?? false);
    } catch {
      setFound(false);
    } finally {
      setLoading(false);
      setStep(2);
    }
  };

  const reset = () => { setStep(1); setInput(""); setFound(null); setError(""); };

  return (
    <div className={styles.page}>
      <div className={styles.card}>

        {/* ── Header ── */}
        <div className={styles.cardHeader}>
          <div className={styles.iconWrap}>
            <Lock size={24} />
          </div>
          <p className={styles.brand}>Sistem SKPI · Institut Shanti Bhuana</p>
        </div>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div className={styles.body}>
            <h1 className={styles.title}>Lupa Password?</h1>
            <p className={styles.subtitle}>
              Masukkan NIM (mahasiswa) atau username (admin) untuk memeriksa akun Anda.
            </p>

            <div className={styles.inputGroup}>
              <label className={styles.label}>NIM / Username</label>
              <div className={`${styles.inputWrap} ${error ? styles.inputWrapError : ""}`}>
                <User size={16} className={styles.inputIcon} />
                <input
                  className={styles.input}
                  type="text"
                  placeholder="Contoh: 123456 atau adminuser"
                  value={input}
                  onChange={e => { setInput(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleCek()}
                  autoFocus
                />
              </div>
              {role && !error && (
                <p className={styles.detectHint}>
                  <Info size={11} />
                  Terdeteksi sebagai akun <strong>{role === "mahasiswa" ? "Mahasiswa" : "Admin"}</strong>
                </p>
              )}
              {error && (
                <p className={styles.errorMsg}>
                  <AlertCircle size={12} /> {error}
                </p>
              )}
            </div>

            <button className={styles.btnPrimary} onClick={handleCek} disabled={loading}>
              {loading
                ? <><RefreshCw size={14} className={styles.spin} /> Memeriksa…</>
                : <><CheckCircle size={14} /> Periksa Akun</>}
            </button>

            <button className={styles.btnBack} onClick={() => router.push("/")}>
              <ArrowLeft size={13} /> Kembali ke Login
            </button>
          </div>
        )}

        {/* ── STEP 2: ditemukan ── */}
        {step === 2 && found && (
          <div className={styles.body}>
            <div className={styles.resultIcon} style={{ background: "#dcfce7", color: "#15803d" }}>
              <CheckCircle size={28} />
            </div>
            <h1 className={styles.title} style={{ color: "#14532d" }}>Akun Ditemukan</h1>
            <p className={styles.subtitle}>
              Akun dengan <strong style={{ color: "#765439" }}>{isMahasiswa ? `NIM ${input}` : `username "${input}"`}</strong> berhasil ditemukan.
            </p>

            <div className={styles.stepsBox}>
              <p className={styles.stepsTitle}>Langkah reset password:</p>
              {[
                "Kunjungi bagian akademik Institut Shanti Bhuana.",
                `Informasikan ${isMahasiswa ? "NIM" : "username"} Anda: ${input}`,
                isMahasiswa
                  ? "Admin akan mereset password ke default (NIM Anda)."
                  : "Admin akan memberikan password sementara.",
                "Setelah login, ganti password melalui menu Profil.",
              ].map((text, i) => (
                <div key={i} className={styles.stepRow}>
                  <span className={styles.stepNum}>{i + 1}</span>
                  <span className={styles.stepText}>{text}</span>
                </div>
              ))}
            </div>

            <div className={styles.contactBox}>
              <div className={styles.contactItem}>
                <Phone size={13} />
                <span>Bagian Akademik — Institut Shanti Bhuana</span>
              </div>
              <div className={styles.contactItem}>
                <Mail size={13} />
                <span>akademik@isb.ac.id</span>
              </div>
            </div>

            <button className={styles.btnPrimary} onClick={() => router.push("/")}>
              <ArrowLeft size={13} /> Kembali ke Login
            </button>
          </div>
        )}

        {/* ── STEP 2: tidak ditemukan ── */}
        {step === 2 && !found && (
          <div className={styles.body}>
            <div className={styles.resultIcon} style={{ background: "#fee2e2", color: "#dc2626" }}>
              <AlertCircle size={28} />
            </div>
            <h1 className={styles.title} style={{ color: "#7f1d1d" }}>Akun Tidak Ditemukan</h1>
            <p className={styles.subtitle}>
              {isMahasiswa ? `NIM "${input}"` : `Username "${input}"`} tidak ditemukan dalam sistem.
              Pastikan data yang dimasukkan sudah benar.
            </p>

            <div className={styles.notFoundBox}>
              <Info size={13} />
              <span>Jika Anda yakin sudah terdaftar, hubungi bagian akademik Institut Shanti Bhuana untuk bantuan.</span>
            </div>

            <div className={styles.btnRow}>
              <button className={styles.btnSecondary} onClick={reset}>
                <RefreshCw size={13} /> Coba Lagi
              </button>
              <button className={styles.btnPrimary} onClick={() => router.push("/")}>
                <ArrowLeft size={13} /> Ke Login
              </button>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
