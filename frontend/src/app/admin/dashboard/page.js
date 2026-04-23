// frontend/src/app/admin/dashboard/page.js
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./dashboard.module.css";
import {
  Users, FileText, Clock, CheckCircle, AlertCircle,
  XCircle, Award, Filter, RefreshCw,
  ChevronRight, TrendingUp, BookOpen
} from "lucide-react";

// ==================== DATA PROGRAM STUDI ====================
const PRODI_LIST = [
  "Semua Prodi",
  "Teknologi Informasi",
  "Manajemen",
  "Pendidikan Guru Sekolah Dasar",
  "Kewirausahaan",
  "Sistem Informasi",
  "Agroekoteknologi"
];

// Warna tema untuk setiap prodi (sesuai dengan PRODI_CONFIG)
const PRODI_COLORS = {
  "Teknologi Informasi": "#ff7f00",
  "Manajemen": "#0099cc",
  "Pendidikan Guru Sekolah Dasar": "#800080",
  "Kewirausahaan": "#ff3300",
  "Sistem Informasi": "#1a0909",
  "Agroekoteknologi": "#00bfb3",
};

// Data statistik per prodi (mock, nanti dari backend)
const DATA = {
  "Semua Prodi": {
    totalMahasiswa: 480,
    totalKegiatan: 1340,
    menungguDisetujui: 87,
    disetujui: 620,
    dimintaVerifikasi: 43,
    ditolak: 28,
    skpiDiterbitkan: 215
  },
  "Teknologi Informasi": {
    totalMahasiswa: 120,
    totalKegiatan: 380,
    menungguDisetujui: 25,
    disetujui: 175,
    dimintaVerifikasi: 12,
    ditolak: 8,
    skpiDiterbitkan: 65
  },
  "Manajemen": {
    totalMahasiswa: 130,
    totalKegiatan: 370,
    menungguDisetujui: 22,
    disetujui: 170,
    dimintaVerifikasi: 12,
    ditolak: 7,
    skpiDiterbitkan: 60
  },
  "Pendidikan Guru Sekolah Dasar": {
    totalMahasiswa: 90,
    totalKegiatan: 250,
    menungguDisetujui: 15,
    disetujui: 110,
    dimintaVerifikasi: 8,
    ditolak: 5,
    skpiDiterbitkan: 40
  },
  "Kewirausahaan": {
    totalMahasiswa: 70,
    totalKegiatan: 200,
    menungguDisetujui: 12,
    disetujui: 85,
    dimintaVerifikasi: 6,
    ditolak: 4,
    skpiDiterbitkan: 30
  },
  "Sistem Informasi": {
    totalMahasiswa: 40,
    totalKegiatan: 80,
    menungguDisetujui: 8,
    disetujui: 50,
    dimintaVerifikasi: 3,
    ditolak: 2,
    skpiDiterbitkan: 15
  },
  "Agroekoteknologi": {
    totalMahasiswa: 30,
    totalKegiatan: 60,
    menungguDisetujui: 5,
    disetujui: 30,
    dimintaVerifikasi: 2,
    ditolak: 2,
    skpiDiterbitkan: 5
  },
};

// Data tabel per prodi
const PRODI_ROWS = [
  { prodi: "Teknologi Informasi", mahasiswa: 120, kegiatan: 380, menunggu: 25, disetujui: 175, verifikasi: 12, ditolak: 8, skpi: 65, color: "#ff7f00" },
  { prodi: "Manajemen", mahasiswa: 130, kegiatan: 370, menunggu: 22, disetujui: 170, verifikasi: 12, ditolak: 7, skpi: 60, color: "#0099cc" },
  { prodi: "Pendidikan Guru Sekolah Dasar", mahasiswa: 90, kegiatan: 250, menunggu: 15, disetujui: 110, verifikasi: 8, ditolak: 5, skpi: 40, color: "#800080" },
  { prodi: "Kewirausahaan", mahasiswa: 70, kegiatan: 200, menunggu: 12, disetujui: 85, verifikasi: 6, ditolak: 4, skpi: 30, color: "#ff3300" },
  { prodi: "Sistem Informasi", mahasiswa: 40, kegiatan: 80, menunggu: 8, disetujui: 50, verifikasi: 3, ditolak: 2, skpi: 15, color: "#1a0909" },
  { prodi: "Agroekoteknologi", mahasiswa: 30, kegiatan: 60, menunggu: 5, disetujui: 30, verifikasi: 2, ditolak: 2, skpi: 5, color: "#00bfb3" },
];

function Counter({ value }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let cur = 0;
    const step = Math.max(1, Math.ceil(value / 40));
    const t = setInterval(() => {
      cur = Math.min(cur + step, value);
      setN(cur);
      if (cur >= value) clearInterval(t);
    }, 18);
    return () => clearInterval(t);
  }, [value]);
  return <>{n.toLocaleString("id-ID")}</>;
}

