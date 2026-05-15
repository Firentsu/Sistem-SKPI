"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell, CheckCircle2, AlertTriangle, Send, ClipboardCheck,
  Clock, Trash2, CheckCheck, RefreshCw,
} from "lucide-react";
import {
  getAdminNotifikasi, markNotifikasiRead, markAllNotifikasiRead, inferNotifType,
} from "@/lib/api";
import styles from "./notifications.module.css";

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "Baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 172800) return "Kemarin";
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

const TYPE_CFG = {
  skpi:       { Icon: Send,           cls: "iconSkpi",       label: "SKPI"       },
  published:  { Icon: CheckCircle2,   cls: "iconPublished",  label: "Diterbitkan"},
  revisi:     { Icon: AlertTriangle,  cls: "iconRevisi",     label: "Revisi"     },
  verifikasi: { Icon: ClipboardCheck, cls: "iconVerifikasi", label: "Verifikasi" },
};

export default function AdminNotificationsPage() {
  const [notifs, setNotifs]       = useState([]);
  const [unread, setUnread]       = useState(0);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("semua"); // semua | belum_dibaca | dibaca

  // Ambil daftar notifikasi (maks 50)
  const load = useCallback(async () => {
    setLoading(true);
    const data = await getAdminNotifikasi(50);
    setNotifs(data.rows ?? []);
    setUnread(data.unread ?? 0);
    setLoading(false);
  }, []);

  // Set judul halaman & load data saat pertama kali
  useEffect(() => {
    document.title = "Notifikasi | Admin SKPI";
    load();
  }, [load]);

  // Tandai satu notifikasi sudah dibaca
  const handleRead = async (id) => {
    const notif = notifs.find(n => n.id_notifikasi === id);
    if (notif?.status_baca) return;
    await markNotifikasiRead(id);
    setNotifs(prev => prev.map(n => n.id_notifikasi === id ? { ...n, status_baca: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  // Tandai semua notifikasi sudah dibaca
  const handleReadAll = async () => {
    await markAllNotifikasiRead();
    setNotifs(prev => prev.map(n => ({ ...n, status_baca: true })));
    setUnread(0);
  };

  const filtered = notifs.filter(n => {
    if (filter === "belum_dibaca") return !n.status_baca;
    if (filter === "dibaca")       return n.status_baca;
    return true;
  });

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}><Bell size={20} /></div>
          <div>
            <h1 className={styles.title}>Semua Notifikasi</h1>
            <p className={styles.subtitle}>
              {unread > 0 ? `${unread} belum dibaca` : "Semua sudah dibaca"}
            </p>
          </div>
        </div>
        <div className={styles.headerActions}>
          {unread > 0 && (
            <button className={styles.readAllBtn} onClick={handleReadAll}>
              <CheckCheck size={14} /> Tandai semua dibaca
            </button>
          )}
          <button className={styles.refreshBtn} onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? styles.spin : ""} />
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className={styles.tabs}>
        {[
          { key: "semua",        label: "Semua",         count: notifs.length     },
          { key: "belum_dibaca", label: "Belum Dibaca",  count: notifs.filter(n => !n.status_baca).length },
          { key: "dibaca",       label: "Sudah Dibaca",  count: notifs.filter(n => n.status_baca).length  },
        ].map(t => (
          <button
            key={t.key}
            className={`${styles.tab} ${filter === t.key ? styles.tabActive : ""}`}
            onClick={() => setFilter(t.key)}
          >
            {t.label}
            <span className={`${styles.tabBadge} ${filter === t.key ? styles.tabBadgeActive : ""}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className={styles.list}>
        {loading ? (
          <div className={styles.empty}>
            <RefreshCw size={28} className={styles.spin} />
            <span>Memuat notifikasi…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <Bell size={40} strokeWidth={1.2} />
            <span>Tidak ada notifikasi</span>
          </div>
        ) : (
          filtered.map(notif => {
            const type = inferNotifType(notif.judul);
            const { Icon, cls } = TYPE_CFG[type] ?? TYPE_CFG.verifikasi;
            return (
              <div
                key={notif.id_notifikasi}
                className={`${styles.item} ${!notif.status_baca ? styles.itemUnread : ""}`}
                onClick={() => handleRead(notif.id_notifikasi)}
              >
                {!notif.status_baca && <span className={styles.unreadDot} />}
                <div className={`${styles.typeIcon} ${styles[cls]}`}>
                  <Icon size={16} />
                </div>
                <div className={styles.content}>
                  <div className={styles.itemTitle}>{notif.judul}</div>
                  <div className={styles.itemMsg}>{notif.pesan}</div>
                  <div className={styles.itemTime}>
                    <Clock size={10} />
                    {timeAgo(notif.created_at)}
                  </div>
                </div>
                {!notif.status_baca && (
                  <button
                    className={styles.markBtn}
                    onClick={e => { e.stopPropagation(); handleRead(notif.id_notifikasi); }}
                    title="Tandai sudah dibaca"
                  >
                    <CheckCircle2 size={15} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
