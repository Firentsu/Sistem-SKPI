"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  LayoutDashboard, UserCircle, FileText, History, Send, LogOut,
  Menu, ChevronLeft, ChevronRight, Bell, Award,
  Camera, X, Check, Upload,
} from "lucide-react";
import styles from "./mahasiswa.module.css";
import { useRouter, usePathname } from "next/navigation";
import { MahasiswaProvider, useMahasiswa } from "@/context/MahasiswaContext";

// ── Menu mahasiswa ────────────────────────────────────────────
const MENU_ITEMS = [
  { href: "/mahasiswa/dashboard", label: "Dashboard",        icon: LayoutDashboard },
  { href: "/mahasiswa/profile",   label: "Profil Saya",      icon: UserCircle },
  { href: "/mahasiswa/kegiatan",  label: "Kegiatan Saya",    icon: FileText },
  { href: "/mahasiswa/riwayat",   label: "Riwayat Kegiatan", icon: History },
  { href: "/mahasiswa/pengajuan", label: "Pengajuan SKPI",   icon: Send },
];

// ── Avatar Editor Modal ───────────────────────────────────────
function AvatarEditorModal({ currentSrc, onClose, onSave }) {
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError]     = useState("");
  const [saving, setSaving]   = useState(false);
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
    // TODO: ganti dengan panggilan API upload avatar mahasiswa
    setTimeout(() => { onSave(preview); setSaving(false); }, 1000);
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

// ── Layout Content (pakai MahasiswaContext) ───────────────────
function LayoutContent({ children }) {
  const { user, prodiConfig } = useMahasiswa();

  const [collapsed,  setCollapsed]  = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [checking,   setChecking]   = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [avatarSrc,  setAvatarSrc]  = useState("/img/avatar-default.jpg");

  const router   = useRouter();
  const pathname = usePathname();

  // Simulasi cek autentikasi — ganti dengan API call bila sudah ada
  useEffect(() => {
    const timer = setTimeout(() => setChecking(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Terapkan CSS variable warna prodi ke document
  useEffect(() => {
    document.documentElement.style.setProperty("--prodi-primary", prodiConfig.primary);
    document.documentElement.style.setProperty("--prodi-light",   prodiConfig.light);
  }, [prodiConfig]);

  // Dengarkan event update avatar (sama seperti admin)
  useEffect(() => {
    function onAvatarUpdated(e) { if (e.detail?.avatar) setAvatarSrc(e.detail.avatar); }
    window.addEventListener("avatar:updated", onAvatarUpdated);
    return () => window.removeEventListener("avatar:updated", onAvatarUpdated);
  }, []);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    // TODO: panggil API logout mahasiswa
    router.replace("/");
  }

  const handleAvatarSave = useCallback((newUrl) => {
    setAvatarSrc(newUrl);
    setShowEditor(false);
    // TODO: update context user.foto
  }, []);

  const activeNav  = MENU_ITEMS.find(n => pathname.startsWith(n.href));
  const isProfile  = pathname.startsWith("/mahasiswa/profile");
  const breadcrumb = isProfile ? "Profil Saya" : (activeNav ? activeNav.label : "Dashboard");

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
            <Award size={26} className={styles.logoIcon} />
          </div>
          {!collapsed && (
            <div className={styles.brandText}>
              <strong>SKPI</strong>
              <span>Mahasiswa</span>
            </div>
          )}
          <button aria-label="Toggle sidebar" className={styles.collapseBtn} onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <nav className={styles.nav}>
          {!collapsed && <p className={styles.navSection}>MENU</p>}
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                title={collapsed ? item.label : undefined}
              >
                {isActive && <span className={styles.activeAccent} style={{ background: prodiConfig.primary }} />}
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
            <nav className={styles.breadcrumb}>
              <span className={styles.breadcrumbRoot}>Mahasiswa</span>
              <ChevronRight size={12} className={styles.breadcrumbSep} />
              <span className={styles.breadcrumbCurrent}>{breadcrumb}</span>
            </nav>
          </div>

          <div className={styles.topbarRight}>
            <button className={styles.iconBtn} aria-label="Notifications">
              <Bell size={17} />
              <span className={styles.badge}>2</span>
            </button>
            <span className={styles.divider} />
            <div className={styles.userBlock}>
              <button
                className={styles.avatarBtn}
                onClick={() => router.push("/mahasiswa/profile")}
                aria-label="Lihat profil"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarSrc} alt="avatar" className={styles.avatar} />
                <span className={styles.onlineDot} />
                <span className={styles.avatarOverlay}><Camera size={11} /></span>
              </button>
              <button
                className={styles.userInfoBtn}
                onClick={() => router.push("/mahasiswa/profile")}
              >
                <span className={styles.userName}>{user.nama}</span>
                <span className={styles.userRole} style={{ color: prodiConfig.primary }}>{user.prodi}</span>
              </button>
              <button
                className={styles.logoutBtn}
                title="Logout"
                onClick={handleLogout}
                disabled={loggingOut}
              >
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

// ── Export default dengan Provider ────────────────────────────
export default function MahasiswaLayout({ children }) {
  return (
    <MahasiswaProvider>
      <LayoutContent>{children}</LayoutContent>
    </MahasiswaProvider>
  );
}