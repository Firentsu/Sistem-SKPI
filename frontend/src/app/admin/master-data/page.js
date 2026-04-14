"use client";

import { useState, useEffect } from "react";
import {
  Plus, Edit2, Trash2, Search, Filter, ChevronLeft, ChevronRight,
  AlertCircle, CheckCircle2, X,
} from "lucide-react";
import styles from "./page.module.css";

// ========== CONSTANTS ==========
const JENIS_OPTIONS = ["Workshop", "Seminar", "Kompetisi", "Training", "Pengabdian", "Lainnya"];
const KATEGORI_OPTIONS = ["Akademik", "Non-Akademik", "Pengembangan Diri", "Kepemimpinan"];
const STATUS_OPTIONS = ["Aktif", "Nonaktif"];

// Warna untuk badge jenis aktivitas
const JENIS_COLORS = {
  Workshop: "#a855f7",
  Seminar: "#06b6d4",
  Kompetisi: "#ec4899",
  Training: "#f59e0b",
  Pengabdian: "#10b981",
  Lainnya: "#8b5cf6",
};

// ========== MOCK DATA ==========
const MOCK_MASTER_DATA = [
  { id: 1, jenis: "Workshop", kategori: "Akademik", deskripsi: "Workshop pengembangan skill programming", max_peserta: 50, status: "Aktif" },
  { id: 3, jenis: "Kompetisi", kategori: "Akademik", deskripsi: "Kompetisi programming nasional", max_peserta: 30, status: "Aktif" },
  { id: 4, jenis: "Training", kategori: "Pengembangan Diri", deskripsi: "Training kepemimpinan dan teamwork", max_peserta: 40, status: "Aktif" },
  { id: 2, jenis: "Seminar", kategori: "Non-Akademik", deskripsi: "Seminar soft skills dan karir profesional", max_peserta: 100, status: "Aktif" },
  { id: 5, jenis: "Pengabdian", kategori: "Non-Akademik", deskripsi: "Program pengabdian masyarakat", max_peserta: 20, status: "Nonaktif" },
  { id: 6, jenis: "Workshop", kategori: "Akademik", deskripsi: "Workshop web development full-stack", max_peserta: 45, status: "Aktif" },
];

// ========== TOAST COMPONENT ==========
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

