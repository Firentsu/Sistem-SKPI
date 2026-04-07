"use client";

import { useState } from "react";
import {
  Search, Filter, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, X,
  Download, Eye, FileText, Loader2, Zap, Users, Award, TrendingUp
} from "lucide-react";
import styles from "./page.module.css";

// Mock data mahasiswa
const MOCK_MAHASISWA = [
  { id: 1, nim: "2021001001", nama: "Ahmad Rizki", prodi: "Teknik Informatika", total_aktivitas: 25, total_poin: 125, status: "Siap" },
  { id: 2, nim: "2021002001", nama: "Budi Santoso", prodi: "Manajemen", total_aktivitas: 18, total_poin: 98, status: "Siap" },
  { id: 3, nim: "2021001002", nama: "Citra Dewi", prodi: "Teknik Informatika", total_aktivitas: 20, total_poin: 115, status: "Siap" },
  { id: 4, nim: "2021003001", nama: "Dedi Wijaya", prodi: "Akuntansi", total_aktivitas: 15, total_poin: 88, status: "Kurang" },
  { id: 5, nim: "2021004001", nama: "Eka Putri", prodi: "Ilmu Komunikasi", total_aktivitas: 10, total_poin: 75, status: "Kurang" },
  { id: 6, nim: "2021005001", nama: "Fajar Rahman", prodi: "Sistem Informasi", total_aktivitas: 28, total_poin: 142, status: "Siap" },
];

