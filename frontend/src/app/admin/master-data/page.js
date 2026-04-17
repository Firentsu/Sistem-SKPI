"use client";

import { useState, useEffect } from "react";
import {
  Plus, Edit2, Trash2, Search, Filter, ChevronLeft, ChevronRight,
  AlertCircle, CheckCircle2, X, TrendingUp
} from "lucide-react";
import styles from "./page.module.css";

// ========== MASTER DATA TYPES ==========
const MASTER_TYPES = [
  { value: "jenis_aktivitas", label: "Jenis Aktivitas", icon: "📋" },
  { value: "kategori_aktivitas", label: "Kategori Aktivitas", icon: "🏷️" },
  { value: "kelompok_aktivitas", label: "Kelompok Aktivitas", icon: "📁" },
  { value: "level_kegiatan", label: "Level Kegiatan", icon: "⭐" },
  { value: "tingkat_prestasi", label: "Tingkat Prestasi", icon: "🏆" },
];

// ========== DEFAULT DATA (Sesuai SKPI) ==========
const DEFAULT_DATA = {
  // Jenis Aktivitas berdasarkan SKPI (9 jenis)
  jenis_aktivitas: [
    "Prestasi dan Kegiatan",
    "Peningkatan Keterampilan Profesional",
    "Pengalaman Berorganisasi dan Kepemimpinan",
    "Pengembangan Intelektual",
    "Praktik Kerja",
    "Pembinaan Spiritual",
    "Pembangunan Karakter dan Kepribadian",
    "Kursus - kursus",
    "Skripsi"
  ],
  
  // Kategori Aktivitas (12 kategori)
  kategori_aktivitas: [
    "Lomba/Kompetisi",
    "Seminar",
    "Workshop",
    "Pelatihan",
    "Organisasi",
    "Kepanitian",
    "Magang",
    "Penelitian",
    "Pengabdian Masyarakat",
    "Publikasi Ilmiah",
    "Kegiatan Kampus",
    "Sertifikasi Profesional"
  ],
  
  // Kelompok Aktivitas (6 kelompok)
  kelompok_aktivitas: [
    "Akademik",
    "Non-Akademik",
    "Organisasi",
    "Kepemimpinan",
    "Penelitian",
    "Profesional"
  ],
  
  // Level Kegiatan (3 level)
  level_kegiatan: [
    "Internal",
    "Nasional",
    "Internasional"
  ],
  
  // Tingkat Prestasi (7 tingkat)
  tingkat_prestasi: [
    "Peserta",
    "Juara 1",
    "Juara 2",
    "Juara 3",
    "Harapan",
    "Finalis",
    "Partisipasi"
  ],
};

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
function ModalAddEdit({ type, data, isOpen, onClose, onSave }) {
  const [value, setValue] = useState(data || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!value.trim()) {
      alert("Nilai tidak boleh kosong!");
      return;
    }
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    onSave(value.trim());
    setSaving(false);
  };

  if (!isOpen) return null;

  const typeLabel = MASTER_TYPES.find(t => t.value === type)?.label || type;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            {data ? <Edit2 size={16} /> : <Plus size={16} />}
            <span>{data ? `Edit ${typeLabel}` : `Tambah ${typeLabel}`}</span>
          </div>
          <button onClick={onClose} className={styles.modalClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.formGroup}>
              <label>Nilai <span className={styles.required}>*</span></label>
              <input
                type="text"
                className={styles.input}
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder={`Masukkan ${typeLabel.toLowerCase()} baru`}
                autoFocus
              />
            </div>
            {type === "jenis_aktivitas" && (
              <div className={styles.formHint}>
                <small>Contoh: Prestasi dan Kegiatan, Praktik Kerja, Skripsi, dll.</small>
              </div>
            )}
            {type === "kategori_aktivitas" && (
              <div className={styles.formHint}>
                <small>Contoh: Lomba/Kompetisi, Seminar, Workshop, Magang, dll.</small>
              </div>
            )}
            {type === "kelompok_aktivitas" && (
              <div className={styles.formHint}>
                <small>Contoh: Akademik, Non-Akademik, Organisasi, Kepemimpinan, dll.</small>
              </div>
            )}
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnOutline} onClick={onClose}>Batal</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? "Menyimpan..." : (data ? "Update" : "Simpan")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ========== DELETE MODAL ==========
function DeleteModal({ isOpen, onClose, onConfirm, itemName }) {
  if (!isOpen) return null;
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modalContainer} ${styles.modalSm}`} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <AlertCircle size={16} />
            <span>Hapus Data</span>
          </div>
          <button onClick={onClose} className={styles.modalClose}><X size={18} /></button>
        </div>
        <div className={styles.modalBody}>
          <p>Yakin ingin menghapus <strong>"{itemName}"</strong>?</p>
          <p className={styles.warningText}>Data yang dihapus tidak dapat dikembalikan.</p>
          {itemName === "Prestasi dan Kegiatan" && (
            <p className={styles.warningText}>⚠️ Data ini adalah data default SKPI.</p>
          )}
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.btnOutline} onClick={onClose}>Batal</button>
          <button className={`${styles.btnPrimary} ${styles.btnDanger}`} onClick={onConfirm}>Hapus</button>
        </div>
      </div>
    </div>
  );
}

// ========== MAIN PAGE ==========
export default function MasterDataPage() {
  const [activeType, setActiveType] = useState("jenis_aktivitas");
  const [data, setData] = useState(DEFAULT_DATA);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDelete, setModalDelete] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    document.title = "Master Data | Admin SKPI";
  }, []);

  const currentData = data[activeType] || [];
  const typeLabel = MASTER_TYPES.find(t => t.value === activeType)?.label || activeType;

  // Filter data
  const filtered = currentData.filter(item =>
    item.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedData = filtered.slice(startIdx, startIdx + itemsPerPage);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleSave = (value) => {
    if (editingItem) {
      // Update existing item
      const index = currentData.indexOf(editingItem);
      if (index !== -1) {
        const newData = [...currentData];
        newData[index] = value;
        setData(prev => ({ ...prev, [activeType]: newData }));
        showToast(`${typeLabel} berhasil diupdate!`);
      }
    } else {
      // Add new item
      setData(prev => ({ ...prev, [activeType]: [...currentData, value] }));
      showToast(`${typeLabel} berhasil ditambahkan!`);
    }
    setModalOpen(false);
    setEditingItem(null);
    setCurrentPage(1);
  };

  const handleDelete = (item) => {
    const newData = currentData.filter(i => i !== item);
    setData(prev => ({ ...prev, [activeType]: newData }));
    setModalDelete(null);
    showToast(`${typeLabel} berhasil dihapus!`, "error");
  };

  const getStats = () => {
    return {
      total: currentData.length,
    };
  };

  const stats = getStats();

  // Informasi untuk setiap tipe
  const typeInfo = {
    jenis_aktivitas: "Jenis kegiatan yang dilakukan mahasiswa sesuai dengan SKPI",
    kategori_aktivitas: "Kategori kegiatan untuk mengelompokkan aktivitas mahasiswa",
    kelompok_aktivitas: "Kelompok besar aktivitas (Akademik, Non-Akademik, dll)",
    level_kegiatan: "Tingkat penyelenggaraan kegiatan",
    tingkat_prestasi: "Tingkat pencapaian dalam kompetisi/lomba"
  };

  return (
    <div className={styles.container}>
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Master Data</h1>
          <p className={styles.subtitle}>Kelola data referensi untuk aktivitas mahasiswa sesuai SKPI</p>
        </div>
      </div>

      {/* Type Tabs */}
      <div className={styles.tabs}>
        {MASTER_TYPES.map(type => (
          <button
            key={type.value}
            className={`${styles.tab} ${activeType === type.value ? styles.tabActive : ""}`}
            onClick={() => { setActiveType(type.value); setSearch(""); setCurrentPage(1); }}
          >
            <span className={styles.tabIcon}>{type.icon}</span>
            <span>{type.label}</span>
          </button>
        ))}
      </div>

      {/* Info Panel */}
      <div className={styles.infoPanel}>
        <AlertCircle size={14} />
        <span>{typeInfo[activeType]}</span>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><AlertCircle size={20} /></div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statTitle}>Total Data</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><CheckCircle2 size={20} /></div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{typeLabel}</div>
            <div className={styles.statTitle}>Aktif</div>
          </div>
        </div>
      </div>

      {/* Search & Add Button */}
      <div className={styles.searchBar}>
        <div className={styles.searchInput}>
          <Search size={16} />
          <input
            type="text"
            placeholder={`Cari ${typeLabel.toLowerCase()}...`}
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          />
          {search && <button className={styles.clearSearch} onClick={() => setSearch("")}><X size={14} /></button>}
        </div>
        <button className={styles.btnPrimary} onClick={handleAdd}>
          <Plus size={16} /> Tambah {typeLabel}
        </button>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        {paginatedData.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thNo}>#</th>
                <th>Nilai</th>
                <th className={styles.thActions}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item, idx) => (
                <tr key={idx}>
                  <td className={styles.tdNo}>{startIdx + idx + 1}</td>
                  <td className={styles.valueCell}>
                    {item}
                  </td>
                  <td className={styles.actionsCell}>
                    <div className={styles.actionGroup}>
                      <button onClick={() => handleEdit(item)} className={styles.actionBtn} title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => setModalDelete(item)} className={`${styles.actionBtn} ${styles.actionDanger}`} title="Hapus">
                        <Trash2 size={14} />
                      </button>
                    </div>
                   </td>
                 </tr>
              ))}
            </tbody>
           </table>
        ) : (
          <div className={styles.emptyState}>
            <AlertCircle size={40} />
            <p>Tidak ada data {typeLabel.toLowerCase()}</p>
            <button className={styles.btnOutline} onClick={handleAdd}>Tambah Data</button>
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
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) pageNum = i + 1;
              else if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;
              return (
                <button
                  key={pageNum}
                  className={`${styles.pageBtn} ${currentPage === pageNum ? styles.pageBtnActive : ""}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            <button className={styles.pageBtn} onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}><ChevronRight size={14} /></button>
            <button className={styles.pageBtn} onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>»</button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ModalAddEdit
        type={activeType}
        data={editingItem}
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingItem(null); }}
        onSave={handleSave}
      />
      <DeleteModal
        isOpen={!!modalDelete}
        onClose={() => setModalDelete(null)}
        onConfirm={() => handleDelete(modalDelete)}
        itemName={modalDelete}
      />
    </div>
  );
}