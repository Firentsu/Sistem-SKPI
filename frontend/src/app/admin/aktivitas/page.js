"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, Plus, Search, Filter, Edit2, Trash2, Eye,
  Loader2, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2,
  Calendar, Users, Tag, Award, TrendingUp, X, Check, X as XIcon, Clock
} from "lucide-react";
import { apiFetch, isMockMode } from "@/lib/api";
import styles from "./aktivitas.module.css";

// ========== STATUS VERIFIKASI (dari backend) ==========
const STATUS_VERIFIKASI = {
  "diproses": { label: "Diproses", color: "#f59e0b", icon: Clock },
  "disetujui": { label: "Disetujui", color: "#22c55e", icon: Check },
  "ditolak": { label: "Ditolak", color: "#ef4444", icon: XIcon },
  "revisi": { label: "Revisi", color: "#8b5cf6", icon: AlertCircle },
};

// ========== MOCK DATA (fallback jika backend down) ==========
const MOCK_AKTIVITAS = [
  { 
    id_kegiatan: 1, 
    nama_kegiatan: "Workshop React.js Advanced", 
    jenisaktivitas: { nama_indo: "Workshop" },
    kategoriaktivitas: { nama_indo: "Akademik" },
    mahasiswa: { nama: "Budi Santoso", nim: "2024001" },
    tanggal_kegiatan: "2026-04-20", 
    status_verifikasi: "diproses",
    penyelenggara: "ISB Academy",
  },
  { 
    id_kegiatan: 2, 
    nama_kegiatan: "Seminar Entrepreneurship", 
    jenisaktivitas: { nama_indo: "Seminar" },
    kategoriaktivitas: { nama_indo: "Kewirausahaan" },
    mahasiswa: { nama: "Ani Wijaya", nim: "2024002" },
    tanggal_kegiatan: "2026-04-18", 
    status_verifikasi: "disetujui",
    penyelenggara: "ISB Business Club",
  },
];

