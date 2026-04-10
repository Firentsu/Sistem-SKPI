"use client";

import { useEffect, useState } from "react";
import { useMahasiswa } from "@/context/MahasiswaContext";
import styles from "./dashboard.module.css";
import { CheckCircle2, Clock, XCircle, Award, TrendingUp, Calendar, FileCheck } from "lucide-react";

// Mock data kegiatan (nanti dari API)
const mockKegiatan = [
  { id: 1, nama: "Workshop React", status: "Disetujui", tanggal: "2026-03-20", poin: 15 },
  { id: 2, nama: "Seminar AI", status: "Menunggu", tanggal: "2026-03-25", poin: 10 },
  { id: 3, nama: "Magang Startup", status: "Ditolak", tanggal: "2026-03-10", poin: 20 },
  { id: 4, nama: "Training Kepemimpinan", status: "Disetujui", tanggal: "2026-03-05", poin: 12 },
];

export default function MahasiswaDashboard() {
  const { user, prodiConfig } = useMahasiswa();
  const [kegiatan, setKegiatan] = useState(mockKegiatan);
  const [notifikasi, setNotifikasi] = useState([
    "Kegiatan 'Workshop React' telah disetujui",
    "SKPI Anda dapat diajukan setelah poin mencapai 100",
  ]);

      // Set document title
  useEffect(() => {
    document.title = "Dashboard Mahasiswa | SKPI";
  }, []);


  // Statistik
  const totalKegiatan = kegiatan.length;
  const disetujui = kegiatan.filter(k => k.status === "Disetujui").length;
  const ditolak = kegiatan.filter(k => k.status === "Ditolak").length;
  const menunggu = kegiatan.filter(k => k.status === "Menunggu").length;
  const totalPoin = kegiatan.reduce((sum, k) => sum + (k.status === "Disetujui" ? k.poin : 0), 0);
  const progressSKPI = Math.min(100, Math.floor((totalPoin / 100) * 100)); // target 100 poin



  return (
    <div className={styles.container}>
      <div className={styles.welcomeCard} style={{ background: prodiConfig.gradient }}>
        <div>
          <h1 className={styles.welcomeTitle}>Selamat datang, {user.nama}!</h1>
          <p className={styles.welcomeSub}>Pantau perkembangan SKPI Anda di sini.</p>
        </div>
        <div className={styles.welcomeIcon}>
          <Award size={48} />
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard} style={{ borderLeftColor: prodiConfig.primary }}>
          <div className={styles.statIcon}><FileCheck size={24} /></div>
          <div>
            <div className={styles.statValue}>{totalKegiatan}</div>
            <div className={styles.statLabel}>Total Kegiatan</div>
          </div>
        </div>
        <div className={styles.statCard} style={{ borderLeftColor: "#10b981" }}>
          <div className={styles.statIcon}><CheckCircle2 size={24} /></div>
          <div>
            <div className={styles.statValue}>{disetujui}</div>
            <div className={styles.statLabel}>Disetujui</div>
          </div>
        </div>
        <div className={styles.statCard} style={{ borderLeftColor: "#f59e0b" }}>
          <div className={styles.statIcon}><Clock size={24} /></div>
          <div>
            <div className={styles.statValue}>{menunggu}</div>
            <div className={styles.statLabel}>Menunggu</div>
          </div>
        </div>
        <div className={styles.statCard} style={{ borderLeftColor: "#ef4444" }}>
          <div className={styles.statIcon}><XCircle size={24} /></div>
          <div>
            <div className={styles.statValue}>{ditolak}</div>
            <div className={styles.statLabel}>Ditolak</div>
          </div>
        </div>
      </div>

      <div className={styles.twoColumns}>
        {/* Progress SKPI */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Progress SKPI</h3>
          <div className={styles.progressWrapper}>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progressSKPI}%`, background: prodiConfig.primary }}></div>
            </div>
            <div className={styles.progressInfo}>
              <span>{totalPoin} / 100 poin</span>
              <span>{progressSKPI}%</span>
            </div>
          </div>
          <p className={styles.progressNote}>Syarat kelulusan SKPI: minimal 100 poin.</p>
          {progressSKPI >= 100 && (
            <button className={styles.ajukanBtn} style={{ background: prodiConfig.primary }}>Ajukan SKPI Sekarang</button>
          )}
        </div>

        {/* Notifikasi */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Notifikasi Terbaru</h3>
          <div className={styles.notifList}>
            {notifikasi.map((notif, idx) => (
              <div key={idx} className={styles.notifItem}>
                <div className={styles.notifDot} style={{ background: prodiConfig.primary }}></div>
                <span>{notif}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Riwayat kegiatan terbaru */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Kegiatan Terbaru</h3>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nama Kegiatan</th>
                <th>Tanggal</th>
                <th>Poin</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {kegiatan.slice(0, 3).map(k => (
                <tr key={k.id}>
                  <td>{k.nama}</td>
                  <td>{k.tanggal}</td>
                  <td>{k.poin}</td>
                  <td><span className={`${styles.statusBadge} ${styles[k.status.toLowerCase()]}`}>{k.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}