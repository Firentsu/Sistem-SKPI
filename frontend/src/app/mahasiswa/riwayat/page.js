"use client";

import { useState, useEffect, useCallback } from "react";
import { useMahasiswa } from "@/context/MahasiswaContext";
import { getPengajuanRiwayat } from "@/lib/api";
import {
  Eye, FileText, Search, Filter, X,
  CheckCircle, AlertCircle, Clock, Award, RefreshCw,
} from "lucide-react";
import styles from "./riwayat.module.css";

const STATUS_DISPLAY = {
  menunggu:  "Diproses",
  disetujui: "Selesai",
  ditolak:   "Ditolak",
};

export default function RiwayatPage() {
  const { prodiConfig } = useMahasiswa();
  const [riwayat, setRiwayat]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [selected, setSelected]         = useState(null);

  const loadRiwayat = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPengajuanRiwayat();
      setRiwayat(Array.isArray(data) ? data : []);
    } catch {
      setRiwayat([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Riwayat SKPI | Mahasiswa SKPI";
    loadRiwayat();
  }, [loadRiwayat]);

  const getDisplay = (row) => STATUS_DISPLAY[row.status_pengajuan] ?? row.status_pengajuan;

  const filtered = riwayat.filter(r => {
    const display = getDisplay(r);
    const idStr   = String(r.id_pengajuan);
    const matchSearch = idStr.includes(search) || search === "";
    const matchStatus = filterStatus === "Semua" || display === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total:    riwayat.length,
    diproses: riwayat.filter(r => r.status_pengajuan === "menunggu").length,
    selesai:  riwayat.filter(r => r.status_pengajuan === "disetujui").length,
    ditolak:  riwayat.filter(r => r.status_pengajuan === "ditolak").length,
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric",
    });
  };

  const getStatusBadge = (row) => {
    const display = getDisplay(row);
    const map = {
      Diproses: { cls: styles.status_diproses, icon: <Clock size={12} /> },
      Selesai:  { cls: styles.status_selesai,  icon: <CheckCircle size={12} /> },
      Ditolak:  { cls: styles.status_ditolak,  icon: <AlertCircle size={12} /> },
    };
    const s = map[display] ?? map.Diproses;
    return (
      <span className={`${styles.statusBadge} ${s.cls}`}>
        {s.icon} {display}
      </span>
    );
  };

  return (
    <div className={styles.container}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerBadge}>
            <FileText size={18} />
          </div>
          <div>
            <h1 className={styles.title}>Riwayat SKPI</h1>
            <p className={styles.subtitle}>Lacak status pengajuan dan persetujuan SKPI Anda</p>
          </div>
        </div>
        <button
          className={styles.refreshBtn}
          onClick={loadRiwayat}
          disabled={loading}
          title="Refresh"
        >
          <RefreshCw size={15} className={loading ? styles.spinIcon : ""} />
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statBrown}`}>
          <div className={`${styles.statAccent} ${styles.accentBrown}`} />
          <div className={`${styles.statIcon} ${styles.iconBrown}`}><Award size={18} /></div>
          <div className={styles.statBody}>
            <span className={styles.statValue}>{loading ? "—" : stats.total}</span>
            <span className={styles.statLabel}>Total Pengajuan</span>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statBlue}`}>
          <div className={`${styles.statAccent} ${styles.accentBlue}`} />
          <div className={`${styles.statIcon} ${styles.iconBlue}`}><Clock size={18} /></div>
          <div className={styles.statBody}>
            <span className={styles.statValue}>{loading ? "—" : stats.diproses}</span>
            <span className={styles.statLabel}>Diproses</span>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statGreen}`}>
          <div className={`${styles.statAccent} ${styles.accentGreen}`} />
          <div className={`${styles.statIcon} ${styles.iconGreen}`}><CheckCircle size={18} /></div>
          <div className={styles.statBody}>
            <span className={styles.statValue}>{loading ? "—" : stats.selesai}</span>
            <span className={styles.statLabel}>Selesai</span>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statRed}`}>
          <div className={`${styles.statAccent} ${styles.accentRed}`} />
          <div className={`${styles.statIcon} ${styles.iconRed}`}><AlertCircle size={18} /></div>
          <div className={styles.statBody}>
            <span className={styles.statValue}>{loading ? "—" : stats.ditolak}</span>
            <span className={styles.statLabel}>Ditolak</span>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className={styles.filterBar}>
        <div className={styles.searchBox}>
          <Search size={15} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Cari nomor pengajuan…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.clearBtn} onClick={() => setSearch("")}>
              <X size={13} />
            </button>
          )}
        </div>
        <div className={styles.filterGroup}>
          <Filter size={14} className={styles.filterIcon} />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="Semua">Semua Status</option>
            <option value="Diproses">Diproses</option>
            <option value="Selesai">Selesai</option>
            <option value="Ditolak">Ditolak</option>
          </select>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.emptyState}>
            <RefreshCw size={36} className={styles.spinIcon} />
            <p className={styles.emptyTitle}>Memuat riwayat…</p>
            <span className={styles.emptySubtitle}>Harap tunggu sebentar</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <FileText size={52} className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>
              {riwayat.length === 0
                ? "Belum ada riwayat pengajuan SKPI"
                : "Tidak ada yang sesuai filter"}
            </p>
            <span className={styles.emptySubtitle}>
              {riwayat.length === 0
                ? "Silakan ajukan SKPI melalui halaman Pengajuan"
                : "Coba ubah kata kunci atau filter"}
            </span>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>No. Pengajuan</th>
                  <th>Tanggal Pengajuan</th>
                  <th>Status</th>
                  <th>Catatan Admin</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id_pengajuan}>
                    <td><span className={styles.idCell}>#{r.id_pengajuan}</span></td>
                    <td>{formatDate(r.tanggal_pengajuan)}</td>
                    <td>{getStatusBadge(r)}</td>
                    <td className={styles.catatanCell}>
                      {r.catatan_admin || <span className={styles.naCell}>—</span>}
                    </td>
                    <td>
                      <button className={styles.detailBtn} onClick={() => setSelected(r)}>
                        <Eye size={13} /> Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {selected && (
        <div className={styles.modalOverlay} onClick={() => setSelected(null)}>
          <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleWrap}>
                <div className={styles.modalTitleIcon}><FileText size={16} /></div>
                <h3 className={styles.modalTitle}>
                  Detail Pengajuan #{selected.id_pengajuan}
                </h3>
              </div>
              <button className={styles.modalClose} onClick={() => setSelected(null)}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.infoGrid}>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Nomor Pengajuan</span>
                  <span className={styles.infoValue}>#{selected.id_pengajuan}</span>
                </div>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Tanggal Pengajuan</span>
                  <span className={styles.infoValue}>{formatDate(selected.tanggal_pengajuan)}</span>
                </div>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Status</span>
                  <span>{getStatusBadge(selected)}</span>
                </div>
              </div>

              {selected.catatan_admin && (
                <div className={styles.catatanBox}>
                  <AlertCircle size={15} className={styles.catatanBoxIcon} />
                  <div>
                    <p className={styles.catatanBoxLabel}>Catatan Admin</p>
                    <p className={styles.catatanBoxText}>{selected.catatan_admin}</p>
                  </div>
                </div>
              )}

              {getDisplay(selected) === "Selesai" && (
                <div className={styles.successBox}>
                  <CheckCircle size={15} className={styles.successBoxIcon} />
                  <div>
                    <p className={styles.successBoxLabel}>SKPI Telah Diterbitkan</p>
                    <p className={styles.successBoxText}>
                      SKPI tersedia untuk diunduh — lihat di menu Riwayat jika file sudah tersedia.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.closeBtn} onClick={() => setSelected(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
