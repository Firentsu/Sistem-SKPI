// frontend/src/app/mahasiswa/dashboard/page.js
"use client";

import { useEffect, useState } from "react";
import { useMahasiswa } from "@/context/MahasiswaContext";
import styles from "./dashboard.module.css";
import {
  CheckCircle2, Clock, XCircle, Award, FileText, Calendar,
  TrendingUp, Bell, Users, Activity, ClipboardList
} from "lucide-react";

// Mock data kegiatan (nanti dari API)
const mockKegiatan = [
  { id: 1, nama: "Workshop React", status: "Disetujui", tanggal: "2026-03-20" },
  { id: 2, nama: "Seminar AI", status: "Menunggu", tanggal: "2026-03-25" },
  { id: 3, nama: "Magang Startup", status: "Ditolak", tanggal: "2026-03-10" },
  { id: 4, nama: "Training Kepemimpinan", status: "Disetujui", tanggal: "2026-03-05" },
  { id: 5, nama: "Webinar Digital Marketing", status: "Disetujui", tanggal: "2026-03-28" },
  { id: 6, nama: "Lomba Coding", status: "Menunggu", tanggal: "2026-03-30" },
];

// Mock notifikasi
const mockNotifikasi = [
  { id: 1, text: "Kegiatan 'Workshop React' telah disetujui", time: "5 menit lalu", read: false },
  { id: 2, text: "SKPI Anda dapat diajukan setelah semua kegiatan terverifikasi", time: "1 jam lalu", read: false },
  { id: 3, text: "Kegiatan 'Magang Startup' ditolak, silakan cek catatan", time: "3 jam lalu", read: true },
];

export default function MahasiswaDashboard() {
  const { user, prodiConfig } = useMahasiswa();
  const [kegiatan, setKegiatan] = useState(mockKegiatan);
  const [notifikasi, setNotifikasi] = useState(mockNotifikasi);
  const [unreadCount, setUnreadCount] = useState(notifikasi.filter(n => !n.read).length);

  useEffect(() => {
    document.title = "Dashboard Mahasiswa | SKPI";
  }, []);

  // Statistik
  const totalKegiatan = kegiatan.length;
  const disetujui = kegiatan.filter(k => k.status === "Disetujui").length;
  const ditolak = kegiatan.filter(k => k.status === "Ditolak").length;
  const menunggu = kegiatan.filter(k => k.status === "Menunggu").length;

  // Progress SKPI (misal berdasarkan jumlah kegiatan yang disetujui dari target 10 kegiatan)
  const targetKegiatan = 10;
  const progress = Math.min(100, Math.floor((disetujui / targetKegiatan) * 100));

  // Fungsi menandai notifikasi dibaca (opsional)
  const markAsRead = (id) => {
    setNotifikasi(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <div className={styles.container}>
      {/* Welcome Card */}
      <div className={styles.welcomeCard} style={{ background: prodiConfig.gradient }}>
        <div>
          <h1 className={styles.welcomeTitle}>Selamat datang, {user.nama}!</h1>
          <p className={styles.welcomeSub}>Pantau perkembangan SKPI Anda di sini.</p>
        </div>
        <div className={styles.welcomeIcon}>
          <Award size={48} />
        </div>
      </div>

      {/* Stat Cards (mirip admin) */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard} style={{ borderLeftColor: prodiConfig.primary }}>
          <div className={styles.statIcon} style={{ background: `${prodiConfig.primary}14`, color: prodiConfig.primary }}>
            <ClipboardList size={24} />
          </div>
          <div>
            <div className={styles.statValue}>{totalKegiatan}</div>
            <div className={styles.statLabel}>Total Kegiatan</div>
          </div>
        </div>
        <div className={styles.statCard} style={{ borderLeftColor: "#10b981" }}>
          <div className={styles.statIcon} style={{ background: "#10b98114", color: "#10b981" }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className={styles.statValue}>{disetujui}</div>
            <div className={styles.statLabel}>Disetujui</div>
          </div>
        </div>
        <div className={styles.statCard} style={{ borderLeftColor: "#f59e0b" }}>
          <div className={styles.statIcon} style={{ background: "#f59e0b14", color: "#f59e0b" }}>
            <Clock size={24} />
          </div>
          <div>
            <div className={styles.statValue}>{menunggu}</div>
            <div className={styles.statLabel}>Menunggu</div>
          </div>
        </div>
        <div className={styles.statCard} style={{ borderLeftColor: "#ef4444" }}>
          <div className={styles.statIcon} style={{ background: "#ef444414", color: "#ef4444" }}>
            <XCircle size={24} />
          </div>
          <div>
            <div className={styles.statValue}>{ditolak}</div>
            <div className={styles.statLabel}>Ditolak</div>
          </div>
        </div>
      </div>

      {/* Two columns: Progress & Notifikasi */}
      <div className={styles.twoColumns}>
        {/* Progress SKPI */}
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

        {/* Notifikasi */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            <Bell size={18} /> Notifikasi Terbaru
            {unreadCount > 0 && <span className={styles.notifBadge}>{unreadCount}</span>}
          </h3>
          <div className={styles.notifList}>
            {notifikasi.length === 0 ? (
              <p className={styles.emptyNotif}>Tidak ada notifikasi</p>
            ) : (
              notifikasi.slice(0, 5).map((n) => (
                <div
                  key={n.id}
                  className={`${styles.notifItem} ${!n.read ? styles.notifUnread : ""}`}
                  onClick={() => markAsRead(n.id)}
                >
                  <div className={styles.notifDot} style={{ background: prodiConfig.primary }} />
                  <div className={styles.notifContent}>
                    <p>{n.text}</p>
                    <span>{n.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          <button className={styles.linkBtn}>Lihat Semua Notifikasi</button>
        </div>
      </div>

      {/* Kegiatan Terbaru */}
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
              {kegiatan.slice(0, 5).map((k) => (
                <tr key={k.id}>
                  <td>{k.nama}</td>
                  <td>{k.tanggal}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[k.status.toLowerCase()]}`}>
                      {k.status}
                    </span>
                  </td>
                </tr>
              ))}
              {kegiatan.length === 0 && (
                <tr><td colSpan="3" className={styles.emptyRow}>Belum ada kegiatan</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}