// ========== MODAL ADD / EDIT ==========
function ModalAddEdit({ data, isOpen, onClose, onSave }) {
  const [form, setForm] = useState(
    data || { jenis: "", kategori: "", deskripsi: "", max_peserta: "", status: "Aktif" }
  );

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.jenis || !form.kategori || !form.deskripsi || !form.max_peserta) {
      alert("Semua field harus diisi!");
      return;
    }
    onSave(form);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            {data ? <Edit2 size={16} /> : <Plus size={16} />}
            <span>{data ? "Edit Master Data" : "Tambah Master Data"}</span>
          </div>
          <button onClick={onClose} className={styles.modalClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.formGroup}>
              <label>Jenis Aktivitas *</label>
              <select className={styles.input} value={form.jenis} onChange={e => handleChange("jenis", e.target.value)}>
                <option value="">-- Pilih Jenis --</option>
                {JENIS_OPTIONS.map(j => <option key={j}>{j}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Kategori *</label>
              <select className={styles.input} value={form.kategori} onChange={e => handleChange("kategori", e.target.value)}>
                <option value="">-- Pilih Kategori --</option>
                {KATEGORI_OPTIONS.map(k => <option key={k}>{k}</option>)}
              </select>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Max Peserta *</label>
                <input type="number" className={styles.input} min="1" value={form.max_peserta} onChange={e => handleChange("max_peserta", e.target.value)} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Deskripsi *</label>
              <textarea className={styles.input} rows="3" value={form.deskripsi} onChange={e => handleChange("deskripsi", e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label>Status</label>
              <select className={styles.input} value={form.status} onChange={e => handleChange("status", e.target.value)}>
                {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnOutline} onClick={onClose}>Batal</button>
            <button type="submit" className={styles.btnPrimary}>{data ? "Update" : "Simpan"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ========== MAIN PAGE ==========
export default function MasterDataPage() {
  const [data, setData] = useState(MOCK_MASTER_DATA);
  const [search, setSearch] = useState("");
  const [filterJenis, setFilterJenis] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [toast, setToast] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Set page title //
   useEffect(() => {
      document.title = "Master Data | Admin SKPI";
    }, []);

  // Filter & search
  const filtered = data.filter(item => {
    const matchSearch = item.jenis.toLowerCase().includes(search.toLowerCase()) ||
                        item.deskripsi.toLowerCase().includes(search.toLowerCase());
    const matchJenis = filterJenis === "Semua" || item.jenis === filterJenis;
    const matchStatus = filterStatus === "Semua" || item.status === filterStatus;
    return matchSearch && matchJenis && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedData = filtered.slice(startIdx, startIdx + itemsPerPage);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleTambah = () => {
    setSelectedData(null);
    setModalOpen(true);
  };

  const handleEdit = (item) => {
    setSelectedData(item);
    setModalOpen(true);
  };

  const handleSave = (form) => {
    if (selectedData) {
      setData(prev => prev.map(item => item.id === selectedData.id ? { ...item, ...form } : item));
      showToast("Master data berhasil diupdate!");
    } else {
      const newId = Math.max(...data.map(d => d.id), 0) + 1;
      setData(prev => [{ id: newId, ...form }, ...prev]);
      showToast("Master data berhasil ditambahkan!");
    }
    setCurrentPage(1);
  };

  const handleHapus = (id) => {
    if (confirm("Yakin ingin menghapus master data ini?")) {
      setData(prev => prev.filter(item => item.id !== id));
      showToast("Master data berhasil dihapus!");
    }
  };

  const totalActive = data.filter(d => d.status === "Aktif").length;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Master Data</h1>
          <p className={styles.subtitle}>Kelola jenis, kategori, dan aktivitas</p>
        </div>
        <button className={styles.btnPrimary} onClick={handleTambah}>
          <Plus size={16} /> Tambah Data
        </button>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><AlertCircle size={20} /></div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{data.length}</div>
            <div className={styles.statTitle}>Total Master Data</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><CheckCircle2 size={20} /></div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{totalActive}</div>
            <div className={styles.statTitle}>Data Aktif</div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className={styles.searchBar}>
        <div className={styles.searchInput}>
          <Search size={16} />
          <input type="text" placeholder="Cari jenis atau deskripsi..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} />
          {search && <button className={styles.clearSearch} onClick={() => setSearch("")}><X size={14} /></button>}
        </div>
        <div className={styles.filterActions}>
          <div className={styles.filterGroup}>
            <Filter size={14} />
            <select className={styles.filterSelect} value={filterJenis} onChange={e => { setFilterJenis(e.target.value); setCurrentPage(1); }}>
              <option value="Semua">Semua Jenis</option>
              {JENIS_OPTIONS.map(j => <option key={j}>{j}</option>)}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <select className={styles.filterSelect} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}>
              <option value="Semua">Semua Status</option>
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
              <tr><th>Jenis</th><th>Kategori</th><th>Max Peserta</th><th>Status</th><th>Deskripsi</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {paginatedData.map(item => (
                <tr key={item.id}>
                  <td><span className={styles.badge} style={{ background: JENIS_COLORS[item.jenis] }}>{item.jenis}</span></td>
                  <td>{item.kategori}</td>
                  <td>{item.max_peserta}</td>
                  <td><span className={`${styles.badge} ${item.status === "Aktif" ? styles.badgeSuccess : styles.badgeDanger}`}>{item.status}</span></td>
                  <td className={styles.descCell}>{item.deskripsi}</td>
                  <td>
                    <div className={styles.actionGroup}>
                      <button onClick={() => handleEdit(item)} className={styles.actionBtn}><Edit2 size={14} /></button>
                      <button onClick={() => handleHapus(item.id)} className={`${styles.actionBtn} ${styles.actionDanger}`}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={styles.emptyState}>
            <AlertCircle size={40} />
            <p>Tidak ada data master yang sesuai dengan filter Anda</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>Halaman {currentPage} dari {totalPages}</div>
          <div className={styles.paginationControls}>
            <button className={styles.pageBtn} onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>«</button>
            <button className={styles.pageBtn} onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}><ChevronLeft size={14} /></button>
            {Array.from({ length: totalPages }, (_, i) => i+1).filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1).reduce((acc, p, i, arr) => {
              if (i > 0 && arr[i-1] !== p-1) acc.push("...");
              acc.push(p);
              return acc;
            }, []).map((p, i) => p === "..." ? <span key={`dots-${i}`} className={styles.pageDots}>…</span> : (
              <button key={p} className={`${styles.pageBtn} ${currentPage === p ? styles.pageBtnActive : ""}`} onClick={() => setCurrentPage(p)}>{p}</button>
            ))}
            <button className={styles.pageBtn} onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}><ChevronRight size={14} /></button>
            <button className={styles.pageBtn} onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>»</button>
          </div>
        </div>
      )}

      {/* Modal */}
      <ModalAddEdit data={selectedData} isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

// Missing import for TrendingUp
import { TrendingUp } from "lucide-react";