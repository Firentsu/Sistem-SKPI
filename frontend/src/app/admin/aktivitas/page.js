"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, Plus, Search, Filter, Edit2, Trash2, Eye,
  Loader2, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2,
  Calendar, Users, Tag, Award, TrendingUp, X
} from "lucide-react";
import styles from "./aktivitas.module.css";

// ========== MOCK DATA ==========
const MOCK_AKTIVITAS = [
  { id: 1, nama: "Workshop React.js Advanced", jenis: "Workshop", kategori: "Akademik", peserta: 45, status: "Aktif", tanggal: "2026-04-20", icp: 15 },
  { id: 2, nama: "Seminar Entrepreneurship", jenis: "Seminar", kategori: "Kewirausahaan", peserta: 120, status: "Aktif", tanggal: "2026-04-18", icp: 20 },
  { id: 3, nama: "Kompetisi Coding ISB", jenis: "Kompetisi", kategori: "Akademik", peserta: 78, status: "Selesai", tanggal: "2026-04-10", icp: 25 },
  { id: 4, nama: "Training Kepemimpinan", jenis: "Training", kategori: "Pengembangan Diri", peserta: 60, status: "Aktif", tanggal: "2026-04-08", icp: 10 },
  { id: 5, nama: "Webinar: Digital Marketing", jenis: "Webinar", kategori: "Industri", peserta: 200, status: "Aktif", tanggal: "2026-04-25", icp: 12 },
  { id: 6, nama: "Magang Program ISB", jenis: "Magang", kategori: "Industri", peserta: 30, status: "Aktif", tanggal: "2026-05-01", icp: 30 },
];

const JENIS_OPTIONS = ["Semua", "Workshop", "Seminar", "Kompetisi", "Training", "Webinar", "Magang", "Organisasi"];
const KATEGORI_OPTIONS = ["Semua", "Akademik", "Kewirausahaan", "Pengembangan Diri", "Industri", "Organisasi"];
const STATUS_OPTIONS = ["Semua", "Aktif", "Selesai", "Ditunda", "Dibatalkan"];

const JENIS_COLOR = {
  "Workshop": "#7c3aed",
  "Seminar": "#06b6d4",
  "Kompetisi": "#ec4899",
  "Training": "#f59e0b",
  "Webinar": "#6366f1",
  "Magang": "#10b981",
  "Organisasi": "#8b5cf6",
};

const STATUS_COLOR = {
  "Aktif": "#22c55e",
  "Selesai": "#3b82f6",
  "Ditunda": "#f59e0b",
  "Dibatalkan": "#ef4444",
};

// ========== TOAST ==========
function Toast({ toast, onClose }) {
  if (!toast) return null;
  const isOk = toast.type === "success";
  return (
    <div className={`${styles.toast} ${isOk ? styles.toastSuccess : styles.toastError}`}>
      {isOk ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      <span>{toast.msg}</span>
      <button onClick={onClose} className={styles.toastClose}><X size={14} /></button>
    </div>
  );
}

// ========== MODAL DETAIL ==========
function DetailModal({ data, isOpen, onClose }) {
  if (!isOpen || !data) return null;
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <Eye size={16} />
            <span>Detail Aktivitas</span>
          </div>
          <button onClick={onClose} className={styles.modalClose}><X size={18} /></button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.detailRow}><label>Nama Aktivitas</label><p>{data.nama}</p></div>
          <div className={styles.detailRow}><label>Jenis</label><p>{data.jenis}</p></div>
          <div className={styles.detailRow}><label>Kategori</label><p>{data.kategori}</p></div>
          <div className={styles.detailRow}><label>Jumlah Peserta</label><p>{data.peserta} orang</p></div>
          <div className={styles.detailRow}><label>ICP</label><p>{data.icp} poin</p></div>
          <div className={styles.detailRow}><label>Status</label><p>{data.status}</p></div>
          <div className={styles.detailRow}><label>Tanggal</label><p>{data.tanggal}</p></div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.btnOutline} onClick={onClose}>Tutup</button>
        </div>
      </div>
    </div>
  );
}

