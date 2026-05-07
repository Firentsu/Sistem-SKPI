"use client";

import { useState, useEffect } from "react";
import { useMahasiswa } from "@/context/MahasiswaContext";
import { Eye, FileText, Search, Filter, X, CheckCircle, AlertCircle, Clock, Award } from "lucide-react";
import styles from "./riwayat.module.css";

// Mock data riwayat SKPI
const DEFAULT_RIWAYAT_SKPI = [
  {
    id: "SKP001",
    tanggal_pengajuan: "2025-03-15",
    status: "Diproses",
    tahap: "Menunggu verifikasi admin",
    riwayat_tahap: [
      { tahap: "Pengajuan", status: "Selesai", tanggal: "2025-03-15", catatan: "Pengajuan diterima sistem" },
      { tahap: "Verifikasi Admin", status: "Proses", tanggal: "2025-03-15", catatan: "Menunggu admin memverifikasi kelengkapan" },
    ],
  },
  {
    id: "SKP002",
    tanggal_pengajuan: "2024-12-10",
    status: "Selesai",
    tahap: "SKPI diterbitkan",
    riwayat_tahap: [
      { tahap: "Pengajuan", status: "Selesai", tanggal: "2024-12-10", catatan: "Pengajuan diterima" },
      { tahap: "Verifikasi Admin", status: "Selesai", tanggal: "2024-12-12", catatan: "Berkas lengkap" },
      { tahap: "Verifikasi Kaprodi", status: "Selesai", tanggal: "2024-12-14", catatan: "Disetujui Kaprodi" },
      { tahap: "Verifikasi Wakil Rektor", status: "Selesai", tanggal: "2024-12-16", catatan: "Disetujui, SKPI terbit" },
    ],
    file_skpi: "/skpi/SKP002.pdf",
  },
  {
    id: "SKP003",
    tanggal_pengajuan: "2024-08-20",
    status: "Ditolak",
    tahap: "Ditolak oleh Kaprodi",
    riwayat_tahap: [
      { tahap: "Pengajuan", status: "Selesai", tanggal: "2024-08-20", catatan: "Pengajuan diterima" },
      { tahap: "Verifikasi Admin", status: "Selesai", tanggal: "2024-08-22", catatan: "Berkas lengkap" },
      { tahap: "Verifikasi Kaprodi", status: "Ditolak", tanggal: "2024-08-25", catatan: "Poin ICP belum mencukupi" },
    ],
  },
];

