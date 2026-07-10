/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  LayoutDashboard, Users, FileText, Settings, LogOut,
  ChevronRight, ChevronDown, Bell, Shield, BookOpen, Award,
  Camera, X, Check, Upload, WifiOff,
  CheckCircle2, AlertTriangle, ClipboardCheck, Send, Clock,
  Menu, User, RefreshCcw,
} from "lucide-react";
import styles from "./admin.module.css";
import { useRouter, usePathname } from "next/navigation";
import {
  getMe, logout as apiLogout, uploadAvatar, isMockMode, getAvatarUrl,
  getAdminNotifikasi, markNotifikasiRead, markAllNotifikasiRead, inferNotifType,
  createAdminSSE,
} from "@/lib/api";
import AvatarCropModal from "@/components/AvatarCropModal";

// ======================== KOMPONEN EDITOR AVATAR ========================
function AvatarEditorModal({ currentSrc, onClose, onSave }) {
  const [cropFile,    setCropFile]    = useState(null);
  const [croppedBlob, setCroppedBlob] = useState(null);
  const [preview,     setPreview]     = useState(null);
  const [dragging,    setDragging]    = useState(false);
  const [error,       setError]       = useState("");
  const [saving,      setSaving]      = useState(false);
  const inputRef = useRef(null);
  const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  function processFile(file) {
    setError("");
    if (!ACCEPTED.includes(file.type)) { setError("Format tidak didukung. Gunakan JPG, PNG, WebP, atau GIF."); return; }
    if (file.size > 2 * 1024 * 1024) { setError("Ukuran file maksimal 2 MB."); return; }
    setCropFile(file);
  }

  function handleCropSave(blob) {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(blob));
    setCroppedBlob(blob);
    setCropFile(null);
  }

  function handleClearCrop() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setCroppedBlob(null);
    setCropFile(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleSave() {
    if (!croppedBlob) return;
    setSaving(true);
    try {
      const form = new FormData();
      form.append("avatar", croppedBlob, "avatar.jpg");
      const result = await uploadAvatar(form);
      if (!result.ok) { setError(result.data?.error ?? "Gagal menyimpan foto."); return; }
      onSave(getAvatarUrl(result.data.avatar));
    } catch { setError("Gagal menyimpan foto. Coba lagi."); }
    finally { setSaving(false); }
  }

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape" && !cropFile) onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, cropFile]);

  return (
    <>
      {cropFile && (
        <AvatarCropModal
          file={cropFile}
          onClose={() => { setCropFile(null); if (inputRef.current) inputRef.current.value = ""; }}
          onSave={handleCropSave}
        />
      )}
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <div className={styles.modalHeaderLeft}>
              <div className={styles.modalHeaderIcon}><Camera size={15} /></div>
              <span className={styles.modalTitle}>Edit Foto Profil</span>
            </div>
            <button className={styles.modalClose} onClick={onClose} aria-label="Tutup"><X size={15} /></button>
          </div>
          <div className={styles.modalPreviewRow}>
            <div className={styles.modalPreviewWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview || currentSrc} alt="Preview" className={styles.modalPreviewImg} />
              {preview && <button className={styles.modalPreviewClear} onClick={handleClearCrop}><X size={10} /></button>}
              {preview && <div className={styles.modalPreviewBadge}><Check size={10} /> Baru</div>}
            </div>
            <div className={styles.modalPreviewInfo}>
              <p className={styles.modalPreviewLabel}>{preview ? "Foto sudah dipangkas" : "Foto saat ini"}</p>
              <p className={styles.modalPreviewHint}>JPG, PNG, WebP, GIF · maks. 2 MB</p>
              {preview && (
                <button
                  onClick={() => inputRef.current?.click()}
                  style={{ marginTop: 6, background: "none", border: "none", cursor: "pointer", color: "#765439", fontSize: 12, fontWeight: 600, padding: 0, textDecoration: "underline" }}
                >
                  Ganti foto
                </button>
              )}
            </div>
          </div>
          {!preview && (
            <div
              className={`${styles.dropZone} ${dragging ? styles.dropZoneActive : ""}`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) processFile(f); }}
              onClick={() => inputRef.current?.click()}
              role="button" tabIndex={0} onKeyDown={e => e.key === "Enter" && inputRef.current?.click()}
            >
              <div className={styles.dropIconWrap}><Upload size={20} className={styles.dropIcon} /></div>
              <span className={styles.dropText}>{dragging ? "Lepaskan di sini…" : "Klik atau seret foto ke sini"}</span>
              <span className={styles.dropSubText}>PNG, JPG, WebP hingga 2MB · Hasil akan dipangkas otomatis</span>
            </div>
          )}
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
            className={styles.fileInput}
            onChange={e => { const f = e.target.files?.[0]; if (f) { processFile(f); e.target.value = ""; } }} />
          {error && <div className={styles.modalErrorBox}><X size={13} /><p className={styles.modalError}>{error}</p></div>}
          <div className={styles.modalActions}>
            <button className={styles.modalBtnCancel} onClick={onClose}>Batal</button>
            <button className={styles.modalBtnSave} onClick={handleSave} disabled={!croppedBlob || saving}>
              {saving ? <><span className={styles.savingSpinner} /> Menyimpan…</> : <><Check size={14} /> Simpan Foto</>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ======================== KOMPONEN NOTIFIKASI DROPDOWN ========================
function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "Baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 172800) return "Kemarin";
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

const ADMIN_NOTIF_ICONS = {
  skpi:       { Icon: Send,           cls: "notifTypeSkpi"       },
  published:  { Icon: CheckCircle2,   cls: "notifTypePublished"  },
  revisi:     { Icon: AlertTriangle,  cls: "notifTypeRevision"   },
  verifikasi: { Icon: ClipboardCheck, cls: "notifTypeVerifikasi" },
};

function NotificationDropdown({ isOpen, onClose, onUnreadChange }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // 🔥 AMBIL DATA SAAT DROPDOWN DIBUKA
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    getAdminNotifikasi(20).then(data => {
      setNotifications(data.rows ?? []);
      setUnreadCount(data.unread ?? 0);
      setLoading(false);
    });
  }, [isOpen]);

  // 🔥 SINKRONKAN UNREAD COUNT KE PARENT (AdminLayout)
  // Dipisah ke useEffect agar tidak dipanggil saat render
  useEffect(() => {
    if (onUnreadChange) {
      onUnreadChange(unreadCount);
    }
  }, [unreadCount, onUnreadChange]);

  // 🔥 TERIMA NOTIFIKASI REAL-TIME
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

  // ✅ HANDLE MARK AS READ (sudah diperbaiki)
  const handleMarkAsRead = async (id) => {
    if (notifications.find(n => n.id_notifikasi === id)?.status_baca) return;
    await markNotifikasiRead(id);
    setNotifications(prev => prev.map(n => n.id_notifikasi === id ? { ...n, status_baca: true } : n));
    // ✅ Hanya update state local, callback dipisah di useEffect
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // ✅ HANDLE MARK ALL READ (sudah diperbaiki)
  const handleMarkAllRead = async () => {
    await markAllNotifikasiRead();
    setNotifications(prev => prev.map(n => ({ ...n, status_baca: true })));
    // ✅ Hanya update state local, callback dipisah di useEffect
    setUnreadCount(0);
  };

  // ✅ TUTUP DROPDOWN SAAT KLIK LINK
  const handleLinkClick = () => {
    if (onClose) onClose();
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
            const type = inferNotifType(notif.judul);
            const { Icon, cls } = ADMIN_NOTIF_ICONS[type] ?? ADMIN_NOTIF_ICONS.verifikasi;
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
        <Link href="/admin/notifications" onClick={handleLinkClick}>
          Lihat semua notifikasi
        </Link>
      </div>
    </div>
  );
}

