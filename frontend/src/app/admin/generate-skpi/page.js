// frontend/src/app/admin/generate-skpi/page.js
"use client";

import { useState, useEffect } from "react";
import {
  Search, Filter, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, X,
  Download, Eye, FileText, Loader2, Zap, Users, Award, TrendingUp, Edit2, Save
} from "lucide-react";
import styles from "./page.module.css";
import { TEMPLATE_SECTIONS } from "../../../lib/template-sections";

// Helper: ambil section aktif dan urutkan
const getActiveSections = () => {
  return TEMPLATE_SECTIONS.filter(s => s.enabled).sort((a, b) => a.order - b.order);
};

// Fungsi render konten per section (dengan data yang bisa diedit)
const renderSectionContent = (section, mahasiswa, isEditing, onEditField) => {
  switch (section.key) {
    case "identitas":
      return (
        <div className={styles.sectionContent}>
          <div className={styles.editRow}>
            <strong>Nama:</strong>
            {isEditing ? (
              <input type="text" value={mahasiswa.nama} onChange={(e) => onEditField("nama", e.target.value)} className={styles.editInput} />
            ) : (
              <span> {mahasiswa.nama}</span>
            )}
          </div>
          <div className={styles.editRow}>
            <strong>NIM:</strong>
            {isEditing ? (
              <input type="text" value={mahasiswa.nim} onChange={(e) => onEditField("nim", e.target.value)} className={styles.editInput} />
            ) : (
              <span> {mahasiswa.nim}</span>
            )}
          </div>
          <div className={styles.editRow}>
            <strong>Program Studi:</strong>
            {isEditing ? (
              <input type="text" value={mahasiswa.prodi} onChange={(e) => onEditField("prodi", e.target.value)} className={styles.editInput} />
            ) : (
              <span> {mahasiswa.prodi}</span>
            )}
          </div>
          <div className={styles.editRow}>
            <strong>Tempat, Tanggal Lahir:</strong>
            {isEditing ? (
              <input type="text" value={mahasiswa.tempat_lahir || "Jakarta, 1 Januari 2000"} onChange={(e) => onEditField("tempat_lahir", e.target.value)} className={styles.editInput} />
            ) : (
              <span> {mahasiswa.tempat_lahir || "Jakarta, 1 Januari 2000"}</span>
            )}
          </div>
          <div className={styles.editRow}>
            <strong>Gelar:</strong>
            {isEditing ? (
              <input type="text" value={mahasiswa.gelar || "S.Kom."} onChange={(e) => onEditField("gelar", e.target.value)} className={styles.editInput} />
            ) : (
              <span> {mahasiswa.gelar || "S.Kom."}</span>
            )}
          </div>
        </div>
      );
    case "poin_integritas":
      return (
        <div>
          <div className={styles.editRow}>
            <strong>Total ICP:</strong>
            {isEditing ? (
              <input type="number" value={mahasiswa.total_poin} onChange={(e) => onEditField("total_poin", parseInt(e.target.value))} className={styles.editInput} />
            ) : (
              <span> {mahasiswa.total_poin} poin</span>
            )}
          </div>
          <p><strong>Kriteria:</strong> {mahasiswa.total_poin >= 150 ? "Silver" : mahasiswa.total_poin >= 100 ? "Bronze" : "Perlu ditingkatkan"}</p>
        </div>
      );
    default:
      return renderSectionContentDefault(section, mahasiswa);
  }
};

