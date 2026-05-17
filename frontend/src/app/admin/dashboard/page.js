"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";
import {
  Users, FileText, Clock, CheckCircle, AlertCircle,
  XCircle, Award, Bell, Filter, RefreshCw,
  ChevronRight, TrendingUp, BookOpen, Check, Trash2, Loader2,
} from "lucide-react";
import {
  getDashboardStats,
  getAdminNotifikasi,
  markNotifikasiRead,
  markAllNotifikasiRead,
  deleteAdminNotifikasi,
  inferNotifType,
} from "@/lib/api";

// ══════════════════════════════════════════
// KONFIGURASI WARNA UNTUK TIAP TIPE NOTIFIKASI
// ══════════════════════════════════════════
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

// ── Format tanggal relatif (cth: "3 menit lalu") ──────────
function relativeTime(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (diff < 60)   return `${diff} detik lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400)return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

// ── Counter dengan animasi naik ──────────────────────────
function Counter({ value }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let cur = 0;
    const step = Math.max(1, Math.ceil(value / 40)); // makin besar value, makin cepat
    const t = setInterval(() => {
      cur = Math.min(cur + step, value);
      setN(cur);
      if (cur >= value) clearInterval(t);
    }, 18); // ~55 fps
    return () => clearInterval(t);
  }, [value]);
  return <>{n.toLocaleString("id-ID")}</>;
}

// ── Skeleton loader untuk placeholder saat loading ────────
function Skeleton({ w = "100%", h = "20px", radius = "6px" }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: "linear-gradient(90deg, #f0ece8 25%, #e8e2dc 50%, #f0ece8 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
    }} />
  );
}

export default function DashboardPage() {
  const router = useRouter();

  // ── State untuk statistik ─────────────────────────────────
  const [stats, setStats]         = useState(null);
  const [prodis, setProdis]       = useState([]);
  const [selectedProdi, setSelectedProdi] = useState(null); // null artinya "Semua Prodi"
  const [prodiOpen, setProdiOpen] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);

  // ── State untuk notifikasi ────────────────────────────────
  const [notifs, setNotifs]       = useState([]);
  const [unread, setUnread]       = useState(0);
  const [loadingNotif, setLoadingNotif] = useState(true);

  const dropdownRef = useRef(null); // untuk mendeteksi klik luar

  // ── Load statistik dashboard ─────────────────────────────
  const loadStats = useCallback(async (prodiId = null) => {
    setLoadingStats(true);
    const data = await getDashboardStats(prodiId);
    if (data) {
      setStats(data);
      // Isi daftar prodi (hanya sekali) dari data yang sama
      if (data.prodiStats?.length && prodis.length === 0) {
        setProdis(data.prodiStats);
      }
    }
    setLoadingStats(false);
  }, [prodis.length]);

  // ── Load notifikasi terbaru ──────────────────────────────
  const loadNotif = useCallback(async () => {
    setLoadingNotif(true);
    const data = await getAdminNotifikasi(20); // maks 20 notif
    if (data) {
      setNotifs(data.rows ?? []);
      setUnread(data.unread ?? 0);
    }
    setLoadingNotif(false);
  }, []);

  // Jalankan sekali saat komponen mount
  useEffect(() => {
    document.title = "Dashboard Admin | SKPI";
    loadStats(null); // muat semua prodi
    loadNotif();
  }, []);

  // Tutup dropdown prodi saat klik di luar
  useEffect(() => {
    const fn = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProdiOpen(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // ── Filter prodi ─────────────────────────────────────────
  const handleSelectProdi = (prodi) => {
    setSelectedProdi(prodi);
    setProdiOpen(false);
    loadStats(prodi?.id_prodi ?? null); // null = semua
  };

  // ── Notifikasi handlers ──────────────────────────────────

  const handleMarkRead = async (id) => {
    await markNotifikasiRead(id);
    setNotifs(prev => prev.map(n => n.id_notifikasi === id ? { ...n, status_baca: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllNotifikasiRead();
    setNotifs(prev => prev.map(n => ({ ...n, status_baca: true })));
    setUnread(0);
  };

  /**
   * Hapus notifikasi dengan KONFIRMASI ringan (mencegah tak sengaja).
   * Keamanan: tidak ada data sensitif yang terhapus, hanya notifikasi.
   */
  const handleDelete = async (id) => {
    if (!window.confirm("Hapus notifikasi ini?")) return; // konfirmasi sederhana
    const target = notifs.find(n => n.id_notifikasi === id);
    await deleteAdminNotifikasi(id);
    setNotifs(prev => prev.filter(n => n.id_notifikasi !== id));
    if (target && !target.status_baca) setUnread(prev => Math.max(0, prev - 1));
  };

  // ── Data stat cards ──────────────────────────────────────
  const cards = stats ? [
    { label: "Total Mahasiswa",      value: stats.totalMahasiswa,    icon: Users,       accent: "#765439" },
    { label: "Total Kegiatan",       value: stats.totalKegiatan,     icon: FileText,    accent: "#765439" },
    { label: "Menunggu Disetujui",   value: stats.kegiatanMenunggu,  icon: Clock,       accent: "#b45309" },
    { label: "Disetujui",            value: stats.kegiatanDisetujui, icon: CheckCircle, accent: "#047857" },
    { label: "Diminta Revisi",       value: stats.kegiatanRevisi,    icon: AlertCircle, accent: "#92400e" },
    { label: "Ditolak",              value: stats.kegiatanDitolak,   icon: XCircle,     accent: "#b91c1c" },
    { label: "SKPI Diterbitkan",     value: stats.skpiResmi,         icon: Award,       accent: "#0f766e" },
  ] : [];

  // Data tabel per prodi (jika filter aktif, tampilkan hanya yang sesuai)
  const prodiRows = selectedProdi
    ? (stats?.prodiStats?.filter(r => r.id_prodi === selectedProdi.id_prodi) ?? [])
    : (stats?.prodiStats ?? []);

  const totalKeg = stats?.totalKegiatan || 1; // hindari pembagian nol

  return (
    <div className={styles.page}>

      {/* ═══════════ HEADER ═══════════ */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Ringkasan aktivitas sistem SKPI Institut Shanti Bhuana</p>
        </div>
        <div className={styles.headerRight}>
          {/* Filter Prodi */}
          <div className={styles.filterBox} ref={dropdownRef}>
            <button className={styles.filterBtn} onClick={() => setProdiOpen(o => !o)}>
              <Filter size={13} />
              <span>{selectedProdi?.prodi ?? "Semua Prodi"}</span>
              <ChevronRight size={13} style={{
                transform: prodiOpen ? "rotate(90deg)" : "none",
                transition: ".15s"
              }} />
            </button>
            {prodiOpen && (
              <div className={styles.dropdown}>
                <button
                  className={`${styles.dropItem} ${!selectedProdi ? styles.dropActive : ""}`}
                  onClick={() => handleSelectProdi(null)}
                >
                  Semua Prodi
                </button>
                {prodis.map(p => (
                  <button
                    key={p.id_prodi}
                    className={`${styles.dropItem} ${selectedProdi?.id_prodi === p.id_prodi ? styles.dropActive : ""}`}
                    onClick={() => handleSelectProdi(p)}
                  >
                    {p.prodi}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Tombol refresh */}
          <button
            className={styles.refreshBtn}
            title="Refresh"
            onClick={() => {
              loadStats(selectedProdi?.id_prodi ?? null);
              loadNotif();
            }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* ═══════════ STAT CARDS ═══════════ */}
      <div className={styles.cards}>
        {loadingStats
          ? Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className={styles.card} style={{ "--accent": "#765439" }}>
                <Skeleton w="40px" h="40px" radius="10px" />
                <div className={styles.cardBody} style={{ gap: 8 }}>
                  <Skeleton w="60px" h="28px" />
                  <Skeleton w="110px" h="14px" />
                </div>
              </div>
            ))
          : cards.map((c, i) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.label}
                  className={styles.card}
                  style={{
                    "--accent": c.accent,
                    animationDelay: `${i * 50}ms` // muncul bergantian
                  }}
                >
                  <div
                    className={styles.cardIcon}
                    style={{ background: `${c.accent}14`, color: c.accent }}
                  >
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
            })
        }
      </div>

      {/* ═══════════ BOTTOM GRID: TABEL & NOTIFIKASI ═══════════ */}
      <div className={styles.bottom}>

        {/* Tabel per Prodi */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionTitle}>
              <BookOpen size={15} />Kegiatan per Program Studi
            </div>
          </div>
          <div className={styles.tableWrap}>
            {loadingStats ? (
              <div style={{ padding: "24px", display: "flex", justifyContent: "center" }}>
                <Loader2 size={28} style={{ animation: "spin 1s linear infinite", color: "#765439" }} />
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    {["Program Studi","Mahasiswa","Kegiatan","Menunggu","Disetujui","Revisi","Ditolak","SKPI"].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {prodiRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "20px", color: "#999" }}>
                        Tidak ada data
                      </td>
                    </tr>
                  ) : (
                    prodiRows.map(r => (
                      <tr key={r.id_prodi ?? r.prodi}>
                        <td className={styles.tdProdi}>{r.prodi}</td>
                        <td>
                          <span className={`${styles.tag} ${styles.tagBrown}`}>
                            {r.mahasiswa}
                          </span>
                        </td>
                        <td className={styles.tdNum}>{r.kegiatan}</td>
                        <td><span className={`${styles.tag} ${styles.tagOrange}`}>{r.menunggu}</span></td>
                        <td><span className={`${styles.tag} ${styles.tagGreen}`}>{r.disetujui}</span></td>
                        <td><span className={`${styles.tag} ${styles.tagAmber}`}>{r.verifikasi}</span></td>
                        <td><span className={`${styles.tag} ${styles.tagRed}`}>{r.ditolak}</span></td>
                        <td><span className={`${styles.tag} ${styles.tagTeal}`}>{r.skpi}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Panel Notifikasi */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionTitle}>
              <Bell size={15} />Notifikasi Terbaru
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
              {unread > 0 && (
                <span className={styles.badge}>{unread}</span>
              )}
            </div>
          </div>

          <div className={styles.notifList}>
            {loadingNotif ? (
              <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                {[1,2,3].map(i => <Skeleton key={i} h="52px" />)}
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
                    {/* Ikon notifikasi */}
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
                    {/* Isi notifikasi */}
                    <div className={styles.notifText}>
                      <p>{n.pesan}</p>
                      <span>{relativeTime(n.created_at)}</span>
                    </div>
                    {/* Tombol hapus */}
                    <button
                      className={styles.notifMore}
                      onClick={e => {
                        e.stopPropagation(); // jangan panggil markRead
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

          <button
            className={styles.linkBtn}
            style={{ marginTop: 10, width: "100%", justifyContent: "center" }}
            onClick={() => router.push("/admin/notifications")}
          >
            Semua Notifikasi <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* ═══════════ PROGRESS RINGKASAN STATUS KEGIATAN ═══════════ */}
      {stats && (
        <div className={styles.section} style={{ marginTop: 0 }}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionTitle}>
              <TrendingUp size={15} />Ringkasan Status Kegiatan
            </div>
          </div>
          <div className={styles.progressGrid}>
            {[
              { label: "Disetujui",       value: stats.kegiatanDisetujui, color: "#047857" },
              { label: "Menunggu",        value: stats.kegiatanMenunggu,  color: "#b45309" },
              { label: "Diminta Revisi",  value: stats.kegiatanRevisi,    color: "#92400e" },
              { label: "Ditolak",         value: stats.kegiatanDitolak,   color: "#b91c1c" },
            ].map(p => {
              const pct = Math.round((p.value / totalKeg) * 100) || 0;
              return (
                <div key={p.label} className={styles.progressItem}>
                  <div className={styles.progressTop}>
                    <span>{p.label}</span>
                    <strong style={{ color: p.color }}>{pct}%</strong>
                  </div>
                  <div className={styles.track}>
                    <div
                      className={styles.fill}
                      style={{ width: `${pct}%`, background: p.color }}
                    />
                  </div>
                  <p className={styles.progressSub}>
                    {p.value.toLocaleString("id-ID")} kegiatan
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}