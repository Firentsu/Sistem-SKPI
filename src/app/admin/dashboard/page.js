"use client";

import { useEffect } from "react";
import styles from "./dashboard.module.css";


export default function DashboardPage() {
  useEffect(() => {
    document.title = "Dashboard | SKPI";
  }, []);
  
  return (
    <div className={styles.dashboard}>
      <h1>Dashboard Admin</h1>
      <p>Selamat datang di panel administrator SKPI.</p>

      {/* Statistik Cards */}
      <div className={styles.cards}>
        <div className={styles.card}>
          <h3>Total Mahasiswa</h3>
          <p>120</p>
        </div>
        <div className={styles.card}>
          <h3>Total Kegiatan</h3>
          <p>350</p>
        </div>
        <div className={styles.card}>
          <h3>Menunggu Verifikasi</h3>
          <p>45</p>
        </div>
        <div className={styles.card}>
          <h3>SKPI Diterbitkan</h3>
          <p>80</p>
        </div>
      </div>

      {/* Grafik Placeholder */}
      <div className={styles.chartSection}>
        <h2>Statistik Per Prodi</h2>
        <div className={styles.chartPlaceholder}>
          <p>[Grafik jumlah kegiatan per prodi]</p>
        </div>
      </div>

      {/* Notifikasi */}
      <div className={styles.notifications}>
        <h2>Notifikasi Terbaru</h2>
        <ul>
          <li>Mahasiswa A mengajukan SKPI</li>
          <li>Kegiatan B menunggu verifikasi</li>
          <li>SKPI Mahasiswa C telah diterbitkan</li>
        </ul>
      </div>
    </div>
  );
}
