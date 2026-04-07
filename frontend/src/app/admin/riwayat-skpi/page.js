"use client";

import { useState } from "react";
import {
  Search, Filter, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, X,
  Download, Eye, FileText, Calendar, User, BarChart3, Printer,
} from "lucide-react";
import styles from "./riwayat.module.css";

// Mock data untuk riwayat SKPI
const MOCK_RIWAYAT_SKPI = [
  { id: 1, nim: "2021001001", nama: "Ahmad Rizki", prodi: "Teknik Informatika", tanggal_generate: "2026-03-15", status: "Terbit", total_poin: 125, file: "SKPI_2021001001_2026-03-15.pdf" },
  { id: 2, nim: "2021002001", nama: "Budi Santoso", prodi: "Manajemen", tanggal_generate: "2026-03-14", status: "Terbit", total_poin: 98, file: "SKPI_2021002001_2026-03-14.pdf" },
  { id: 3, nim: "2021001002", nama: "Citra Dewi", prodi: "Teknik Informatika", tanggal_generate: "2026-03-13", status: "Revisi", total_poin: 115, file: "SKPI_2021001002_2026-03-13.pdf" },
  { id: 4, nim: "2021003001", nama: "Dedi Wijaya", prodi: "Akuntansi", tanggal_generate: "2026-03-12", status: "Terbit", total_poin: 88, file: "SKPI_2021003001_2026-03-12.pdf" },
  { id: 5, nim: "2021004001", nama: "Eka Putri", prodi: "Ilmu Komunikasi", tanggal_generate: "2026-03-11", status: "Draft", total_poin: 75, file: "SKPI_2021004001_2026-03-11.pdf" },
  { id: 6, nim: "2021005001", nama: "Fajar Rahman", prodi: "Sistem Informasi", tanggal_generate: "2026-03-10", status: "Terbit", total_poin: 142, file: "SKPI_2021005001_2026-03-10.pdf" },
  { id: 7, nim: "2021001003", nama: "Gina Marsha", prodi: "Teknik Informatika", tanggal_generate: "2026-03-09", status: "Revisi", total_poin: 105, file: "SKPI_2021001003_2026-03-09.pdf" },
  { id: 8, nim: "2021002002", nama: "Hendra Kusuma", prodi: "Manajemen", tanggal_generate: "2026-03-08", status: "Terbit", total_poin: 92, file: "SKPI_2021002002_2026-03-08.pdf" },
];

const STATUS_COLORS = {
  Terbit: "#047857",
  Revisi: "#b45309",
  Draft: "#6d28d9",
  Menunggu: "#ec4899",
};

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

function DetailModal({ item, isOpen, onClose }) {
  if (!isOpen || !item) return null;
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}><Eye size={16} /> Detail SKPI</div>
          <button onClick={onClose} className={styles.modalClose}><X size={18} /></button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.detailGrid}>
            <div><label>NIM</label><p>{item.nim}</p></div>
            <div><label>Nama Mahasiswa</label><p>{item.nama}</p></div>
            <div><label>Program Studi</label><p>{item.prodi}</p></div>
            <div><label>Tanggal Generate</label><p>{item.tanggal_generate}</p></div>
            <div><label>Status</label><p><span className={styles.badge} style={{ background: STATUS_COLORS[item.status] }}>{item.status}</span></p></div>
            <div><label>Total Poin</label><p><strong>{item.total_poin} poin</strong></p></div>
          </div>
          <div className={styles.modalFooter}>
            <button className={styles.btnPrimary} onClick={() => alert(`Download: ${item.file}`)}>
              <Download size={16} /> Download PDF
            </button>
            <button className={styles.btnOutline} onClick={() => alert(`Print: ${item.file}`)}>
              <Printer size={16} /> Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RiwayatSKPIPage() {
  const [data] = useState(MOCK_RIWAYAT_SKPI);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterProdi, setFilterProdi] = useState("Semua");
  const [toast, setToast] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const prodiList = ["Semua", ...new Set(data.map(d => d.prodi))];
  const statusList = ["Semua", ...new Set(data.map(d => d.status))];

  const filtered = data.filter(item => {
    const matchSearch = !search || item.nim.includes(search) || item.nama.toLowerCase().includes(search.toLowerCase());
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

  const handleDetail = (item) => { setSelectedDetail(item); setDetailOpen(true); };
  const handleDownload = (item) => showToast(`Mengunduh ${item.file}...`);

  const totalTerbit = data.filter(d => d.status === "Terbit").length;
  const totalRevisi = data.filter(d => d.status === "Revisi").length;
  const avgPoin = Math.round(data.reduce((sum, d) => sum + d.total_poin, 0) / data.length);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Riwayat SKPI</h1>
          <p className={styles.subtitle}>Kelola dan pantau penerbitan SKPI mahasiswa</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FileText size={20} /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{data.length}</div>
            <div className={styles.statLabel}>Total SKPI</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><CheckCircle2 size={20} /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{totalTerbit}</div>
            <div className={styles.statLabel}>Sudah Terbit</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><AlertCircle size={20} /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{totalRevisi}</div>
            <div className={styles.statLabel}>Perlu Revisi</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><BarChart3 size={20} /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{avgPoin}</div>
            <div className={styles.statLabel}>Rata-rata Poin</div>
          </div>
        </div>
      </div>

      <div className={styles.searchBar}>
        <div className={styles.searchInput}>
          <Search size={16} />
          <input type="text" placeholder="Cari NIM atau nama mahasiswa..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} />
          {search && <button className={styles.clearSearch} onClick={() => setSearch("")}><X size={14} /></button>}
        </div>
        <div className={styles.filterActions}>
          <div className={styles.filterGroup}>
            <Filter size={14} />
            <select className={styles.filterSelect} value={filterProdi} onChange={e => { setFilterProdi(e.target.value); setCurrentPage(1); }}>
              {prodiList.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <select className={styles.filterSelect} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}>
              {statusList.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        {paginatedData.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr><th>NIM</th><th>Nama Mahasiswa</th><th>Program Studi</th><th>Tanggal</th><th>Total Poin</th><th>Status</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {paginatedData.map(item => (
                <tr key={item.id}>
                  <td><code className={styles.code}>{item.nim}</code></td>
                  <td><strong>{item.nama}</strong></td>
                  <td>{item.prodi}</td>
                  <td><div className={styles.dateCell}><Calendar size={12} /> {item.tanggal_generate}</div></td>
                  <td><strong className={styles.poinValue}>{item.total_poin}</strong></td>
                  <td><span className={styles.badge} style={{ background: STATUS_COLORS[item.status] }}>{item.status}</span></td>
                  <td>
                    <div className={styles.actionGroup}>
                      <button className={styles.actionBtn} onClick={() => handleDetail(item)} title="Detail"><Eye size={14} /></button>
                      <button className={styles.actionBtn} onClick={() => handleDownload(item)} title="Download"><Download size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={styles.emptyState}>
            <FileText size={40} />
            <p>Tidak ada riwayat SKPI yang sesuai dengan filter Anda</p>
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

      <DetailModal item={selectedDetail} isOpen={detailOpen} onClose={() => setDetailOpen(false)} />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}