const renderSectionContentDefault = (section, mahasiswa) => {
  switch (section.key) {
    case "institusi":
      return (
        <div className={styles.sectionContent}>
          <p><strong>Nama PT:</strong> Institut Shanti Bhuana</p>
          <p><strong>Akreditasi:</strong> B</p>
          <p><strong>Jenjang:</strong> Sarjana (S1)</p>
          <p><strong>Bahasa Pengantar:</strong> Indonesia & Inggris</p>
        </div>
      );
    case "capaian_sikap":
      return (
        <ul>
          <li>Bertakwa kepada Tuhan Yang Maha Esa</li>
          <li>Menjunjung tinggi nilai kemanusiaan</li>
          <li>Berkontribusi dalam peningkatan mutu kehidupan</li>
        </ul>
      );
    case "capaian_pengetahuan":
      return (
        <ul>
          <li>Mampu menganalisis dan mendesain secara profesional</li>
          <li>Pengetahuan dalam algoritma pemrograman</li>
          <li>Menguasai konsep dasar computing</li>
        </ul>
      );
    case "keterampilan_umum":
      return (
        <ul>
          <li>Pemikiran logis, kritis, sistematis</li>
          <li>Kinerja mandiri, bermutu, terukur</li>
          <li>Keputusan tepat berdasarkan analisis</li>
        </ul>
      );
    case "keterampilan_khusus":
      return (
        <ul>
          <li>Merancang algoritma keamanan jaringan</li>
          <li>Mengelola informasi melalui jaringan komputer</li>
          <li>Menguji aplikasi berbasis komputer</li>
        </ul>
      );
    case "aktivitas_prestasi":
      return (
        <div>
          <p><strong>Aktivitas:</strong> Workshop, Seminar, Magang</p>
          <p><strong>Prestasi:</strong> Juara 2 Lomba Aplikasi</p>
        </div>
      );
    case "kkni":
      return <p>Kerangka Kualifikasi Nasional Indonesia (KKNI) level 6 (Sarjana)</p>;
    case "pengesahan":
      return (
        <div>
          <p>Bengkayang, {new Date().toLocaleDateString("id-ID")}</p>
          <p>Wakil Rektor I Institut Shanti Bhuana</p>
          <p>Dr. Helena Anggraeni (Reni) Tondro Sugianto, S.T., M.T.</p>
        </div>
      );
    default:
      return <p>Konten belum tersedia</p>;
  }
};

// Mock data mahasiswa
const MOCK_MAHASISWA = [
  { id: 1, nim: "2021001001", nama: "Ahmad Rizki", prodi: "Teknik Informatika", total_aktivitas: 25, total_poin: 125, status: "Siap", tempat_lahir: "Jakarta, 1 Januari 2000", gelar: "S.Kom." },
  { id: 2, nim: "2021002001", nama: "Budi Santoso", prodi: "Manajemen", total_aktivitas: 18, total_poin: 98, status: "Siap", tempat_lahir: "Bandung, 15 Mei 2001", gelar: "S.M." },
  { id: 3, nim: "2021001002", nama: "Citra Dewi", prodi: "Teknik Informatika", total_aktivitas: 20, total_poin: 115, status: "Siap", tempat_lahir: "Surabaya, 20 Maret 2000", gelar: "S.Kom." },
  { id: 4, nim: "2021003001", nama: "Dedi Wijaya", prodi: "Akuntansi", total_aktivitas: 15, total_poin: 88, status: "Kurang", tempat_lahir: "Medan, 10 Agustus 2000", gelar: "S.Ak." },
  { id: 5, nim: "2021004001", nama: "Eka Putri", prodi: "Ilmu Komunikasi", total_aktivitas: 10, total_poin: 75, status: "Kurang", tempat_lahir: "Semarang, 5 Desember 2001", gelar: "S.I.Kom." },
  { id: 6, nim: "2021005001", nama: "Fajar Rahman", prodi: "Sistem Informasi", total_aktivitas: 28, total_poin: 142, status: "Siap", tempat_lahir: "Makassar, 25 Juli 2000", gelar: "S.Kom." },
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
      <button className={styles.toastClose} onClick={onClose}><X size={14} /></button>
    </div>
  );
}

