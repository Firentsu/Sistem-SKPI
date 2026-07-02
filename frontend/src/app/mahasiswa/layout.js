// frontend/src/app/mahasiswa/layout.js
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  LayoutDashboard, FileText, LogOut,
  ChevronRight, ChevronDown, Bell,
  Camera, X, Check, Upload, WifiOff,
  BookOpen, ClipboardList, BookMarked,
  CheckCircle2, XCircle, AlertTriangle, Award, Info, Clock,
  Menu, User,
} from "lucide-react";
import styles from "./mahasiswa.module.css";
import { useRouter, usePathname } from "next/navigation";
import { useMahasiswa, MahasiswaProvider } from "@/context/MahasiswaContext";
import {
  getMahasiswaMe,
  logoutMahasiswa,
  uploadMahasiswaAvatar,
  isMockMode,
  getAvatarUrl,
  getMahasiswaNotifikasi,
  markMahasiswaNotifRead,
  markAllMahasiswaNotifRead,
  inferMahasiswaNotifType,
  createMahasiswaSSE,
} from "@/lib/api";

/* ══════════════════════════════════════════════════════════════
   Avatar Editor Modal (sama dengan admin)
══════════════════════════════════════════════════════════════ */
function AvatarEditorModal({ currentSrc, onClose, onSave }) {
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);
  const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  function processFile(file) {
    setError("");
    if (!ACCEPTED.includes(file.type)) {
      setError("Format tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Ukuran file maksimal 2 MB.");
      return;
    }
    setPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!preview) return;
    setSaving(true);
    try {
      const blob = await fetch(preview).then(r => r.blob());
      const form = new FormData();
      form.append("avatar", blob, "avatar.jpg");
      const result = await uploadMahasiswaAvatar(form);
      if (!result.ok) {
        setError(result.data?.error ?? "Gagal menyimpan foto.");
        return;
      }
      onSave(getAvatarUrl(result.data.avatar));
    } catch {
      setError("Gagal menyimpan foto. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  // Bersihkan URL objek saat komponen unmount
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  // Escape untuk menutup modal
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalHeaderIcon}><Camera size={15} /></div>
            <span className={styles.modalTitle}>Edit Foto Profil</span>
          </div>
          <button className={styles.modalClose} onClick={onClose}><X size={15} /></button>
        </div>

        <div className={styles.modalPreviewRow}>
          <div className={styles.modalPreviewWrap}>
            <img src={preview || currentSrc} alt="Preview" className={styles.modalPreviewImg} />
            {preview && (
              <button className={styles.modalPreviewClear} onClick={() => { setPreview(null); setError(""); }}>
                <X size={10} />
              </button>
            )}
            {preview && <div className={styles.modalPreviewBadge}><Check size={10} /> Baru</div>}
          </div>
          <div className={styles.modalPreviewInfo}>
            <p className={styles.modalPreviewLabel}>{preview ? "Foto baru dipilih" : "Foto saat ini"}</p>
            <p className={styles.modalPreviewHint}>JPG, PNG, WebP, GIF · maks. 2 MB</p>
          </div>
        </div>

        <div
          className={`${styles.dropZone} ${dragging ? styles.dropZoneActive : ""}`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) processFile(f); }}
          onClick={() => inputRef.current?.click()}
          role="button" tabIndex={0} onKeyDown={e => e.key === "Enter" && inputRef.current?.click()}
        >
          <div className={styles.dropIconWrap}><Upload size={20} className={styles.dropIcon} /></div>
          <span className={styles.dropText}>{dragging ? "Lepaskan di sini…" : "Klik atau seret foto ke sini"}</span>
          <span className={styles.dropSubText}>PNG, JPG, WebP hingga 2MB</span>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
            className={styles.fileInput} onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }} />
        </div>

        {error && <div className={styles.modalErrorBox}><X size={13} /><p className={styles.modalError}>{error}</p></div>}
        <div className={styles.modalActions}>
          <button className={styles.modalBtnCancel} onClick={onClose}>Batal</button>
          <button className={styles.modalBtnSave} onClick={handleSave} disabled={!preview || saving}>
            {saving ? <><span className={styles.savingSpinner} /> Menyimpan…</> : <><Check size={14} /> Simpan Foto</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Notifikasi Dropdown
══════════════════════════════════════════════════════════════ */
function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "Baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 172800) return "Kemarin";
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

const NOTIF_ICONS = {
  approved:  { Icon: CheckCircle2,   cls: "notifTypeApproved"  },
  rejected:  { Icon: XCircle,        cls: "notifTypeRejected"  },
  revision:  { Icon: AlertTriangle,  cls: "notifTypeRevision"  },
  published: { Icon: Award,          cls: "notifTypePublished" },
  info:      { Icon: Info,           cls: "notifTypeInfo"      },
};

function NotificationDropdown({ isOpen, onClose, onUnreadChange }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    getMahasiswaNotifikasi(20).then(data => {
      setNotifications(data.rows ?? []);
      setUnreadCount(data.unread ?? 0);
      setLoading(false);
    });
  }, [isOpen]);

  // Terima notifikasi real-time saat dropdown sedang terbuka
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      const notif = e.detail;
      setNotifications(prev => [notif, ...prev]);
      setUnreadCount(prev => prev + 1);
    };
    window.addEventListener("notif:new", handler);
    return () => window.removeEventListener("notif:new", handler);
  }, [isOpen]);

  const handleMarkAsRead = async (id) => {
    if (notifications.find(n => n.id_notifikasi === id)?.status_baca) return;
    await markMahasiswaNotifRead(id);
    setNotifications(prev => prev.map(n => n.id_notifikasi === id ? { ...n, status_baca: true } : n));
    setUnreadCount(prev => {
      const next = Math.max(0, prev - 1);
      if (onUnreadChange) onUnreadChange(next);
      return next;
    });
  };

  const handleMarkAllRead = async () => {
    await markAllMahasiswaNotifRead();
    setNotifications(prev => prev.map(n => ({ ...n, status_baca: true })));
    setUnreadCount(0);
    if (onUnreadChange) onUnreadChange(0);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.notifDropdown}>
      <div className={styles.notifHeader}>
        <span>Notifikasi</span>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className={styles.notifMarkAllBtn}>
            Tandai semua dibaca
          </button>
        )}
      </div>
      <div className={styles.notifList}>
        {loading ? (
          <div className={styles.notifEmpty}>Memuat…</div>
        ) : notifications.length === 0 ? (
          <div className={styles.notifEmpty}>Tidak ada notifikasi</div>
        ) : (
          notifications.map(notif => {
            const type = inferMahasiswaNotifType(notif.judul);
            const { Icon, cls } = NOTIF_ICONS[type] ?? NOTIF_ICONS.info;
            return (
              <div
                key={notif.id_notifikasi}
                className={`${styles.notifItem} ${!notif.status_baca ? styles.notifUnread : ""}`}
                onClick={() => handleMarkAsRead(notif.id_notifikasi)}
              >
                {!notif.status_baca && <span className={styles.notifUnreadDot} />}
                <div className={`${styles.notifTypeIcon} ${styles[cls]}`}>
                  <Icon size={15} />
                </div>
                <div className={styles.notifContent}>
                  <div className={styles.notifTitle}>{notif.judul}</div>
                  <div className={styles.notifMsg}>{notif.pesan}</div>
                  <div className={styles.notifTime}>
                    <Clock size={9} />
                    {timeAgo(notif.created_at)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className={styles.notifFooter}>
        <Link href="/mahasiswa/notifications" onClick={onClose}>Lihat semua notifikasi</Link>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Layout Inner
══════════════════════════════════════════════════════════════ */
function MahasiswaLayoutInner({ children }) {
  const [loggingOut, setLoggingOut] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [mockMode, setMockMode] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState("/img/avatar-default.jpg");
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifUnread, setNotifUnread] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const notifRef = useRef(null);

  const router = useRouter();
  const pathname = usePathname();
  const { user, updateUser, prodiConfig } = useMahasiswa();

  // SKPI dropdown state
  const isOnSkpiPage = pathname.startsWith("/mahasiswa/kegiatan") || pathname.startsWith("/mahasiswa/icp");
  const [skpiOpen, setSkpiOpen] = useState(false);

  // Auto-buka dropdown SKPI saat berada di halaman SKPI
  useEffect(() => {
    if (isOnSkpiPage) setSkpiOpen(true);
  }, [isOnSkpiPage]);

  // Cek sesi mahasiswa
  useEffect(() => {
    let mounted = true;
    (async () => {
      const session = await getMahasiswaMe();
      if (!mounted) return;
      if (session && session.mahasiswa) {
        const fotoApi = session.mahasiswa?.avatar ?? session.mahasiswa?.foto;
        if (fotoApi) setAvatarSrc(getAvatarUrl(fotoApi));
        setMockMode(isMockMode());
        setChecking(false);
        getMahasiswaNotifikasi(20).then(d => setNotifUnread(d.unread ?? 0));
      } else {
        router.replace("/");
      }
    })();
    return () => { mounted = false; };
  }, [router]);

  // Sinkron foto dari context
  useEffect(() => {
    if (user?.foto) setAvatarSrc(getAvatarUrl(user.foto));
  }, [user?.foto]);

  // Event listeners untuk update profil/avatar
  useEffect(() => {
    const onAvatarUpdated = (e) => {
      if (e.detail?.avatar) {
        const url = getAvatarUrl(e.detail.avatar);
        setAvatarSrc(url);
        updateUser({ foto: url });
      }
    };
    const onProfileUpdated = (e) => {
      if (e.detail) updateUser(e.detail);
    };
    window.addEventListener("avatar:updated", onAvatarUpdated);
    window.addEventListener("profile:updated", onProfileUpdated);
    return () => {
      window.removeEventListener("avatar:updated", onAvatarUpdated);
      window.removeEventListener("profile:updated", onProfileUpdated);
    };
  }, [updateUser]);

  // Menu mahasiswa dengan grup dropdown SKPI
  const navItems = [
    { href: "/mahasiswa/dashboard", label: "Dashboard",    icon: LayoutDashboard },
    {
      type: "group", id: "skpi", label: "SKPI", icon: Award,
      items: [
        { href: "/mahasiswa/kegiatan", label: "Kegiatan", icon: BookOpen },
        { href: "/mahasiswa/icp",      label: "ICP",      icon: ClipboardList },
      ],
    },
    { href: "/mahasiswa/panduan",   label: "Buku Panduan", icon: BookMarked },
    { href: "/mahasiswa/profile",   label: "Profil",       icon: User },
  ];

  // Semua item rata (untuk breadcrumb)
  const allNavFlat = navItems.flatMap(item =>
    item.type === "group" ? item.items : [item]
  );

  // Auto-poll unread count via SSE
  useEffect(() => {
    const es = createMahasiswaSSE();
    if (!es) return;
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "notif") {
          setNotifUnread(prev => prev + 1);
          window.dispatchEvent(new CustomEvent("notif:new", { detail: data }));
        }
      } catch { /* abaikan pesan malformed */ }
    };
    es.onerror = () => es.close();
    return () => es.close();
  }, []);

  // Escape key → tutup notifikasi & sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setNotifOpen(false);
        setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Tutup notifikasi saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Tutup sidebar saat rute berubah
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Logout
  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    await logoutMahasiswa();
    router.replace("/");
    setTimeout(() => { try { window.location.replace("/"); } catch {} }, 200);
  };

  // Simpan avatar
  const handleAvatarSave = useCallback((newUrl) => {
    setAvatarSrc(newUrl);
    updateUser({ foto: newUrl });
    setShowEditor(false);
  }, [updateUser]);

  const activeNav = allNavFlat.find(n => pathname.startsWith(n.href));
  const breadcrumb = activeNav ? activeNav.label : "Dashboard";

  if (checking) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.loadingLogo}><div className={styles.spinner} /></div>
        <span>Memeriksa autentikasi…</span>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {/* Banner mode demo */}
      {mockMode && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
          background: "#fef3c7", borderBottom: "1px solid #f59e0b",
          padding: "5px 16px", display: "flex", alignItems: "center", gap: 8,
          fontSize: 12, color: "#92400e",
        }}>
          <WifiOff size={13} />
          <strong>Mode Demo</strong> — Backend tidak aktif. Data yang ditampilkan adalah data simulasi.
        </div>
      )}

      {showEditor && (
        <AvatarEditorModal currentSrc={avatarSrc} onClose={() => setShowEditor(false)} onSave={handleAvatarSave} />
      )}

      {/* Overlay sidebar untuk mobile */}
      {sidebarOpen && (
        <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.open : ""}`}
        style={mockMode ? { marginTop: 29 } : {}}
      >
        <div className={styles.brand}>
          <div className={styles.logo}>
            <Image src="/img/logo_isb.png" alt="logo" width={80} height={35} priority style={{ width: "auto", height: "auto" }} />
          </div>
          <div className={styles.brandText}><strong>SKPI</strong><span>Mahasiswa</span></div>
        </div>

        <nav className={styles.nav}>
          <p className={styles.navSection}>MENU</p>
          {navItems.map((item) => {
            if (item.type === "group") {
              const GroupIcon = item.icon;
              const isGroupActive = item.items.some(sub => pathname.startsWith(sub.href));
              return (
                <div key={item.id} className={styles.navGroup}>
                  <button
                    className={`${styles.navGroupBtn} ${isGroupActive ? styles.navGroupBtnActive : ""}`}
                    onClick={() => setSkpiOpen(o => !o)}
                  >
                    {isGroupActive && <span className={styles.activeAccent} style={{ background: prodiConfig.primary }} />}
                    <span className={styles.iconWrap}><GroupIcon size={17} /></span>
                    <span className={styles.navLabel}>{item.label}</span>
                    <ChevronDown
                      size={13}
                      className={styles.groupChevron}
                      style={{ transform: skpiOpen ? "rotate(180deg)" : "none" }}
                    />
                  </button>
                  {skpiOpen && (
                    <div className={styles.navSubItems}>
                      {item.items.map(sub => {
                        const SubIcon = sub.icon;
                        const isSubActive = pathname.startsWith(sub.href);
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={`${styles.navSubItem} ${isSubActive ? styles.navSubItemActive : ""}`}
                            onClick={() => setSidebarOpen(false)}
                          >
                            {isSubActive && <span className={styles.activeAccent} style={{ background: prodiConfig.primary }} />}
                            <span className={styles.iconWrap}><SubIcon size={15} /></span>
                            <span className={styles.navLabel}>{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                {isActive && <span className={styles.activeAccent} style={{ background: prodiConfig.primary }} />}
                <span className={styles.iconWrap}><Icon size={17} /></span>
                <span className={styles.navLabel}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className={styles.sidebarFooter}><span>v1.0 · © Institut Shanti Bhuana</span></div>
      </aside>

      <div className={styles.main} style={mockMode ? { marginTop: 29 } : {}}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            {/* Tombol menu untuk mobile */}
            <button
              className={styles.menuBtn}
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka menu"
            >
              <Menu size={20} />
            </button>

            <nav className={styles.breadcrumb}>
              <span className={styles.breadcrumbRoot}>Mahasiswa</span>
              <ChevronRight size={12} className={styles.breadcrumbSep} />
              <span className={styles.breadcrumbCurrent}>{breadcrumb}</span>
            </nav>
          </div>

          <div className={styles.topbarRight}>
            {/* Notifikasi */}
            <div className={styles.notifWrapper} ref={notifRef}>
              <button
                className={styles.iconBtn}
                aria-label="Notifikasi"
                onClick={() => setNotifOpen(!notifOpen)}
              >
                <Bell size={17} />
                {notifUnread > 0 && <span className={styles.badge}>{notifUnread > 99 ? "99+" : notifUnread}</span>}
              </button>
              <NotificationDropdown
                isOpen={notifOpen}
                onClose={() => setNotifOpen(false)}
                onUnreadChange={setNotifUnread}
              />
            </div>

            <span className={styles.divider} />

            {/* User info */}
            <div className={styles.userBlock}>
              <button className={styles.avatarBtn} onClick={() => router.push("/mahasiswa/profile")} aria-label="Lihat profil">
                <img src={avatarSrc} alt="avatar" className={styles.avatar}
                  onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = "/img/avatar.jpg"; }} />
                <span className={styles.onlineDot} />
                <span className={styles.avatarOverlay}><Camera size={11} /></span>
              </button>
              <button className={styles.userInfoBtn} onClick={() => router.push("/mahasiswa/profile")}>
                <span className={styles.userName}>{user.nama}</span>
                <span className={styles.userRole}>{user.nim}</span>
              </button>
              <button className={styles.logoutBtn} title="Logout" onClick={handleLogout} disabled={loggingOut}>
                {loggingOut ? <span className={styles.logoutSpinner} /> : <LogOut size={14} />}
              </button>
            </div>
          </div>
        </header>

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Ekspor default dengan Provider
══════════════════════════════════════════════════════════════ */
export default function MahasiswaLayout({ children }) {
  return (
    <MahasiswaProvider>
      <MahasiswaLayoutInner>{children}</MahasiswaLayoutInner>
    </MahasiswaProvider>
  );
}