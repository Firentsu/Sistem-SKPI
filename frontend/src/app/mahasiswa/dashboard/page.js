"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMahasiswa } from "@/context/MahasiswaContext";
import { getMahasiswaKegiatan } from "@/lib/api";
import styles from "./dashboard.module.css";
import {
  Activity, CheckCircle2, Clock, XCircle, Bell, Check, Trash2,
  RefreshCw, ChevronRight, TrendingUp, RotateCw
} from "lucide-react";

const STATUS_LABEL = {
  diproses:  "Menunggu",
  disetujui: "Disetujui",
  ditolak:   "Ditolak",
  revisi:    "Revisi",
};

// Mock notifikasi — notifikasi belum tersedia via API
const mockNotifikasi = [
  {
    id_notifikasi: 1,
    judul: "Info SKPI",
    pesan: "SKPI Anda dapat diajukan setelah semua kegiatan terverifikasi",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    status_baca: false,
  },
  {
    id_notifikasi: 2,
    judul: "Selamat Datang",
    pesan: "Selamat datang di Sistem SKPI Institut Shanti Bhuana",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    status_baca: true,
  },
];

function relativeTime(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (diff < 60) return `${diff} detik lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

// Warna per tipe notifikasi (sama dengan admin)
const NOTIF_COLORS = {
  skpi: "#765439",
  verifikasi: "#b45309",
  published: "#047857",
  revisi: "#b91c1c",
};
const NOTIF_BG = {
  skpi: "#fdf4ec",
  verifikasi: "#fffbeb",
  published: "#f0fdf4",
  revisi: "#fff5f5",
};

function inferNotifType(judul) {
  if (judul.includes("SKPI")) return "skpi";
  if (judul.includes("Ditolak")) return "revisi";
  if (judul.includes("Disetujui")) return "published";
  return "verifikasi";
}

export default function MahasiswaDashboard() {
  const { user = {} } = useMahasiswa();
  const router = useRouter();

  const [kegiatan, setKegiatan] = useState([]);
  const [notifs, setNotifs] = useState(mockNotifikasi);
  const [unread, setUnread] = useState(mockNotifikasi.filter(n => !n.status_baca).length);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingNotif] = useState(false);

  const loadKegiatan = useCallback(async () => {
    setLoadingStats(true);
    try {
      const data = await getMahasiswaKegiatan();
      setKegiatan(data?.rows ?? []);
    } catch {
      setKegiatan([]);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Dashboard Mahasiswa | SKPI";
    loadKegiatan();
  }, [loadKegiatan]);

  const totalKegiatan = kegiatan.length;
  const disetujui = kegiatan.filter(k => k.status_verifikasi === "disetujui").length;
  const ditolak   = kegiatan.filter(k => k.status_verifikasi === "ditolak").length;
  const menunggu  = kegiatan.filter(k => k.status_verifikasi === "diproses").length;
  const revisi    = kegiatan.filter(k => k.status_verifikasi === "revisi").length;

  const cards = [
    { label: "Total Kegiatan", value: totalKegiatan, icon: Activity,      accent: "#765439" },
    { label: "Disetujui",      value: disetujui,     icon: CheckCircle2,  accent: "#047857" },
    { label: "Menunggu",       value: menunggu,      icon: Clock,         accent: "#b45309" },
    { label: "Revisi",         value: revisi,        icon: RotateCw,      accent: "#d97706" },
    { label: "Ditolak",        value: ditolak,       icon: XCircle,       accent: "#b91c1c" },
  ];

  const handleMarkRead = async (id) => {
    setNotifs(prev =>
      prev.map(n =>
        n.id_notifikasi === id ? { ...n, status_baca: true } : n
      )
    );
    setUnread(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    setNotifs(prev => prev.map(n => ({ ...n, status_baca: true })));
    setUnread(0);
  };

  const handleDelete = async (id) => {
    const target = notifs.find(n => n.id_notifikasi === id);
    setNotifs(prev => prev.filter(n => n.id_notifikasi !== id));
    if (target && !target.status_baca) setUnread(prev => Math.max(0, prev - 1));
  };

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard Mahasiswa</h1>
          <p className={styles.subtitle}>
            Selamat datang, {user?.nama || "Mahasiswa"} • {user?.nim || "-"}
          </p>
        </div>
        <div className={styles.headerRight}>
          <button
            className={`${styles.refreshBtn} ${loadingStats ? styles.spinning : ""}`}
            onClick={loadKegiatan}
            title="Refresh"
            disabled={loadingStats}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className={styles.cards}>
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={styles.card}
              style={{ "--accent": card.accent, animationDelay: `${i * 50}ms` }}
            >
              <div
                className={styles.cardIcon}
                style={{ background: `${card.accent}14`, color: card.accent }}
              >
                <Icon size={18} />
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardValue} style={{ color: card.accent }}>
                  {card.value}
                </div>
                <div className={styles.cardLabel}>{card.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Bottom grid (tabel kegiatan + notifikasi) ── */}
      <div className={styles.bottom}>
        {/* Tabel Kegiatan Terbaru */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionTitle}>
              <Activity size={15} /> Kegiatan Terbaru
            </div>
            <button className={styles.linkBtn} onClick={() => router.push("/mahasiswa/kegiatan")}>Lihat Semua ➜</button>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nama Kegiatan</th>
                  <th>Tanggal</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loadingStats ? (
                  <tr><td colSpan="3" className={styles.emptyRow}>Memuat data…</td></tr>
                ) : kegiatan.length === 0 ? (
                  <tr><td colSpan="3" className={styles.emptyRow}>Belum ada kegiatan</td></tr>
                ) : (
                  kegiatan.slice(0, 5).map(k => {
                    const statusKey = k.status_verifikasi || "diproses";
                    return (
                      <tr key={k.id_kegiatan}>
                        <td>{k.nama_kegiatan}</td>
                        <td>{k.tanggal_kegiatan ? k.tanggal_kegiatan.slice(0, 10) : "-"}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles[statusKey]}`}>
                            {STATUS_LABEL[statusKey] || statusKey}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notifikasi (sama persis dengan admin) */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionTitle}>
              <Bell size={15} /> Notifikasi Terbaru
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {unread > 0 && (
                <button
                  className={styles.linkBtn}
                  onClick={handleMarkAllRead}
                  style={{ fontSize: "11px", padding: "2px 8px" }}
                >
                  <Check size={12} /> Tandai semua
                </button>
              )}
              {unread > 0 && <span className={styles.badge}>{unread}</span>}
            </div>
          </div>

          <div className={styles.notifList}>
            {loadingNotif ? (
              <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ height: "52px", background: "#f0ece8", borderRadius: "8px" }} />
                ))}
              </div>
            ) : notifs.length === 0 ? (
              <div className={styles.emptyNotif}>Tidak ada notifikasi</div>
            ) : (
              notifs.map(n => {
                const type = inferNotifType(n.judul);
                return (
                  <div
                    key={n.id_notifikasi}
                    className={`${styles.notifItem} ${!n.status_baca ? styles.notifUnread : ""}`}
                    onClick={() => !n.status_baca && handleMarkRead(n.id_notifikasi)}
                    style={{ cursor: n.status_baca ? "default" : "pointer" }}
                  >
                    <div
                      className={styles.notifDot}
                      style={{
                        background: NOTIF_BG[type],
                        color: NOTIF_COLORS[type],
                        border: `1px solid ${NOTIF_COLORS[type]}22`,
                      }}
                    >
                      <Bell size={12} />
                    </div>
                    <div className={styles.notifText}>
                      <p>{n.pesan}</p>
                      <span>{relativeTime(n.created_at)}</span>
                    </div>
                    <button
                      className={styles.notifMore}
                      onClick={e => {
                        e.stopPropagation();
                        handleDelete(n.id_notifikasi);
                      }}
                      title="Hapus notifikasi"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <button className={styles.linkBtn} style={{ marginTop: 10, width: "100%", justifyContent: "center" }}>
            Semua Notifikasi <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* ── Ringkasan Status Kegiatan (progress) ── */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitle}>
            <TrendingUp size={15} /> Ringkasan Status Kegiatan
          </div>
        </div>
        <div className={styles.progressGrid}>
          {[
            { label: "Disetujui", value: disetujui, color: "#047857" },
            { label: "Menunggu",  value: menunggu,  color: "#b45309" },
            { label: "Revisi",    value: revisi,    color: "#d97706" },
            { label: "Ditolak",   value: ditolak,   color: "#b91c1c" },
          ].map(p => {
            const pct = Math.round((p.value / totalKegiatan) * 100) || 0;
            return (
              <div key={p.label} className={styles.progressItem}>
                <div className={styles.progressTop}>
                  <span>{p.label}</span>
                  <strong style={{ color: p.color }}>{pct}%</strong>
                </div>
                <div className={styles.track}>
                  <div className={styles.fill} style={{ width: `${pct}%`, background: p.color }} />
                </div>
                <p className={styles.progressSub}>{p.value} kegiatan</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
