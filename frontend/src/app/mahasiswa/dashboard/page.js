"use client";

import { useEffect, useState } from "react";
import { useMahasiswa } from "@/context/MahasiswaContext";
import styles from "./dashboard.module.css";
import {
  CheckCircle2, Clock, XCircle, Award, TrendingUp, FileCheck, Activity
} from "lucide-react";

const mockKegiatan = [
  { id: 1, nama: "Workshop React", status: "Disetujui", tanggal: "2026-03-20" },
  { id: 2, nama: "Seminar AI", status: "Menunggu", tanggal: "2026-03-25" },
  { id: 3, nama: "Magang Startup", status: "Ditolak", tanggal: "2026-03-10" },
  { id: 4, nama: "Training Kepemimpinan", status: "Disetujui", tanggal: "2026-03-05" },
  { id: 5, nama: "Webinar Digital", status: "Disetujui", tanggal: "2026-03-28" },
];

export default function MahasiswaDashboard() {
  const { user, prodiConfig } = useMahasiswa();
  const [kegiatan] = useState(mockKegiatan);

  useEffect(() => {
    document.title = "Dashboard Mahasiswa | SKPI";
  }, []);

  const totalKegiatan = kegiatan.length;
  const disetujui = kegiatan.filter(k => k.status === "Disetujui").length;
  const ditolak = kegiatan.filter(k => k.status === "Ditolak").length;
  const menunggu = kegiatan.filter(k => k.status === "Menunggu").length;

  // Progress berdasarkan jumlah kegiatan disetujui (target 10)
  const targetKegiatan = 10;
  const progress = Math.min(100, Math.floor((disetujui / targetKegiatan) * 100));

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
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            <TrendingUp size={18} /> Progress SKPI
          </h3>
          <div className={styles.progressWrapper}>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progress}%`, background: prodiConfig.primary }}></div>
            </div>
            <div className={styles.progressInfo}>
              <span>{disetujui} dari {targetKegiatan} kegiatan disetujui</span>
              <span>{progress}%</span>
            </div>
          </div>
          <p className={styles.progressNote}>
            Syarat pengajuan SKPI: minimal {targetKegiatan} kegiatan telah disetujui.
          </p>
          {progress >= 100 && (
            <button className={styles.ajukanBtn} style={{ background: prodiConfig.primary }}>
              Ajukan SKPI Sekarang
            </button>
          )}
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            <Activity size={18} /> Kegiatan Terbaru
          </h3>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nama Kegiatan</th>
                  <th>Tanggal</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {kegiatan.slice(0, 5).map(k => (
                  <tr key={k.id}>
                    <td>{k.nama}</td>
                    <td>{k.tanggal}</td>
                    <td><span className={`${styles.statusBadge} ${styles[k.status.toLowerCase()]}`}>{k.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}