export default function RiwayatPage() {
  const { prodiConfig } = useMahasiswa();
  const [riwayat, setRiwayat] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("skpi_riwayat");
    if (saved) {
      setRiwayat(JSON.parse(saved));
    } else {
      setRiwayat(DEFAULT_RIWAYAT_SKPI);
      localStorage.setItem("skpi_riwayat", JSON.stringify(DEFAULT_RIWAYAT_SKPI));
    }
    document.title = "Riwayat SKPI | Mahasiswa SKPI";
  }, []);

  const filtered = riwayat.filter(r => {
    const matchId = r.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "Semua" || r.status === filterStatus;
    return (matchId || search === "") && matchStatus;
  });

  const stats = {
    total: riwayat.length,
    diproses: riwayat.filter(r => r.status === "Diproses").length,
    selesai: riwayat.filter(r => r.status === "Selesai").length,
    ditolak: riwayat.filter(r => r.status === "Ditolak").length,
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  };

  const getStatusBadge = (status) => {
    const map = {
      Diproses: { class: styles.status_diproses, icon: <Clock size={12} /> },
      Selesai: { class: styles.status_selesai, icon: <CheckCircle size={12} /> },
      Ditolak: { class: styles.status_ditolak, icon: <AlertCircle size={12} /> },
    };
    const s = map[status] || map.Diproses;
    return (
      <span className={`${styles.statusBadge} ${s.class}`}>
        {s.icon} {status}
      </span>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Riwayat SKPI</h1>
          <p className={styles.subtitle}>Lacak status pengajuan dan persetujuan SKPI Anda</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard} style={{ borderLeftColor: prodiConfig.primary }}>
          <Award size={20} style={{ color: prodiConfig.primary }} />
          <div>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>Total Pengajuan</div>
          </div>
        </div>
        <div className={styles.statCard} style={{ borderLeftColor: "#3b82f6" }}>
          <Clock size={20} />
          <div>
            <div className={styles.statValue}>{stats.diproses}</div>
            <div className={styles.statLabel}>Diproses</div>
          </div>
        </div>
        <div className={styles.statCard} style={{ borderLeftColor: "#10b981" }}>
          <CheckCircle size={20} />
          <div>
            <div className={styles.statValue}>{stats.selesai}</div>
            <div className={styles.statLabel}>Selesai</div>
          </div>
        </div>
        <div className={styles.statCard} style={{ borderLeftColor: "#ef4444" }}>
          <AlertCircle size={20} />
          <div>
            <div className={styles.statValue}>{stats.ditolak}</div>
            <div className={styles.statLabel}>Ditolak</div>
          </div>
        </div>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.searchBox}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Cari berdasarkan nomor pengajuan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          <Filter size={16} />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="Semua">Semua Status</option>
            <option value="Diproses">Diproses</option>
            <option value="Selesai">Selesai</option>
            <option value="Ditolak">Ditolak</option>
          </select>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <FileText size={48} />
            <p>Tidak ada riwayat pengajuan SKPI</p>
            <span>Silakan ajukan SKPI melalui halaman Pengajuan</span>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>No. Pengajuan</th>
                <th>Tanggal Pengajuan</th>
                <th>Status</th>
                <th>Tahap Terakhir</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                <td><strong>{r.id}</strong></td>
                <td>{formatDate(r.tanggal_pengajuan)}</td>
                  <td>{getStatusBadge(r.status)}</td>
                <td>{r.tahap}</td>
                <td>
                  <button className={styles.detailBtn} onClick={() => setSelected(r)}>
                    <Eye size={14} /> Detail
                  </button>
                </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <div className={styles.modalOverlay} onClick={() => setSelected(null)}>
          <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Detail Pengajuan SKPI</h3>
              <button className={styles.modalClose} onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailRow}>
                <label>Nomor Pengajuan</label>
                <p><strong>{selected.id}</strong></p>
              </div>
              <div className={styles.detailRow}>
                <label>Tanggal Pengajuan</label>
                <p>{formatDate(selected.tanggal_pengajuan)}</p>
              </div>
              <div className={styles.detailRow}>
                <label>Status</label>
                <p>{getStatusBadge(selected.status)}</p>
              </div>
              <div className={styles.detailRow}>
                <label>Tahap Terakhir</label>
                <p>{selected.tahap}</p>
              </div>
              <div className={styles.detailRow}>
                <label>Riwayat Tahapan</label>
                <div className={styles.timeline}>
                  {selected.riwayat_tahap.map((step, idx) => (
                    <div key={idx} className={styles.timelineItem}>
                      <div className={`${styles.timelineDot} ${step.status === "Selesai" ? styles.dotSuccess : step.status === "Ditolak" ? styles.dotDanger : styles.dotProcess}`} />
                      <div className={styles.timelineContent}>
                        <div className={styles.timelineHeader}>
                          <span className={styles.timelineTitle}>{step.tahap}</span>
                          <span className={styles.timelineStatus}>{step.status}</span>
                        </div>
                        <div className={styles.timelineDate}>{formatDate(step.tanggal)}</div>
                        {step.catatan && <div className={styles.timelineNote}>{step.catatan}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {selected.status === "Selesai" && selected.file_skpi && (
                <div className={styles.detailRow}>
                  <label>File SKPI</label>
                  <a href={selected.file_skpi} download className={styles.downloadLink}>
                    Unduh SKPI
                  </a>
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