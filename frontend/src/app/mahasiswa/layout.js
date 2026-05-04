// frontend/src/app/mahasiswa/layout.js
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  LayoutDashboard, FileText, LogOut, Menu,
  ChevronLeft, ChevronRight, Bell,
  Camera, X, Check, Upload, WifiOff,
  BookOpen, ClipboardList, History, Circle,
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
} from "@/lib/api";

// ============================================================
// Avatar Editor Modal (sama persis dengan admin)
// ============================================================
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

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
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
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className={styles.fileInput} onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }} />
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

// ============================================================
// KOMPONEN NOTIFIKASI DROPDOWN (sama seperti admin)
// ============================================================
function NotificationDropdown({ isOpen, onClose, onMarkAsRead }) {
  const [notifications, setNotifications] = useState([
    { id: 1, title: "SKPI diajukan", message: "SKPI Anda sedang dalam proses review", time: "5 menit lalu", read: false },
    { id: 2, title: "Kegiatan diverifikasi", message: "Kegiatan Webinar telah diverifikasi", time: "1 jam lalu", read: false },
    { id: 3, title: "Template SKPI diperbarui", message: "Template SKPI terbaru tersedia", time: "3 jam lalu", read: true },
    { id: 4, title: "Poin bertambah", message: "Anda mendapatkan 10 poin baru", time: "Kemarin", read: true },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    if (onMarkAsRead) onMarkAsRead(id);
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  if (!isOpen) return null;

  return (
    <div className={styles.notifDropdown}>
      <div className={styles.notifHeader}>
        <span>Notifikasi</span>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className={styles.notifMarkAllBtn}>
            Tandai semua sudah dibaca
          </button>
        )}
      </div>
      <div className={styles.notifList}>
        {notifications.length === 0 ? (
          <div className={styles.notifEmpty}>Tidak ada notifikasi</div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              className={`${styles.notifItem} ${!notif.read ? styles.notifUnread : ""}`}
              onClick={() => handleMarkAsRead(notif.id)}
            >
              <div className={styles.notifIcon}>
                {!notif.read && <Circle size={8} fill="#3b82f6" color="#3b82f6" />}
              </div>
              <div className={styles.notifContent}>
                <div className={styles.notifTitle}>{notif.title}</div>
                <div className={styles.notifMsg}>{notif.message}</div>
                <div className={styles.notifTime}>{notif.time}</div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className={styles.notifFooter}>
        <Link href="/mahasiswa/notifications" onClick={onClose}>Lihat semua notifikasi</Link>
      </div>
    </div>
  );
}

// ============================================================
// Layout Inner (menggunakan useMahasiswa)
// ============================================================
function MahasiswaLayoutInner({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [mockMode, setMockMode] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState("/img/avatar-default.jpg");
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const router = useRouter();
  const pathname = usePathname();
  const { user, updateUser, prodiConfig } = useMahasiswa();

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
      } else {
        router.replace("/");
      }
    })();
    return () => { mounted = false; };
  }, [router]);

  // Sinkron foto dari user context
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

  // Menu mahasiswa
  const navItems = [
    { href: "/mahasiswa/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/mahasiswa/kegiatan",  label: "Kegiatan",  icon: BookOpen },
    { href: "/mahasiswa/pengajuan", label: "Pengajuan", icon: ClipboardList },
    { href: "/mahasiswa/riwayat",   label: "Riwayat",   icon: History },
  ];

  // Close sidebar saat navigasi (mobile)
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  useEffect(() => {
    closeSidebar();
  }, [pathname, closeSidebar]);

  // Escape key untuk close sidebar & notifikasi
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (sidebarOpen) setSidebarOpen(false);
        if (notifOpen) setNotifOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen, notifOpen]);

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

  const activeNav = navItems.find(n => pathname.startsWith(n.href));
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

      {showEditor && <AvatarEditorModal currentSrc={avatarSrc} onClose={() => setShowEditor(false)} onSave={handleAvatarSave} />}

      {/* Overlay untuk mobile */}
      {sidebarOpen && (
        <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)} aria-label="Close menu" />
      )}

      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""} ${sidebarOpen ? styles.open : ""}`} style={mockMode ? { marginTop: 29 } : {}}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <Image src="/img/logo_isb.png" alt="logo" width={80} height={35} priority style={{ height: "auto" }} />
          </div>
          {!collapsed && <div className={styles.brandText}><strong>SKPI</strong><span>Mahasiswa</span></div>}
          <button className={styles.collapseBtn} onClick={() => { setCollapsed(!collapsed); setSidebarOpen(false); }}>
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <nav className={styles.nav}>
          {!collapsed && <p className={styles.navSection}>MENU</p>}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`} title={collapsed ? item.label : undefined}>
                {isActive && <span className={styles.activeAccent} style={{ background: prodiConfig.primary }} />}
                <span className={styles.iconWrap}><Icon size={17} /></span>
                {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        {!collapsed && <div className={styles.sidebarFooter}><span>v1.0 · © Institut Shanti Bhuana</span></div>}
      </aside>

      <div className={styles.main} style={mockMode ? { marginTop: 29 } : {}}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button className={styles.menuBtn} onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={19} />
            </button>
            <nav className={styles.breadcrumb}>
              <span className={styles.breadcrumbRoot}>Mahasiswa</span>
              <ChevronRight size={12} className={styles.breadcrumbSep} />
              <span className={styles.breadcrumbCurrent}>{breadcrumb}</span>
            </nav>
          </div>

          <div className={styles.topbarRight}>
            {/* NOTIFICATION DROPDOWN */}
            <div className={styles.notifWrapper} ref={notifRef}>
              <button className={styles.iconBtn} aria-label="Notifikasi" onClick={() => setNotifOpen(!notifOpen)}>
                <Bell size={17} />
                <span className={styles.badge}>3</span>
              </button>
              <NotificationDropdown
                isOpen={notifOpen}
                onClose={() => setNotifOpen(false)}
              />
            </div>

            <span className={styles.divider} />
            <div className={styles.userBlock}>
              <button className={styles.avatarBtn} onClick={() => setShowEditor(true)}>
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

// ============================================================
// Ekspor default dengan Provider
// ============================================================
export default function MahasiswaLayout({ children }) {
  return (
    <MahasiswaProvider>
      <MahasiswaLayoutInner>{children}</MahasiswaLayoutInner>
    </MahasiswaProvider>
  );
}