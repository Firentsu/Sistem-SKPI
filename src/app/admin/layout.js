"use client";

export const metadata = {
  title: "Dashboard Admin SKPI",
  description: "Halaman khusus admin SKPI",
};

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import {
  Grid,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Bell
} from "lucide-react";
import styles from "./admin.module.css";
import { useRouter, usePathname } from "next/navigation";

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'same-origin',
          cache: 'no-store'
        });

        if (!mounted) return;

        if (res.ok) {
          setChecking(false);
          return;
        }

        if (pathname !== '/') {
          router.replace('/');
        }
      } catch (err) {
        if (!mounted) return;
        if (pathname !== '/') {
          router.replace('/');
        }
      }
    })();

    return () => { mounted = false; };
  }, [router, pathname]);

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: Grid },
    { href: "/admin/mahasiswa", label: "Mahasiswa", icon: Users },
    { href: "/admin/admin", label: "Admin", icon: Users },
    { href: "/admin/master-data", label: "Master Data", icon: Settings },
    { href: "/admin/aktivitas", label: "Aktivitas", icon: FileText },
    { href: "/admin/template-skpi", label: "Template SKPI", icon: FileText },
  ];

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin'
      });

      router.replace('/');

      setTimeout(() => {
        try { window.location.replace('/'); } catch (e) {}
      }, 200);
    } catch (err) {
      console.error('Logout error', err);
      router.replace('/');
      try { window.location.replace('/'); } catch (e) {}
    } finally {
      setLoggingOut(false);
    }
  }

  if (checking) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.loading}>Memeriksa autentikasi…</div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <Image src="/img/logo_isb.png" alt="logo" width={36} height={36} loading="eager" />
          </div>
          {!collapsed && <div className={styles.brandText}>
            <strong>SKPI</strong>
            <span>Admin Panel</span>
          </div>}
          <button
            aria-label="Toggle sidebar"
            className={styles.collapseBtn}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={styles.navItem}>
                <div className={styles.iconWrap}><Icon size={18} /></div>
                {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          {!collapsed && <small className={styles.footerText}>Versi 1.0 • © ISB</small>}
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button className={styles.menuBtn} onClick={() => setCollapsed(!collapsed)}>
              <Menu size={18} />
            </button>
            <div className={styles.breadcrumb}>Admin / Dashboard</div>
          </div>

          <div className={styles.topbarRight}>
            <button className={styles.iconBtn} aria-label="Notifications">
              <Bell size={18} />
              <span className={styles.badge}>3</span>
            </button>

            <div className={styles.userMenu}>
              <Image src="/img/avatar_placeholder.png" alt="avatar" width={36} height={36} className={styles.avatar} />
              <div className={styles.userInfo}>
                <div className={styles.userName}>Admin Utama</div>
                <div className={styles.userRole}>Administrator</div>
              </div>
                <button
                  className={styles.logoutBtn}
                  title="Logout"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  <LogOut size={16} />
                </button>
            </div>
          </div>
        </header>

        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
