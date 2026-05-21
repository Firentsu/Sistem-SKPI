"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell, CheckCircle2, AlertTriangle, Send, ClipboardCheck,
  Clock, Trash2, CheckCheck, RefreshCw, X, BellOff,
} from "lucide-react";
import {
  getAdminNotifikasi, markNotifikasiRead, markAllNotifikasiRead,
  deleteAdminNotifikasi, deleteAllReadAdminNotif, inferNotifType,
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
  skpi:       { Icon: Send,           cls: "iconSkpi",       label: "SKPI"        },
  published:  { Icon: CheckCircle2,   cls: "iconPublished",  label: "Diterbitkan" },
  revisi:     { Icon: AlertTriangle,  cls: "iconRevisi",     label: "Revisi"      },
  verifikasi: { Icon: ClipboardCheck, cls: "iconVerifikasi", label: "Verifikasi"  },
};

export default function AdminNotificationsPage() {
  const [notifs,    setNotifs]    = useState([]);
  const [unread,    setUnread]    = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState("semua");
  const [deleting,  setDeleting]  = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getAdminNotifikasi(100);
    setNotifs(data.rows ?? []);
    setUnread(data.unread ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    document.title = "Notifikasi | Admin SKPI";
    load();
  }, [load]);

  const handleRead = async (id) => {
    const notif = notifs.find(n => n.id_notifikasi === id);
    if (notif?.status_baca) return;
    await markNotifikasiRead(id);
    setNotifs(prev => prev.map(n => n.id_notifikasi === id ? { ...n, status_baca: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  const handleReadAll = async () => {
    await markAllNotifikasiRead();
    setNotifs(prev => prev.map(n => ({ ...n, status_baca: true })));
    setUnread(0);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    setDeleting(id);
    await deleteAdminNotifikasi(id);
    const deleted = notifs.find(n => n.id_notifikasi === id);
    setNotifs(prev => prev.filter(n => n.id_notifikasi !== id));
    if (deleted && !deleted.status_baca) setUnread(prev => Math.max(0, prev - 1));
    setDeleting(null);
  };

  const handleDeleteRead = async () => {
    await deleteAllReadAdminNotif();
    setNotifs(prev => prev.filter(n => !n.status_baca));
  };

  const filtered = notifs.filter(n => {
    if (filter === "belum_dibaca") return !n.status_baca;
    if (filter === "dibaca")       return n.status_baca;
    return true;
  });

  const readCount = notifs.filter(n => n.status_baca).length;

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}><Bell size={20} /></div>
          <div>
            <h1 className={styles.title}>Semua Notifikasi</h1>
            <p className={styles.subtitle}>
              {loading ? "Memuat…" : unread > 0 ? `${unread} belum dibaca · ${notifs.length} total` : `${notifs.length} notifikasi · semua sudah dibaca`}
            </p>
          </div>
        </div>
        <div className={styles.headerActions}>
          {readCount > 0 && (
            <button className={styles.deleteReadBtn} onClick={handleDeleteRead} title="Hapus semua yang sudah dibaca">
              <Trash2 size={13} /> Hapus dibaca ({readCount})
            </button>
          )}
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

      {/* ── Filter Tabs ── */}
      <div className={styles.tabs}>
        {[
          { key: "semua",        label: "Semua",        count: notifs.length },
          { key: "belum_dibaca", label: "Belum Dibaca", count: notifs.filter(n => !n.status_baca).length },
          { key: "dibaca",       label: "Sudah Dibaca", count: readCount },
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

      {/* ── List ── */}
      <div className={styles.list}>
        {loading ? (
          <div className={styles.empty}>
            <RefreshCw size={28} className={styles.spin} />
            <span>Memuat notifikasi…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <BellOff size={40} strokeWidth={1.2} />
            <span>{filter === "belum_dibaca" ? "Tidak ada notifikasi yang belum dibaca" : "Tidak ada notifikasi"}</span>
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
                <div className={styles.itemActions}>
                  {!notif.status_baca && (
                    <button
                      className={styles.markBtn}
                      onClick={e => { e.stopPropagation(); handleRead(notif.id_notifikasi); }}
                      title="Tandai sudah dibaca"
                    >
                      <CheckCircle2 size={15} />
                    </button>
                  )}
                  <button
                    className={styles.deleteBtn}
                    onClick={e => handleDelete(e, notif.id_notifikasi)}
                    disabled={deleting === notif.id_notifikasi}
                    title="Hapus notifikasi"
                  >
                    {deleting === notif.id_notifikasi
                      ? <RefreshCw size={14} className={styles.spin} />
                      : <X size={14} />}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