export default function DashboardPage() {
  const [prodi, setProdi] = useState("Semua Prodi");
  const [open, setOpen] = useState(false);
  const stats = DATA[prodi];

  useEffect(() => {
    document.title = "Dashboard Admin | SKPI";
  }, []);

  const cards = [
    { label: "Total Mahasiswa", value: stats.totalMahasiswa, icon: Users, accent: "#765439" },
    { label: "Total Kegiatan", value: stats.totalKegiatan, icon: FileText, accent: "#765439" },
    { label: "Menunggu Disetujui", value: stats.menungguDisetujui, icon: Clock, accent: "#b45309" },
    { label: "Disetujui", value: stats.disetujui, icon: CheckCircle, accent: "#047857" },
    { label: "Diminta Verifikasi", value: stats.dimintaVerifikasi, icon: AlertCircle, accent: "#92400e" },
    { label: "Ditolak", value: stats.ditolak, icon: XCircle, accent: "#b91c1c" },
    { label: "SKPI Diterbitkan", value: stats.skpiDiterbitkan, icon: Award, accent: "#0f766e" },
  ];

  return (
    <div className={styles.page}>
      {/* Header dengan Logo Institut */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          
          <div>
            <h1 className={styles.title}>Dashboard</h1>
            <p className={styles.subtitle}>
              Ringkasan aktivitas sistem SKPI Institut Shanti Bhuana Bengkayang
            </p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.filterBox}>
            <button className={styles.filterBtn} onClick={() => setOpen(!open)}>
              <Filter size={13} />
              <span>{prodi}</span>
              <ChevronRight size={13} style={{ transform: open ? "rotate(90deg)" : "none", transition: ".15s" }} />
            </button>
            {open && (
              <div className={styles.dropdown}>
                {PRODI_LIST.map(p => (
                  <button
                    key={p}
                    className={`${styles.dropItem} ${prodi === p ? styles.dropActive : ""}`}
                    onClick={() => { setProdi(p); setOpen(false); }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className={styles.refreshBtn} title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className={styles.cards}>
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className={styles.card} style={{ "--accent": c.accent, animationDelay: `${i * 50}ms` }}>
              <div className={styles.cardIcon} style={{ background: `${c.accent}14`, color: c.accent }}>
                <Icon size={18} />
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardValue} style={{ color: c.accent }}>
                  <Counter value={c.value} />
                </div>
                <div className={styles.cardLabel}>{c.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabel Kegiatan per Program Studi */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitle}>
            <BookOpen size={15} />
            Kegiatan per Program Studi
          </div>
          <button className={styles.linkBtn}>Lihat Detail</button>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {["Program Studi", "Mahasiswa", "Kegiatan", "Menunggu", "Disetujui", "Verifikasi", "Ditolak", "SKPI"].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PRODI_ROWS.map(r => (
                <tr key={r.prodi}>
                  <td className={styles.tdProdi} style={{ color: r.color, fontWeight: 600 }}>
                    {r.prodi}
                  </td>
                  <td><span className={`${styles.tag} ${styles.tagBrown}`}>{r.mahasiswa}</span></td>
                  <td className={styles.tdNum}>{r.kegiatan}</td>
                  <td><span className={`${styles.tag} ${styles.tagOrange}`}>{r.menunggu}</span></td>
                  <td><span className={`${styles.tag} ${styles.tagGreen}`}>{r.disetujui}</span></td>
                  <td><span className={`${styles.tag} ${styles.tagAmber}`}>{r.verifikasi}</span></td>
                  <td><span className={`${styles.tag} ${styles.tagRed}`}>{r.ditolak}</span></td>
                  <td><span className={`${styles.tag} ${styles.tagTeal}`}>{r.skpi}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ringkasan Status Kegiatan */}
      <div className={styles.section} style={{ marginTop: 0 }}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitle}>
            <TrendingUp size={15} /> Ringkasan Status Kegiatan
          </div>
        </div>
        <div className={styles.progressGrid}>
          {[
            { label: "Disetujui", value: stats.disetujui, color: "#047857" },
            { label: "Menunggu", value: stats.menungguDisetujui, color: "#b45309" },
            { label: "Diminta Verifikasi", value: stats.dimintaVerifikasi, color: "#92400e" },
            { label: "Ditolak", value: stats.ditolak, color: "#b91c1c" },
          ].map(p => {
            const pct = Math.round((p.value / stats.totalKegiatan) * 100) || 0;
            return (
              <div key={p.label} className={styles.progressItem}>
                <div className={styles.progressTop}>
                  <span>{p.label}</span>
                  <strong style={{ color: p.color }}>{pct}%</strong>
                </div>
                <div className={styles.track}>
                  <div className={styles.fill} style={{ width: `${pct}%`, background: p.color }} />
                </div>
                <p className={styles.progressSub}>{p.value.toLocaleString("id-ID")} kegiatan</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}