// Toast Component
function Toast({ toast, onClose }) {
  if (!toast) return null;
  const isOk = toast.type === "success";
  return (
    <div className={`${styles.toast} ${isOk ? styles.toastSuccess : styles.toastError}`}>
      <div className={styles.toastIcon}>
        {isOk ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      </div>
      <span className={styles.toastMessage}>{toast.msg}</span>
      <button className={styles.toastClose} onClick={onClose}>
        <X size={14} />
      </button>
    </div>
  );
}

// Preview Modal
function PreviewModal({ item, isOpen, onClose, onGenerate, loading }) {
  if (!isOpen || !item) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Preview SKPI - {item.nama}</h3>
          <button onClick={onClose} className={styles.modalClose}>
            <X size={20} />
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.previewCard}>
            <div className={styles.previewHeader}>
              <h4>SURAT KETERANGAN PENCAPAIAN KOMPETENSI (SKPI)</h4>
              <p>Institut Shanti Bhuana</p>
            </div>
            <div className={styles.previewContent}>
              <div className={styles.previewRow}>
                <label>Nama Mahasiswa</label>
                <p>{item.nama}</p>
              </div>
              <div className={styles.previewRow}>
                <label>NIM</label>
                <p>{item.nim}</p>
              </div>
              <div className={styles.previewRow}>
                <label>Program Studi</label>
                <p>{item.prodi}</p>
              </div>
              <div className={styles.previewRow}>
                <label>Total Aktivitas</label>
                <p>{item.total_aktivitas} kegiatan</p>
              </div>
              <div className={styles.previewRow}>
                <label>Total Poin</label>
                <p className={styles.previewPoin}>{item.total_poin} poin</p>
              </div>
              <hr className={styles.divider} />
              <div className={styles.previewRow}>
                <label>Rincian Aktivitas</label>
                <div className={styles.rincianList}>
                  <p>✓ Workshop & Seminar: 8 kegiatan (32 poin)</p>
                  <p>✓ Kompetisi: 4 kegiatan (40 poin)</p>
                  <p>✓ Training: 6 kegiatan (24 poin)</p>
                  <p>✓ Pengabdian: 3 kegiatan (18 poin)</p>
                  <p>✓ Pengembangan Diri: 4 kegiatan (11 poin)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.btnSecondary}>
            Batal
          </button>
          <button
            onClick={() => onGenerate(item)}
            disabled={loading}
            className={`${styles.btnPrimary} ${styles.btnWithIcon}`}
          >
            {loading ? <Loader2 size={18} className={styles.spin} /> : <Download size={18} />}
            {loading ? "Memproses..." : "Generate & Download"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GenerateSkpiPage() {
  const [mahasiswa] = useState(MOCK_MAHASISWA);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterProdi, setFilterProdi] = useState("Semua");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const prodiList = ["Semua", ...new Set(mahasiswa.map((m) => m.prodi))];

  // Filter & pagination
  const filtered = mahasiswa.filter((item) => {
    const matchSearch = item.nim.includes(search) || item.nama.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "Semua" || item.status === filterStatus;
    const matchProdi = filterProdi === "Semua" || item.prodi === filterProdi;
    return matchSearch && matchStatus && matchProdi;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handlePreview = (item) => {
    setSelectedItem(item);
    setPreviewOpen(true);
  };

  const handleGenerate = async (item) => {
    setLoading(true);
    setTimeout(() => {
      showToast(`SKPI untuk ${item.nama} berhasil digenerate!`);
      setLoading(false);
      setPreviewOpen(false);
    }, 1500);
  };

  const handleBulkGenerate = async () => {
    if (filtered.length === 0) {
      showToast("Tidak ada mahasiswa untuk digenerate", "error");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      showToast(`${filtered.length} SKPI berhasil digenerate!`);
      setLoading(false);
    }, 2000);
  };

  // Statistik
  const totalSiap = mahasiswa.filter(m => m.status === "Siap").length;
  const totalKurang = mahasiswa.filter(m => m.status === "Kurang").length;
  const rataPoin = Math.round(mahasiswa.reduce((sum, m) => sum + m.total_poin, 0) / mahasiswa.length);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Generate & Penerbitan SKPI</h1>
          <p className={styles.subtitle}>Buat dan terbitkan surat keterangan pencapaian kompetensi mahasiswa</p>
        </div>
        <button
          onClick={handleBulkGenerate}
          disabled={loading}
          className={`${styles.btnPrimary} ${styles.btnLg} ${styles.btnWithIcon}`}
        >
          {loading ? <Loader2 size={18} className={styles.spin} /> : <Zap size={18} />}
          {loading ? "Sedang Generate..." : "Generate Semua"}
        </button>
      </div>

      {/* Stat Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><Users size={24} /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{mahasiswa.length}</div>
            <div className={styles.statLabel}>Total Mahasiswa</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "#d1fae5", color: "#10b981" }}><Award size={24} /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{totalSiap}</div>
            <div className={styles.statLabel}>Siap Generate</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "#fed7aa", color: "#f59e0b" }}><AlertCircle size={24} /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{totalKurang}</div>
            <div className={styles.statLabel}>Poin Kurang</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: "#e0e7ff", color: "#4f46e5" }}><TrendingUp size={24} /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{rataPoin}</div>
            <div className={styles.statLabel}>Rata-rata Poin</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Cari NIM atau nama mahasiswa..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className={styles.filterGroup}>
          <Filter size={18} />
          <select value={filterProdi} onChange={(e) => { setFilterProdi(e.target.value); setCurrentPage(1); }}>
            {prodiList.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}>
            <option value="Semua">Semua Status</option>
            <option value="Siap">Siap Generate</option>
            <option value="Kurang">Poin Kurang</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        {paginatedData.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>NIM</th>
                <th>Nama</th>
                <th>Program Studi</th>
                <th>Aktivitas</th>
                <th>Poin</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item) => (
                <tr key={item.id}>
                  <td><code className={styles.code}>{item.nim}</code></td>
                  <td><strong>{item.nama}</strong></td>
                  <td>{item.prodi}</td>
                  <td className={styles.center}>{item.total_aktivitas}</td>
                  <td><strong className={styles.poinValue}>{item.total_poin}</strong></td>
                  <td>
                    <span className={`${styles.badge} ${item.status === "Siap" ? styles.badgeSuccess : styles.badgeWarning}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionGroup}>
                      <button onClick={() => handlePreview(item)} className={styles.actionBtn} title="Preview">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => handleGenerate(item)} className={styles.actionBtn} title="Generate" disabled={loading}>
                        <Download size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={styles.emptyState}>
            <FileText size={48} />
            <p>Tidak ada mahasiswa yang sesuai dengan filter Anda</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className={styles.pageBtn}>
            <ChevronLeft size={18} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i+1).map(page => (
            <button key={page} onClick={() => setCurrentPage(page)} className={`${styles.pageBtn} ${currentPage === page ? styles.activePage : ""}`}>
              {page}
            </button>
          ))}
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className={styles.pageBtn}>
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      <PreviewModal item={selectedItem} isOpen={previewOpen} onClose={() => setPreviewOpen(false)} onGenerate={handleGenerate} loading={loading} />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}