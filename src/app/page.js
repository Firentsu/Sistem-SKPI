"use client";

import { useState } from "react";
import styles from "./page.module.css";
import { User, Lock, Mail } from "lucide-react";

export default function Home() {
  const [mode, setMode] = useState("login");

  return (
    <div className={styles.container}>
      
      {/* LEFT SIDE */}
      <div className={styles.left}>
        <div className={styles.leftContent}>
          <h1>SKPI ISB</h1>

          <img src="/logo.png" alt="logo" className={styles.logo} />

          <h2>
            Selamat Datang di <br />
            Sistem SKPI
          </h2>

          <p>
            Surat Keterangan Pendamping Ijazah (SKPI) merupakan dokumen resmi
            yang menjelaskan capaian akademik, kegiatan, dan kompetensi lulusan.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className={styles.right}>
        <div className={styles.card}>
          
          <h2>{mode === "login" ? "Login" : "Register"}</h2>

          {mode === "register" && (
            <div className={styles.input}>
              <User size={18} />
              <input placeholder="Nama Lengkap" />
            </div>
          )}

          <div className={styles.input}>
            <User size={18} />
            <input placeholder="Username" />
          </div>

          {mode === "register" && (
            <div className={styles.input}>
              <Mail size={18} />
              <input placeholder="Email" />
            </div>
          )}

          <div className={styles.input}>
            <Lock size={18} />
            <input type="password" placeholder="Password" />
          </div>

          <button className={styles.button}>
            {mode === "login" ? "Masuk" : "Daftar"}
          </button>

          <p className={styles.switch}>
            {mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
            <span onClick={() => setMode(mode === "login" ? "register" : "login")}>
              {mode === "login" ? "Daftar" : "Login"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}