// Preview Modal dengan Edit
function PreviewModal({ item, isOpen, onClose, onDownload, onUpdate }) {
  const activeSections = getActiveSections();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(null);

  useEffect(() => {
    if (item) {
      setEditedData(item);
      setIsEditing(false);
    }
  }, [item]);

  // Jangan render modal jika tidak terbuka atau data belum siap
  if (!isOpen || !item || !editedData) return null;

  const handleEditField = (field, value) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = () => {
    onUpdate(editedData);
    setIsEditing(false);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Preview SKPI - {editedData.nama}</h3>
          <div className={styles.modalHeaderActions}>
            {isEditing ? (
              <button onClick={handleSaveEdit} className={styles.iconBtn} title="Simpan Perubahan">
                <Save size={18} />
              </button>
            ) : (
              <button onClick={() => setIsEditing(true)} className={styles.iconBtn} title="Edit Data">
                <Edit2 size={18} />
              </button>
            )}
            <button onClick={onClose} className={styles.modalClose}><X size={20} /></button>
          </div>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.previewCard}>
            <div className={styles.previewHeader}>
              <h4>SURAT KETERANGAN PENCAPAIAN KOMPETENSI (SKPI)</h4>
              <p>Institut Shanti Bhuana</p>
            </div>
            <div className={styles.previewContent}>
              {activeSections.map((section) => (
                <div key={section.id} className={styles.previewSection}>
                  <h5>{section.titleID} / {section.titleEN}</h5>
                  {renderSectionContent(section, editedData, isEditing, handleEditField)}
                  <hr className={styles.divider} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.btnSecondary} onClick={onClose}>Tutup</button>
          <button 
            onClick={() => onDownload(editedData)} 
            className={`${styles.btnPrimary} ${styles.btnWithIcon}`}
            disabled={editedData.status !== "Siap"}
          >
            <Download size={18} />
            Unduh SKPI
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GenerateSkpiPage() {
  useEffect(() => {
    document.title = "Generate SKPI | Admin Panel";
  }, []);

  const [mahasiswa, setMahasiswa] = useState(MOCK_MAHASISWA);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterProdi, setFilterProdi] = useState("Semua");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const itemsPerPage = 5;

  const prodiList = ["Semua", ...new Set(mahasiswa.map((m) => m.prodi))];

  const filtered = mahasiswa.filter((item) => {
    const matchSearch = item.nim.includes(search) || item.nama.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "Semua" || item.status === filterStatus;
    const matchProdi = filterProdi === "Semua" || item.prodi === filterProdi;
    return matchSearch && matchStatus && matchProdi;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const selectedReady = selectedIds.filter(id => {
    const m = mahasiswa.find(m => m.id === id);
    return m && m.status === "Siap";
  }).length;

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handlePreview = (item) => {
    setSelectedItem(item);
    setPreviewOpen(true);
  };

  const handleUpdateMahasiswa = (updatedData) => {
    setMahasiswa(prev => prev.map(m => m.id === updatedData.id ? updatedData : m));
    setSelectedItem(updatedData);
    showToast(`Data ${updatedData.nama} berhasil diperbarui`, "success");
  };

  const handleDownload = async (item) => {
    if (item.status !== "Siap") {
      showToast("Mahasiswa belum memenuhi syarat untuk generate SKPI", "error");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      showToast(`SKPI untuk ${item.nama} berhasil diunduh!`);
      setLoading(false);
      setPreviewOpen(false);
      const link = document.createElement('a');
      link.href = `#`;
      link.download = `SKPI_${item.nim}_${item.nama}.pdf`;
      link.click();
    }, 1000);
  };

  const handleBulkGenerate = async () => {
    if (selectedReady === 0) {
      showToast("Pilih minimal satu mahasiswa dengan status 'Siap' untuk digenerate", "error");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      showToast(`${selectedReady} SKPI berhasil digenerate dan diunduh (simulasi)!`);
      setLoading(false);
    }, 2000);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedData.length && paginatedData.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedData.map(m => m.id));
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const totalSiap = mahasiswa.filter((m) => m.status === "Siap").length;
  const totalKurang = mahasiswa.filter((m) => m.status === "Kurang").length;
  const rataPoin = Math.round(mahasiswa.reduce((sum, m) => sum + m.total_poin, 0) / mahasiswa.length);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Generate & Penerbitan SKPI</h1>
          <p className={styles.subtitle}>Buat SKPI berdasarkan template yang telah ditentukan (bilingual, urutan dinamis)</p>
        </div>
        <button 
          onClick={handleBulkGenerate} 
          disabled={loading || selectedReady === 0}
          className={`${styles.btnPrimary} ${styles.btnLg} ${styles.btnWithIcon}`}
        >
          {loading ? <Loader2 size={18} className={styles.spin} /> : <Zap size={18} />}
          {loading ? "Sedang Memproses..." : `Generate Terpilih (${selectedReady})`}
        </button>
      </div>

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
            {prodiList.map((p) => <option key={p}>{p}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}>
            <option value="Semua">Semua Status</option>
            <option value="Siap">Siap Generate</option>
            <option value="Kurang">Poin Kurang</option>
          </select>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        {paginatedData.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thCheckbox}>
                  <input type="checkbox" checked={selectedIds.length === paginatedData.length && paginatedData.length > 0} onChange={toggleSelectAll} />
                </th>
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
                  <td className={styles.tdCheckbox}>
                    <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} />
                  </td>
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
                      <button onClick={() => handlePreview(item)} className={styles.actionBtn} title="Preview & Edit">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => handleDownload(item)} className={styles.actionBtn} title="Download" disabled={item.status !== "Siap"}>
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

      <PreviewModal
        item={selectedItem}
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        onDownload={handleDownload}
        onUpdate={handleUpdateMahasiswa}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}