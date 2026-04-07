"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  LayoutDashboard, Users, FileText, Settings, LogOut, Menu,
  ChevronLeft, ChevronRight, Bell, Shield, BookOpen, Award,
  Camera, X, Check, Upload,
} from "lucide-react";
import styles from "./admin.module.css";
import { useRouter, usePathname } from "next/navigation";

/* ─────────────────────────────────────────
   Avatar Editor Modal (tetap ada untuk
   keperluan lain / akses cepat dari topbar)
───────────────────────────────────────── */
function AvatarEditorModal({ currentSrc, onClose, onSave }) {
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError]     = useState("");
  const [saving, setSaving]   = useState(false);
  const inputRef = useRef(null);

  const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const MAX_MB   = 2;

  function processFile(file) {
    setError("");
    if (!ACCEPTED.includes(file.type)) {
      setError("Format tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Ukuran file maksimal ${MAX_MB} MB.`);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  async function handleSave() {
    if (!preview) return;
    setSaving(true);
    try {
      const blob = await fetch(preview).then(r => r.blob());

      // Upload ke API
      const form = new FormData();
      form.append("avatar", blob, "avatar.jpg");
      const res  = await fetch("/api/auth/avatar", { method: "POST", body: form, credentials: "same-origin" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan foto.");
        return;
      }

      onSave(data.avatar);
    } catch {
      setError("Gagal menyimpan foto. Coba lagi.");
    } finally {
      setSaving(false);
    }
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
            {preview && (
              <button className={styles.modalPreviewClear}
                onClick={() => { setPreview(null); setError(""); }} aria-label="Hapus pilihan">
                <X size={10} />
              </button>
            )}
            {preview && <div className={styles.modalPreviewBadge}><Check size={10} /> Baru</div>}
          </div>
          <div className={styles.modalPreviewInfo}>
            <p className={styles.modalPreviewLabel}>{preview ? "Foto baru dipilih" : "Foto saat ini"}</p>
            <p className={styles.modalPreviewHint}>JPG, PNG, WebP, GIF · maks. 2 MB</p>
            {!preview && <p className={styles.modalPreviewTip}>Seret foto atau klik area di bawah untuk memilih</p>}
          </div>
        </div>

        <div
          className={`${styles.dropZone} ${dragging ? styles.dropZoneActive : ""}`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) processFile(f); }}
          onClick={() => inputRef.current?.click()}
          role="button" tabIndex={0}
          onKeyDown={e => e.key === "Enter" && inputRef.current?.click()}
          aria-label="Upload foto"
        >
          <div className={styles.dropIconWrap}><Upload size={20} className={styles.dropIcon} /></div>
          <span className={styles.dropText}>{dragging ? "Lepaskan di sini…" : "Klik atau seret foto ke sini"}</span>
          <span className={styles.dropSubText}>PNG, JPG, WebP hingga 2MB</span>
          <input ref={inputRef} type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className={styles.fileInput} onChange={handleFileChange} />
        </div>

        {error && (
          <div className={styles.modalErrorBox}>
            <X size={13} />
            <p className={styles.modalError}>{error}</p>
          </div>
        )}

        <div className={styles.modalActions}>
          <button className={styles.modalBtnCancel} onClick={onClose}>Batal</button>
          <button className={styles.modalBtnSave} onClick={handleSave} disabled={!preview || saving}>
            {saving
              ? <><span className={styles.savingSpinner} /> Menyimpan…</>
              : <><Check size={14} /> Simpan Foto</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main Layout
───────────────────────────────────────── */
export default function AdminLayout({ children }) {
  const [collapsed,  setCollapsed]  = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [checking,   setChecking]   = useState(true);
  const [showEditor, setShowEditor] = useState(false);

  /* ── Data dari /api/auth/me ── */
  const [avatarSrc,   setAvatarSrc]   = useState("/img/avatar.jpg");
  const [adminName,   setAdminName]   = useState("Admin");
  const [adminRole,   setAdminRole]   = useState("Administrator");

  const router   = useRouter();
  const pathname = usePathname();

  /* ── Auth check + load profil ── */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json();
          // set nama dari admin record, fallback ke username
          setAdminName(data.admin?.nama_admin ?? data.user?.username ?? "Admin");
          // set avatar jika ada
          if (data.admin?.avatar) setAvatarSrc(data.admin.avatar);
          setChecking(false);
          return;
        }
        if (pathname !== "/") router.replace("/");
      } catch {
        if (!mounted) return;
        if (pathname !== "/") router.replace("/");
      }
    })();
    return () => { mounted = false; };
  }, [router, pathname]);

  /* ── Dengarkan event dari halaman profil ── */
  useEffect(() => {
    // Saat profile page berhasil update avatar, emit custom event
    function onAvatarUpdated(e) {
      if (e.detail?.avatar) setAvatarSrc(e.detail.avatar);
    }
    // Saat profile page berhasil update username/nama
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

  const navItems = [
    { href: "/admin/dashboard",     label: "Dashboard",     icon: LayoutDashboard },
    { href: "/admin/mahasiswa",     label: "Mahasiswa",     icon: Users },
    { href: "/admin/admin",         label: "Admin",         icon: Shield },
    { href: "/admin/master-data",   label: "Master Data",   icon: Settings },
    { href: "/admin/aktivitas",     label: "Aktivitas",     icon: BookOpen },
    { href: "/admin/template-skpi", label: "Template SKPI", icon: FileText },
    { href: "/admin/generate-skpi", label: "Generate SKPI", icon: Award },
  ];

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
      router.replace("/");
      setTimeout(() => { try { window.location.replace("/"); } catch {} }, 200);
    } catch {
      router.replace("/");
      try { window.location.replace("/"); } catch {}
    } finally {
      setLoggingOut(false);
    }
  }

  const handleAvatarSave = useCallback((newAvatarUrl) => {
    setAvatarSrc(newAvatarUrl);
    setShowEditor(false);
  }, []);

  const activeNav  = navItems.find((n) => pathname.startsWith(n.href));
  const isProfile  = pathname.startsWith("/admin/profile");
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

      {/* Avatar Editor Modal (akses cepat dari topbar) */}
      {showEditor && (
        <AvatarEditorModal
          currentSrc={avatarSrc}
          onClose={() => setShowEditor(false)}
          onSave={handleAvatarSave}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <Image src="/img/logo_isb.png" alt="logo" width={80} height={35} loading="eager" />
          </div>
          {!collapsed && (
            <div className={styles.brandText}>
              <strong>SKPI</strong>
              <span>Admin Panel</span>
            </div>
          )}
          <button aria-label="Toggle sidebar" className={styles.collapseBtn}
            onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <nav className={styles.nav}>
          {!collapsed && <p className={styles.navSection}>MENU</p>}
          {navItems.map((item) => {
            const Icon     = item.icon;
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

        {!collapsed && (
          <div className={styles.sidebarFooter}>
            <span>v1.0 · © Institut Shanti Bhuana</span>
          </div>
        )}
      </aside>

      {/* ── Main ── */}
      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button className={styles.menuBtn} onClick={() => setCollapsed(!collapsed)} aria-label="Toggle menu">
              <Menu size={19} />
            </button>
            <nav className={styles.breadcrumb} aria-label="breadcrumb">
              <span className={styles.breadcrumbRoot}>Admin</span>
              <ChevronRight size={12} className={styles.breadcrumbSep} />
              <span className={styles.breadcrumbCurrent}>{breadcrumb}</span>
            </nav>
          </div>

          <div className={styles.topbarRight}>
            <button className={styles.iconBtn} aria-label="Notifications">
              <Bell size={17} />
              <span className={styles.badge}>3</span>
            </button>

            <span className={styles.divider} />

            <div className={styles.userBlock}>
              {/* Avatar → klik buka halaman profil */}
              <button
                className={styles.avatarBtn}
                onClick={() => router.push("/admin/profile")}
                aria-label="Lihat profil"
                title="Lihat profil saya"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarSrc} alt="avatar" className={styles.avatar} />
                <span className={styles.onlineDot} />
                <span className={styles.avatarOverlay}><Camera size={11} /></span>
              </button>

              {/* Nama → klik buka halaman profil */}
              <button
                className={styles.userInfoBtn}
                onClick={() => router.push("/admin/profile")}
                title="Lihat profil saya"
              >
                <span className={styles.userName}>{adminName}</span>
                <span className={styles.userRole}>{adminRole}</span>
              </button>

              <button className={styles.logoutBtn} title="Logout"
                onClick={handleLogout} disabled={loggingOut}>
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