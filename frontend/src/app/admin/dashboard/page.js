"use client";

import { useEffect, useState } from "react";
import styles from "./dashboard.module.css";
import {
  Users, FileText, Clock, CheckCircle, AlertCircle,
  XCircle, Award, Bell, Filter, RefreshCw,
  ChevronRight, TrendingUp, BookOpen, MoreHorizontal
} from "lucide-react";

const PRODI_LIST = ["Semua Prodi", "Teknik Informatika", "Manajemen", "Akuntansi", "Ilmu Komunikasi"];

const DATA = {
  "Semua Prodi":        { totalMahasiswa: 480, totalKegiatan: 1340, menungguDisetujui: 87, disetujui: 620, dimintaVerifikasi: 43, ditolak: 28, skpiDiterbitkan: 215 },
  "Teknik Informatika": { totalMahasiswa: 140, totalKegiatan: 420,  menungguDisetujui: 30, disetujui: 190, dimintaVerifikasi: 15, ditolak: 8,  skpiDiterbitkan: 72  },
  "Manajemen":          { totalMahasiswa: 130, totalKegiatan: 370,  menungguDisetujui: 22, disetujui: 170, dimintaVerifikasi: 12, ditolak: 7,  skpiDiterbitkan: 60  },
  "Akuntansi":          { totalMahasiswa: 110, totalKegiatan: 290,  menungguDisetujui: 18, disetujui: 145, dimintaVerifikasi: 9,  ditolak: 6,  skpiDiterbitkan: 48  },
  "Ilmu Komunikasi":    { totalMahasiswa: 100, totalKegiatan: 260,  menungguDisetujui: 17, disetujui: 115, dimintaVerifikasi: 7,  ditolak: 7,  skpiDiterbitkan: 35  },
};

const PRODI_ROWS = [
  { prodi: "Teknik Informatika", mahasiswa: 140, kegiatan: 420, menunggu: 30, disetujui: 190, verifikasi: 15, ditolak: 8,  skpi: 72 },
  { prodi: "Manajemen",          mahasiswa: 130, kegiatan: 370, menunggu: 22, disetujui: 170, verifikasi: 12, ditolak: 7,  skpi: 60 },
  { prodi: "Akuntansi",          mahasiswa: 110, kegiatan: 290, menunggu: 18, disetujui: 145, verifikasi: 9,  ditolak: 6,  skpi: 48 },
  { prodi: "Ilmu Komunikasi",    mahasiswa: 100, kegiatan: 260, menunggu: 17, disetujui: 115, verifikasi: 7,  ditolak: 7,  skpi: 35 },
];

const NOTIFS = [
  { id: 1, type: "skpi",      text: "Mahasiswa Andi Pratama (TI-2021) mengajukan SKPI",    time: "5 menit lalu"  },
  { id: 2, type: "verifikasi",text: "Kegiatan 'Seminar AI 2024' menunggu verifikasi",       time: "12 menit lalu" },
  { id: 3, type: "published", text: "SKPI Mahasiswa Sari Dewi telah diterbitkan",           time: "28 menit lalu" },
  { id: 4, type: "revisi",    text: "Bukti kegiatan Budi Santoso diminta revisi",           time: "1 jam lalu"    },
  { id: 5, type: "published", text: "SKPI batch Manajemen 2020 berhasil digenerate",        time: "2 jam lalu"    },
  { id: 6, type: "verifikasi",text: "3 kegiatan baru dari prodi Akuntansi menunggu",        time: "3 jam lalu"    },
];

const NOTIF_COLORS = {
  skpi:       "#765439",
  verifikasi: "#b45309",
  published:  "#047857",
  revisi:     "#b91c1c",
};

const NOTIF_BG = {
  skpi:       "#fdf4ec",
  verifikasi: "#fffbeb",
  published:  "#f0fdf4",
  revisi:     "#fff5f5",
};

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

  useEffect(() => { document.title = "Dashboard | SKPI"; }, []);

  const cards = [
    { label: "Total Mahasiswa",     value: stats.totalMahasiswa,     icon: Users,         accent: "#765439" },
    { label: "Total Kegiatan",      value: stats.totalKegiatan,      icon: FileText,      accent: "#765439" },
    { label: "Menunggu Disetujui",  value: stats.menungguDisetujui,  icon: Clock,         accent: "#b45309" },
    { label: "Disetujui",           value: stats.disetujui,          icon: CheckCircle,   accent: "#047857" },
    { label: "Diminta Verifikasi",  value: stats.dimintaVerifikasi,  icon: AlertCircle,   accent: "#92400e" },
    { label: "Ditolak",             value: stats.ditolak,            icon: XCircle,       accent: "#b91c1c" },
    { label: "SKPI Diterbitkan",    value: stats.skpiDiterbitkan,    icon: Award,         accent: "#0f766e" },
  ];

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Ringkasan aktivitas sistem SKPI Institut Shanti Bhuana</p>
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
                  <button key={p} className={`${styles.dropItem} ${prodi === p ? styles.dropActive : ""}`}
                    onClick={() => { setProdi(p); setOpen(false); }}>
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

      {/* Bottom grid */}
      <div className={styles.bottom}>
        {/* Table */}
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
                  {["Program Studi","Mahasiswa","Kegiatan","Menunggu","Disetujui","Verifikasi","Ditolak","SKPI"].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PRODI_ROWS.map(r => (
                  <tr key={r.prodi}>
                    <td className={styles.tdProdi}>{r.prodi}</td>
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

        {/* Notifications */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionTitle}>
              <Bell size={15} />
              Notifikasi Terbaru
            </div>
            <span className={styles.badge}>{NOTIFS.length}</span>
          </div>
          <div className={styles.notifList}>
            {NOTIFS.map(n => (
              <div key={n.id} className={styles.notifItem}>
                <div className={styles.notifDot}
                  style={{ background: NOTIF_BG[n.type], color: NOTIF_COLORS[n.type], border: `1px solid ${NOTIF_COLORS[n.type]}22` }}>
                  <Bell size={12} />
                </div>
                <div className={styles.notifText}>
                  <p>{n.text}</p>
                  <span>{n.time}</span>
                </div>
                <button className={styles.notifMore}><MoreHorizontal size={13} /></button>
              </div>
            ))}
          </div>
          <button className={styles.linkBtn} style={{ marginTop: 10, width: "100%", justifyContent: "center" }}>
            Semua Notifikasi <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* Progress summary */}
      <div className={styles.section} style={{ marginTop: 0 }}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitle}><TrendingUp size={15} />Ringkasan Status Kegiatan</div>
        </div>
        <div className={styles.progressGrid}>
          {[
            { label: "Disetujui",        value: stats.disetujui,          color: "#047857" },
            { label: "Menunggu",         value: stats.menungguDisetujui,  color: "#b45309" },
            { label: "Diminta Verifikasi",value: stats.dimintaVerifikasi, color: "#92400e" },
            { label: "Ditolak",          value: stats.ditolak,            color: "#b91c1c" },
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