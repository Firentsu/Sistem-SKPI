"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  LayoutDashboard, Users, FileText, Settings, LogOut, Menu,
  ChevronLeft, ChevronRight, Bell, Shield, BookOpen, Award,
  Camera, X, Check, Upload, WifiOff, Trash2,
} from "lucide-react";
import styles from "./admin.module.css";
import { useRouter, usePathname } from "next/navigation";
import { getMe, logout as apiLogout, uploadAvatar, isMockMode, getAvatarUrl } from "@/lib/api";

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

function AvatarEditorModal({ currentSrc, onClose, onSave }) {
  // ... (kode sama seperti sebelumnya, tidak diubah)
}

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [mockMode, setMockMode] = useState(false);

  const [avatarSrc, setAvatarSrc] = useState("/img/avatar.jpg");
  const [adminName, setAdminName] = useState("Admin");
  const [adminRole, setAdminRole] = useState("Administrator");

  // State notifikasi
  const [notifications, setNotifications] = useState([
    { id: 1, type: "skpi", text: "Mahasiswa Andi Pratama (TI-2021) mengajukan SKPI", time: "5 menit lalu", read: false },
    { id: 2, type: "verifikasi", text: "Kegiatan 'Seminar AI 2024' menunggu verifikasi", time: "12 menit lalu", read: false },
    { id: 3, type: "published", text: "SKPI Mahasiswa Sari Dewi telah diterbitkan", time: "28 menit lalu", read: false },
    { id: 4, type: "revisi", text: "Bukti kegiatan Budi Santoso diminta revisi", time: "1 jam lalu", read: false },
    { id: 5, type: "published", text: "SKPI batch Manajemen 2020 berhasil digenerate", time: "2 jam lalu", read: false },
  ]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await getMe();
      if (!mounted) return;
      if (data) {
        setAdminName(data.admin?.nama_admin ?? data.user?.username ?? "Admin");
        if (data.admin?.avatar) setAvatarSrc(getAvatarUrl(data.admin.avatar));
        setMockMode(isMockMode());
        setChecking(false);
      } else {
        if (pathname !== "/") router.replace("/");
      }
    })();
    return () => { mounted = false; };
  }, [router, pathname]);

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

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen]);

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/admin", label: "Admin", icon: Shield },
    { href: "/admin/mahasiswa", label: "Mahasiswa", icon: Users },
    { href: "/admin/master-data", label: "Master Data", icon: Settings },
    { href: "/admin/aktivitas", label: "Aktivitas", icon: BookOpen },
    { href: "/admin/template-skpi", label: "Template SKPI", icon: FileText },
    { href: "/admin/generate-skpi", label: "Generate SKPI", icon: Award },
  ];

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

  const activeNav = navItems.find(n => pathname.startsWith(n.href));
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

      {sidebarOpen && (
        <div 
          className={styles.sidebarOverlay}
          onClick={() => setSidebarOpen(false)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
          aria-label="Close menu"
        />
      )}

      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""} ${sidebarOpen ? styles.open : ""}`}
        style={mockMode ? { marginTop: 29 } : {}}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <Image src="/img/logo_isb.png" alt="logo" width={80} height={35} loading="eager" />
          </div>
          {!collapsed && <div className={styles.brandText}><strong>SKPI</strong><span>Admin Panel</span></div>}
          <button aria-label="Toggle sidebar" className={styles.collapseBtn} onClick={() => {
            setCollapsed(!collapsed);
            setSidebarOpen(false);
          }}>
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <nav className={styles.nav}>
          {!collapsed && <p className={styles.navSection}>MENU</p>}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                title={collapsed ? item.label : undefined}>
                {isActive && <span className={styles.activeAccent} />}
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
            <button className={styles.menuBtn} onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
              <Menu size={19} />
            </button>
            <nav className={styles.breadcrumb}>
              <span className={styles.breadcrumbRoot}>Admin</span>
              <ChevronRight size={12} className={styles.breadcrumbSep} />
              <span className={styles.breadcrumbCurrent}>{breadcrumb}</span>
            </nav>
          </div>

          <div className={styles.topbarRight}>
            <div className={styles.notifWrapper}>
              <button 
                className={styles.iconBtn} 
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                aria-label="Notifications"
              >
                <Bell size={17} />
                {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
              </button>
              {notifDropdownOpen && (
                <div className={styles.notifDropdown}>
                  <div className={styles.notifHeader}>
                    <span>Notifikasi</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className={styles.notifMarkAll}>
                        <Check size={12} /> Tandai semua
                      </button>
                    )}
                  </div>
                  <div className={styles.notifList}>
                    {notifications.length === 0 ? (
                      <div className={styles.notifEmpty}>Tidak ada notifikasi</div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          className={`${styles.notifItem} ${!n.read ? styles.notifUnread : ''}`}
                          onClick={() => markAsRead(n.id)}
                        >
                          <div className={styles.notifIcon} style={{ background: NOTIF_BG[n.type], color: NOTIF_COLORS[n.type] }}>
                            <Bell size={12} />
                          </div>
                          <div className={styles.notifContent}>
                            <p>{n.text}</p>
                            <span>{n.time}</span>
                          </div>
                          <button 
                            className={styles.notifDelete} 
                            onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  <div className={styles.notifFooter}>
                    <button className={styles.notifSeeAll}>Lihat semua notifikasi</button>
                  </div>
                </div>
              )}
            </div>
            <span className={styles.divider} />
            <div className={styles.userBlock}>
              <button className={styles.avatarBtn} onClick={() => router.push("/admin/profile")} aria-label="Lihat profil">
                <img src={avatarSrc} alt="avatar" className={styles.avatar} />
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