const JENIS_COLOR = {
  "Workshop": "#7c3aed",
  "Seminar": "#06b6d4",
  "Kompetisi": "#ec4899",
  "Training": "#f59e0b",
  "Webinar": "#6366f1",
  "Magang": "#10b981",
  "Organisasi": "#8b5cf6",
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

// ========== MODAL DETAIL + VERIFIKASI ==========
function DetailModal({ data, isOpen, onClose, onVerifikasi, isVerifying }) {
  const [status, setStatus] = useState("diproses");
  const [catatan, setCatatan] = useState("");

  if (!isOpen || !data) return null;

  const handleVerifikasi = () => {
    onVerifikasi(data.id_kegiatan, status, catatan);
    setCatatan("");
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <Eye size={16} />
            <span>Detail & Verifikasi Aktivitas</span>
          </div>
          <button onClick={onClose} className={styles.modalClose}><X size={18} /></button>
        </div>
        <div className={styles.modalBody}>
          {/* Detail Aktivitas */}
          <div className={styles.detailSection}>
            <h3 className={styles.sectionTitle}>📋 Informasi Aktivitas</h3>
            <div className={styles.detailRow}><label>Nama Aktivitas</label><p>{data.nama_kegiatan}</p></div>
            <div className={styles.detailRow}><label>Jenis</label><p>{data.jenisaktivitas?.nama_indo || "-"}</p></div>
            <div className={styles.detailRow}><label>Kategori</label><p>{data.kategoriaktivitas?.nama_indo || "-"}</p></div>
            <div className={styles.detailRow}><label>Penyelenggara</label><p>{data.penyelenggara || "-"}</p></div>
            <div className={styles.detailRow}><label>Tanggal Kegiatan</label><p>{new Date(data.tanggal_kegiatan).toLocaleDateString("id-ID")}</p></div>
            <div className={styles.detailRow}><label>Lokasi</label><p>{data.lokasi || "-"}</p></div>
            
            {/* Info Mahasiswa */}
            <h3 className={styles.sectionTitle}>👤 Mahasiswa Pengusul</h3>
            <div className={styles.detailRow}><label>Nama</label><p>{data.mahasiswa?.nama || "-"}</p></div>
            <div className={styles.detailRow}><label>NIM</label><p>{data.mahasiswa?.nim || "-"}</p></div>

            {/* Status Saat Ini */}
            <h3 className={styles.sectionTitle}>✅ Status Verifikasi Saat Ini</h3>
            <div className={styles.detailRow}>
              <label>Status</label>
              <span style={{ 
                color: STATUS_VERIFIKASI[data.status_verifikasi]?.color,
                fontWeight: "bold"
              }}>
                {STATUS_VERIFIKASI[data.status_verifikasi]?.label || data.status_verifikasi}
              </span>
            </div>
            {data.catatan_admin && (
              <div className={styles.detailRow}>
                <label>Catatan Admin</label>
                <p>{data.catatan_admin}</p>
              </div>
            )}
          </div>

          {/* Form Verifikasi */}
          <div className={styles.verifikasiSection}>
            <h3 className={styles.sectionTitle}>🔍 Verifikasi Aktivitas</h3>
            <div className={styles.formGroup}>
              <label htmlFor="verif-status" className={styles.label}>Ubah Status</label>
              <select 
                id="verif-status"
                className={styles.select}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="diproses">⏳ Diproses</option>
                <option value="disetujui">✅ Disetujui</option>
                <option value="ditolak">❌ Ditolak</option>
                <option value="revisi">🔄 Revisi</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="catatan" className={styles.label}>Catatan (Opsional)</label>
              <textarea
                id="catatan"
                className={styles.textarea}
                placeholder="Berikan catatan jika diperlukan..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows="3"
              />
            </div>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.btnOutline} onClick={onClose}>Tutup</button>
          <button 
            className={styles.btnPrimary}
            onClick={handleVerifikasi}
            disabled={isVerifying}
          >
            {isVerifying ? <Loader2 size={14} className={styles.spinner} /> : <Check size={14} />}
            {isVerifying ? "Memproses..." : "Simpan Verifikasi"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ========== MAIN PAGE ==========
export default function AktivitasPage() {
  const [aktivitas, setAktivitas] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [mockMode, setMockMode] = useState(false);
  const itemsPerPage = 10;
  const router = useRouter();

  // Load aktivitas dari backend
  useEffect(() => {
    const fetchAktivitas = async () => {
      try {
        setLoading(true);
        const res = await apiFetch("/api/aktivitas");
        
        if (res.ok) {
          const data = await res.json();
          setAktivitas(data.rows || []);
          setMockMode(false);
        } else {
          // Fallback ke mock data jika backend error
          setAktivitas(MOCK_AKTIVITAS);
          setMockMode(true);
        }
      } catch (err) {
        console.error("Error fetching aktivitas:", err);
        setAktivitas(MOCK_AKTIVITAS);
        setMockMode(true);
      } finally {
        setLoading(false);
      }
    };

    fetchAktivitas();
    document.title = "Aktivitas | Admin SKPI";
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Filter data
  const filtered = aktivitas.filter(a => {
    const matchSearch = !search || a.nama_kegiatan?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "Semua" || a.status_verifikasi === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // Handle view detail & verifikasi
  const handleView = useCallback((data) => {
    setDetailModal(data);
  }, []);

  // Handle verifikasi aktivitas
  const handleVerifikasi = async (id, status, catatan) => {
    try {
      setIsVerifying(true);
      const res = await apiFetch(`/api/aktivitas/${id}/verifikasi`, {
        method: "PATCH",
        body: JSON.stringify({ status, catatan_admin: catatan }),
      });

      if (res.ok) {
        const updated = await res.json();
        // Update local state
        setAktivitas(prev => prev.map(a => a.id_kegiatan === id ? updated.data : a));
        setDetailModal(null);
        showToast(`Aktivitas berhasil diverifikasi dengan status: ${STATUS_VERIFIKASI[status].label}`, "success");
      } else {
        showToast("Gagal memverifikasi aktivitas", "error");
      }
    } catch (err) {
      console.error("Error verifikasi:", err);
      showToast("Error: " + err.message, "error");
    } finally {
      setIsVerifying(false);
    }
  };

  // Hitung statistik
  const stats = {
    total: filtered.length,
    disetujui: filtered.filter(a => a.status_verifikasi === "disetujui").length,
    diproses: filtered.filter(a => a.status_verifikasi === "diproses").length,
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
      <DetailModal 
        data={detailModal} 
        isOpen={!!detailModal} 
        onClose={() => setDetailModal(null)}
        onVerifikasi={handleVerifikasi}
        isVerifying={isVerifying}
      />

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
            <div className={styles.statValue}>{stats.disetujui}</div>
            <div className={styles.statTitle}>Disetujui</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><Clock size={20} /></div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.diproses}</div>
            <div className={styles.statTitle}>Diproses</div>
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
            <select className={styles.filterSelect} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
              <option value="Semua">Semua Status</option>
              <option value="diproses">⏳ Diproses</option>
              <option value="disetujui">✅ Disetujui</option>
              <option value="ditolak">❌ Ditolak</option>
              <option value="revisi">🔄 Revisi</option>
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
                <th>Mahasiswa</th>
                <th>Jenis</th>
                <th>Kategori</th>
                <th>Status Verifikasi</th>
                <th>Tanggal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map(item => (
                <tr key={item.id_kegiatan} className={styles.tableRow}>
                  <td>
                    <div className={styles.nameColumn}>
                      <strong>{item.nama_kegiatan}</strong>
                      <small className={styles.idSub}>ID: {String(item.id_kegiatan).padStart(3, "0")}</small>
                    </div>
                  </td>
                  <td>
                    <div>
                      <strong>{item.mahasiswa?.nama}</strong>
                      <small className={styles.idSub}>{item.mahasiswa?.nim}</small>
                    </div>
                  </td>
                  <td>
                    <span className={styles.jenisBadge} style={{ backgroundColor: `${JENIS_COLOR[item.jenisaktivitas?.nama_indo] || "#6b7280"}22`, color: JENIS_COLOR[item.jenisaktivitas?.nama_indo] || "#6b7280" }}>
                      {item.jenisaktivitas?.nama_indo || "-"}
                    </span>
                  </td>
                  <td>{item.kategoriaktivitas?.nama_indo || "-"}</td>
                  <td>
                    <span className={styles.statusBadge} style={{ backgroundColor: `${STATUS_VERIFIKASI[item.status_verifikasi]?.color}22`, color: STATUS_VERIFIKASI[item.status_verifikasi]?.color }}>
                      {STATUS_VERIFIKASI[item.status_verifikasi]?.label}
                    </span>
                  </td>
                  <td>
                    <small>{new Date(item.tanggal_kegiatan).toLocaleDateString("id-ID")}</small>
                  </td>
                  <td>
                    <div className={styles.actionGroup}>
                      <button className={styles.actionBtn} onClick={() => handleView(item)} title="Verifikasi"><Eye size={14} /></button>
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
            {mockMode && <p style={{ fontSize: "12px", color: "#999" }}>(Mode Demo)</p>}
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