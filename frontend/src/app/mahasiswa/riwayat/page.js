"use client";

import { useState, useEffect } from "react";
import { useMahasiswa } from "@/context/MahasiswaContext";
import { Eye, FileText, Search, Filter, X, CheckCircle, AlertCircle, Clock } from "lucide-react";
import styles from "./riwayat.module.css";

// Mock data riwayat (nanti dari API)
const MOCK_RIWAYAT = [
  { id: 1, nama_id: "Workshop React", nama_en: "React Workshop", jenis: "Workshop", kategori: "Akademik", kelompok: "Akademik", level: "Nasional", tanggal: "2026-03-20", poin: 15, status: "Disetujui", catatan: "-", bukti: "/mock/bukti1.pdf" },
  { id: 2, nama_id: "Seminar AI", nama_en: "AI Seminar", jenis: "Seminar", kategori: "Non-Akademik", kelompok: "Non-Akademik", level: "Internasional", tanggal: "2026-03-25", poin: 10, status: "Ditolak", catatan: "Bukti kurang jelas", bukti: null },
  { id: 3, nama_id: "Magang Startup", nama_en: "Startup Internship", jenis: "Magang", kategori: "Profesional", kelompok: "Profesional", level: "Lokal", tanggal: "2026-03-10", poin: 20, status: "Revisi", catatan: "Lengkapi surat keterangan", bukti: "/mock/bukti3.pdf" },
  { id: 4, nama_id: "Pelatihan Kepemimpinan", nama_en: "Leadership Training", jenis: "Pelatihan", kategori: "Pengembangan Diri", kelompok: "Kepemimpinan", level: "Internal", tanggal: "2026-02-15", poin: 12, status: "Menunggu", catatan: "-", bukti: null },
];

const STATUS_COLORS = {
  Disetujui: "#10b981",
  Ditolak: "#ef4444",
  Revisi: "#f59e0b",
  Menunggu: "#3b82f6",
};

export default function RiwayatPage() {
  const { prodiConfig } = useMahasiswa();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [selected, setSelected] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    document.title = "Riwayat Kegiatan | Mahasiswa SKPI";
  }, []);

  const filtered = MOCK_RIWAYAT.filter(r => {
    const matchSearch = r.nama_id.toLowerCase().includes(search.toLowerCase()) || r.nama_en.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "Semua" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: MOCK_RIWAYAT.length,
    disetujui: MOCK_RIWAYAT.filter(r => r.status === "Disetujui").length,
    ditolak: MOCK_RIWAYAT.filter(r => r.status === "Ditolak").length,
    revisi: MOCK_RIWAYAT.filter(r => r.status === "Revisi").length,
    menunggu: MOCK_RIWAYAT.filter(r => r.status === "Menunggu").length,
  };

  const handleViewDetail = (item) => {
    setSelected(item);
    // Simulasi preview bukti jika ada
    if (item.bukti) {
      // Untuk mock, bisa set previewUrl ke path gambar atau PDF viewer
      setPreviewUrl(item.bukti);
    } else {
      setPreviewUrl(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Riwayat Kegiatan</h1>
          <p className={styles.subtitle}>Semua kegiatan yang pernah Anda ajukan beserta statusnya</p>
        </div>
      </div>

      {/* Statistik */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard} style={{ borderLeftColor: "#10b981" }}>
          <CheckCircle size={20} />
          <div>
            <div className={styles.statValue}>{stats.disetujui}</div>
            <div className={styles.statLabel}>Disetujui</div>
          </div>
        </div>
        <div className={styles.statCard} style={{ borderLeftColor: "#ef4444" }}>
          <AlertCircle size={20} />
          <div>
            <div className={styles.statValue}>{stats.ditolak}</div>
            <div className={styles.statLabel}>Ditolak</div>
          </div>
        </div>
        <div className={styles.statCard} style={{ borderLeftColor: "#f59e0b" }}>
          <Clock size={20} />
          <div>
            <div className={styles.statValue}>{stats.revisi}</div>
            <div className={styles.statLabel}>Revisi</div>
          </div>
        </div>
        <div className={styles.statCard} style={{ borderLeftColor: "#3b82f6" }}>
          <FileText size={20} />
          <div>
            <div className={styles.statValue}>{stats.menunggu}</div>
            <div className={styles.statLabel}>Menunggu</div>
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className={styles.filterBar}>
        <div className={styles.searchBox}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Cari kegiatan (Indonesia/Inggris)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          <Filter size={16} />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="Semua">Semua Status</option>
            <option value="Disetujui">Disetujui</option>
            <option value="Ditolak">Ditolak</option>
            <option value="Revisi">Revisi</option>
            <option value="Menunggu">Menunggu</option>
          </select>
        </div>
      </div>

      {/* Tabel */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nama Kegiatan (ID/EN)</th>
              <th>Jenis</th>
              <th>Tanggal</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id}>
                <td>
                  <div className={styles.namaCell}>
                    <strong>{r.nama_id}</strong>
                    <small>{r.nama_en}</small>
                  </div>
                </td>
                <td>{r.jenis}</td>
                <td>{r.tanggal}</td>
                <td>{r.poin}</td>
                <td>
                  <span className={`${styles.statusBadge} ${styles[r.status.toLowerCase()]}`}>
                    {r.status}
                  </span>
                </td>
                <td>
                  <button className={styles.detailBtn} onClick={() => handleViewDetail(r)}>
                    <Eye size={14} /> Detail
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="6" className={styles.emptyRow}>Tidak ada kegiatan yang sesuai</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Detail */}
      {selected && (
        <div className={styles.modalOverlay} onClick={() => setSelected(null)}>
          <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Detail Kegiatan</h3>
              <button className={styles.modalClose} onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailRow}>
                <label>Nama (Indonesia)</label>
                <p>{selected.nama_id}</p>
              </div>
              <div className={styles.detailRow}>
                <label>Nama (English)</label>
                <p>{selected.nama_en}</p>
              </div>
              <div className={styles.detailRow}>
                <label>Jenis Aktivitas</label>
                <p>{selected.jenis}</p>
              </div>
              <div className={styles.detailRow}>
                <label>Kategori</label>
                <p>{selected.kategori}</p>
              </div>
              <div className={styles.detailRow}>
                <label>Kelompok</label>
                <p>{selected.kelompok}</p>
              </div>
              <div className={styles.detailRow}>
                <label>Level</label>
                <p>{selected.level}</p>
              </div>
              <div className={styles.detailRow}>
                <label>Tanggal</label>
                <p>{selected.tanggal}</p>
              </div>
              <div className={styles.detailRow}>
                <label>Status</label>
                <p>
                  <span className={`${styles.statusBadge} ${styles[selected.status.toLowerCase()]}`}>
                    {selected.status}
                  </span>
                </p>
              </div>
              {selected.catatan && selected.catatan !== "-" && (
                <div className={styles.detailRow}>
                  <label>Catatan</label>
                  <p className={styles.catatanText}>{selected.catatan}</p>
                </div>
              )}
              {selected.bukti && (
                <div className={styles.detailRow}>
                  <label>Bukti Kegiatan</label>
                  <div className={styles.buktiPreview}>
                    {previewUrl && (previewUrl.endsWith('.pdf') ? (
                      <a href={previewUrl} target="_blank" rel="noopener noreferrer" className={styles.pdfLink}>Lihat PDF</a>
                    ) : (
                      <img src={previewUrl} alt="Bukti" className={styles.previewImage} />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.closeBtn} onClick={() => setSelected(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}