// ======================== MAIN LAYOUT ========================
export default function AdminLayout({ children }) {
  const [loggingOut, setLoggingOut] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [mockMode, setMockMode] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifUnread, setNotifUnread] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [akunManajemenOpen, setAkunManajemenOpen] = useState(false);
  const notifRef = useRef(null);

  const [avatarSrc, setAvatarSrc] = useState("/img/avatar.jpg");
  const [adminName, setAdminName] = useState("Admin");
  const adminRole = "Administrator";

  const router = useRouter();
  const pathname = usePathname();

  // Fetch data user
  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await getMe();
      if (!mounted) return;
      if (data) {
        setAdminName(data.admin?.nama_admin ?? data.user?.username ?? "Admin");
        setAvatarSrc(data.admin?.avatar ? getAvatarUrl(data.admin.avatar) : "/img/avatar.jpg");
        setMockMode(isMockMode());
        setChecking(false);
        getAdminNotifikasi(20).then(d => setNotifUnread(d.unread ?? 0));
      } else {
        if (pathname !== "/") router.replace("/");
      }
    })();
    return () => { mounted = false; };
  }, [router, pathname]);

  // Global event listeners untuk avatar/profile update
  useEffect(() => {
    function onAvatarUpdated(e) { if (e.detail?.avatar) setAvatarSrc(e.detail.avatar); }
    function onProfileUpdated(e) {
      if (e.detail?.username) setAdminName(e.detail.username);
      if (e.detail?.nama_admin) setAdminName(e.detail.nama_admin);
    }
    window.addEventListener("avatar:updated", onAvatarUpdated);
    window.addEventListener("profile:updated", onProfileUpdated);
    return () => {
      window.removeEventListener("avatar:updated", onAvatarUpdated);
      window.removeEventListener("profile:updated", onProfileUpdated);
    };
  }, []);

  // Koneksi SSE untuk notifikasi real-time
  useEffect(() => {
    const es = createAdminSSE();
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

  // Escape key untuk close notifikasi & sidebar
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

  // Tutup sidebar saat route berubah (misal klik link)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Auto-buka dropdown Manajemen Akun saat berada di halaman terkait
  const isOnManajemenAkun = pathname.startsWith("/admin/admin") || pathname.startsWith("/admin/mahasiswa");
  useEffect(() => {
    if (isOnManajemenAkun) setAkunManajemenOpen(true);
  }, [isOnManajemenAkun]);

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      type: "group", id: "manajemen-akun", label: "Manajemen Akun", icon: Users,
      items: [
        { href: "/admin/admin", label: "Admin", icon: Shield },
        { href: "/admin/mahasiswa", label: "Mahasiswa", icon: User },
      ],
    },
    { href: "/admin/master-data", label: "Master Data", icon: Settings },
    { href: "/admin/aktivitas", label: "Aktivitas", icon: BookOpen },
    { href: "/admin/template-skpi", label: "Template SKPI", icon: FileText },
    { href: "/admin/generate-skpi", label: "Generate SKPI", icon: Award },
    { href: "/admin/dokumentasi", label: "Dokumentasi", icon: FileText },
    { href: "/admin/profile", label: "Profile", icon: User },
  ];

  // Semua item rata (untuk breadcrumb)
  const allNavFlat = navItems.flatMap(item =>
    item.type === "group" ? item.items : [item]
  );

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    await apiLogout();
    router.replace("/");
    setTimeout(() => { try { window.location.replace("/"); } catch { } }, 200);
  }

  const handleAvatarSave = useCallback((newUrl) => {
    setAvatarSrc(newUrl);
    setShowEditor(false);
  }, []);

  const activeNav = allNavFlat.find(n => pathname.startsWith(n.href));
  const isProfile = pathname.startsWith("/admin/profile");
  const breadcrumb = isProfile ? "Profile" : (activeNav ? activeNav.label : "Dashboard");

  if (checking) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.loadingLogo}><div className={styles.spinner} /></div>
        <span suppressHydrationWarning>Memeriksa autentikasi…</span>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
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

      {/* Overlay untuk mobile (sidebar terbuka) */}
      {sidebarOpen && (
        <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar dengan class open untuk mobile */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ""}`} style={mockMode ? { marginTop: 29 } : {}}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <Image src="/img/Logo_isb.png" alt="logo" width={80} height={35} priority />
          </div>
          <div className={styles.brandText}><strong>SKPI</strong><span>Admin Panel</span></div>
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
                    onClick={() => setAkunManajemenOpen(o => !o)}
                  >
                    {isGroupActive && <span className={styles.activeAccent} />}
                    <span className={styles.iconWrap}><GroupIcon size={17} /></span>
                    <span className={styles.navLabel}>{item.label}</span>
                    <ChevronDown
                      size={13}
                      className={styles.groupChevron}
                      style={{ transform: akunManajemenOpen ? "rotate(180deg)" : "none" }}
                    />
                  </button>
                  {akunManajemenOpen && (
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
                            {isSubActive && <span className={styles.activeAccent} />}
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
              <Link key={item.href} href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                {isActive && <span className={styles.activeAccent} />}
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
              <span className={styles.breadcrumbRoot}>Admin</span>
              <ChevronRight size={12} className={styles.breadcrumbSep} />
              <span className={styles.breadcrumbCurrent}>{breadcrumb}</span>
            </nav>
          </div>

          <div className={styles.topbarRight}>
            {/* NOTIFICATION BUTTON WITH DROPDOWN */}
            <div className={styles.notifWrapper} ref={notifRef}>
              <button
                className={styles.iconBtn}
                aria-label="Notifications"
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
            <div className={styles.userBlock}>
              <button className={styles.avatarBtn} onClick={() => router.push("/admin/profile")} aria-label="Lihat profil">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarSrc} alt="avatar" className={styles.avatar}
                  onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = "/img/avatar.jpg"; }} />
                <span className={styles.onlineDot} />
                <span className={styles.avatarOverlay}><Camera size={11} /></span>
              </button>
              <button className={styles.userInfoBtn} onClick={() => router.push("/admin/profile")}>
                <span className={styles.userName}>{adminName}</span>
                <span className={styles.userRole}>{adminRole}</span>
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