// ========== MAIN PAGE ==========
export default function AktivitasPage() {
  const [aktivitas, setAktivitas] = useState(MOCK_AKTIVITAS);
  const [search, setSearch] = useState("");
  const [filterJenis, setFilterJenis] = useState("Semua");
  const [filterKategori, setFilterKategori] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const itemsPerPage = 10;
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Filter
  const filtered = aktivitas.filter(a => {
    const matchSearch = !search || a.nama.toLowerCase().includes(search.toLowerCase());
    const matchJenis = filterJenis === "Semua" || a.jenis === filterJenis;
    const matchKategori = filterKategori === "Semua" || a.kategori === filterKategori;
    const matchStatus = filterStatus === "Semua" || a.status === filterStatus;
    return matchSearch && matchJenis && matchKategori && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleEdit = useCallback((data) => {
    router.push(`/admin/aktivitas/edit/${data.id}`);
  }, [router]);

  const handleDelete = useCallback((id) => {
    if (confirm("Apakah Anda yakin ingin menghapus aktivitas ini?")) {
      setAktivitas(prev => prev.filter(a => a.id !== id));
      showToast("Aktivitas berhasil dihapus", "error");
    }
  }, []);

  const handleView = useCallback((data) => {
    setDetailModal(data);
  }, []);

  const stats = {
    total: filtered.length,
    aktif: filtered.filter(a => a.status === "Aktif").length,
    totalPeserta: filtered.reduce((sum, a) => sum + a.peserta, 0),
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={32} className={styles.spinner} />
        <p>Memuat data aktivitas...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Toast toast={toast} onClose={() => setToast(null)} />
      <DetailModal data={detailModal} isOpen={!!detailModal} onClose={() => setDetailModal(null)} />

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Manajemen Aktivitas</h1>
          <p className={styles.subtitle}>Kelola kegiatan, workshop, dan event SKPI</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => router.push("/admin/aktivitas/tambah")}>
          <Plus size={16} /> Tambah Aktivitas
        </button>
      </div>

      {/* Stat Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><Activity size={20} /></div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statTitle}>Total Aktivitas</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><CheckCircle2 size={20} /></div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.aktif}</div>
            <div className={styles.statTitle}>Aktif</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><Users size={20} /></div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.totalPeserta}</div>
            <div className={styles.statTitle}>Total Peserta</div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className={styles.searchBar}>
        <div className={styles.searchInput}>
          <Search size={16} />
          <input type="text" placeholder="Cari nama aktivitas..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          {search && <button className={styles.clearSearch} onClick={() => setSearch("")}><X size={14} /></button>}
        </div>
        <div className={styles.filterActions}>
          <div className={styles.filterGroup}>
            <Filter size={14} />
            <select className={styles.filterSelect} value={filterJenis} onChange={e => { setFilterJenis(e.target.value); setPage(1); }}>
              {JENIS_OPTIONS.map(j => <option key={j}>{j}</option>)}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <select className={styles.filterSelect} value={filterKategori} onChange={e => { setFilterKategori(e.target.value); setPage(1); }}>
              {KATEGORI_OPTIONS.map(k => <option key={k}>{k}</option>)}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <select className={styles.filterSelect} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
              {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        {paginatedData.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nama Aktivitas</th>
                <th>Jenis</th>
                <th>Kategori</th>
                <th>Peserta</th>
                <th>ICP</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map(item => (
                <tr key={item.id} className={styles.tableRow}>
                  <td>
                    <div className={styles.nameColumn}>
                      <strong>{item.nama}</strong>
                      <small className={styles.idSub}>ID: {String(item.id).padStart(3, "0")}</small>
                    </div>
                  </td>
                  <td>
                    <span className={styles.jenisBadge} style={{ backgroundColor: `${JENIS_COLOR[item.jenis] || "#6b7280"}22`, color: JENIS_COLOR[item.jenis] || "#6b7280" }}>
                      {item.jenis}
                    </span>
                  </td>
                  <td>{item.kategori}</td>
                  <td className={styles.center}><span className={styles.numberChip}>{item.peserta}</span></td>
                  <td className={styles.center}><span className={`${styles.numberChip} ${styles.icpChip}`}>{item.icp}</span></td>
                  <td>
                    <span className={styles.statusBadge} style={{ backgroundColor: `${STATUS_COLOR[item.status]}22`, color: STATUS_COLOR[item.status] }}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionGroup}>
                      <button className={styles.actionBtn} onClick={() => handleView(item)} title="Detail"><Eye size={14} /></button>
                      <button className={styles.actionBtn} onClick={() => handleEdit(item)} title="Edit"><Edit2 size={14} /></button>
                      <button className={`${styles.actionBtn} ${styles.actionDanger}`} onClick={() => handleDelete(item.id)} title="Hapus"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={styles.emptyState}>
            <AlertCircle size={40} />
            <p>Tidak ada aktivitas yang sesuai dengan filter Anda</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>Halaman {page} dari {totalPages}</div>
          <div className={styles.paginationControls}>
            <button className={styles.pageBtn} onClick={() => setPage(1)} disabled={page === 1}>«</button>
            <button className={styles.pageBtn} onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}><ChevronLeft size={14} /></button>
            {Array.from({ length: totalPages }, (_, i) => i+1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1).reduce((acc, p, i, arr) => {
              if (i > 0 && arr[i-1] !== p-1) acc.push("...");
              acc.push(p);
              return acc;
            }, []).map((p, i) => p === "..." ? <span key={`dots-${i}`} className={styles.pageDots}>…</span> : (
              <button key={p} className={`${styles.pageBtn} ${page === p ? styles.pageBtnActive : ""}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className={styles.pageBtn} onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}><ChevronRight size={14} /></button>
            <button className={styles.pageBtn} onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
          </div>
        </div>
      )}
    </div>
  );
}