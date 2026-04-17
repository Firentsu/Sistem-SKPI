"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  LayoutDashboard, Users, FileText, Settings, LogOut, Menu,
  ChevronLeft, ChevronRight, Bell, Shield, BookOpen, Award,
  Camera, X, Check, Upload, WifiOff,
} from "lucide-react";
import styles from "./admin.module.css";
import { useRouter, usePathname } from "next/navigation";
import { getMe, logout as apiLogout, uploadAvatar, isMockMode, getAvatarUrl } from "@/lib/api";

function AvatarEditorModal({ currentSrc, onClose, onSave }) {
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);
  const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  function processFile(file) {
    setError("");
    if (!ACCEPTED.includes(file.type)) { setError("Format tidak didukung. Gunakan JPG, PNG, WebP, atau GIF."); return; }
    if (file.size > 2 * 1024 * 1024) { setError("Ukuran file maksimal 2 MB."); return; }
    setPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!preview) return;
    setSaving(true);
    try {
      const blob = await fetch(preview).then(r => r.blob());
      const form = new FormData();
      form.append("avatar", blob, "avatar.jpg");
      const result = await uploadAvatar(form);
      if (!result.ok) { setError(result.data?.error ?? "Gagal menyimpan foto."); return; }
      onSave(getAvatarUrl(result.data.avatar));
    } catch { setError("Gagal menyimpan foto. Coba lagi."); }
    finally { setSaving(false); }
  }

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
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
          <button className={styles.modalClose} onClick={onClose} aria-label="Tutup"><X size={15} /></button>
        </div>
        <div className={styles.modalPreviewRow}>
          <div className={styles.modalPreviewWrap}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview || currentSrc} alt="Preview" className={styles.modalPreviewImg} />
            {preview && <button className={styles.modalPreviewClear} onClick={() => { setPreview(null); setError(""); }}><X size={10} /></button>}
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
          onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) processFile(f); }}
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

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar state
  const [loggingOut, setLoggingOut] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [mockMode, setMockMode] = useState(false);

  const [avatarSrc, setAvatarSrc] = useState("/img/avatar.jpg");
  const [adminName, setAdminName] = useState("Admin");
  const [adminRole, setAdminRole] = useState("Administrator");

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

  // ── Close sidebar saat navigate (mobile) ──
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // ── Keyboard escape untuk close sidebar ────
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

      {/* Mobile Overlay untuk close sidebar */}
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
            // Di mobile, juga close overlay
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
            <button className={styles.iconBtn} aria-label="Notifications">
              <Bell size={17} /><span className={styles.badge}>3</span>
            </button>
            <span className={styles.divider} />
            <div className={styles.userBlock}>
              <button className={styles.avatarBtn} onClick={() => router.push("/admin/profile")} aria-label="Lihat profil">
                {/* eslint-disable-next-line @next/next/no-img-element */}
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