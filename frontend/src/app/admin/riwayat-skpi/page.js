"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, Filter, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, X,
  Download, Eye, FileText, Calendar, User, BarChart3, Printer,
} from "lucide-react";
import styles from "./riwayat.module.css";
import { getSkpiList } from "@/lib/api";

/* ── Konfigurasi ──────────────────────────────────────── */
const PER_PAGE = 10;
const STATUS_COLORS = {
  resmi: "#047857",
  draft: "#b45309",
  diajukan: "#6d28d9",
};

/* ── Toast ────────────────────────────────────────────── */
function useToast() {
  const [toast, setToast] = useState(null);
  const show = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);
  const clear = useCallback(() => setToast(null), []);
  return { toast, show, clear };
}

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

/* ── Modal Detail SKPI ────────────────────────────────── */
function DetailModal({ idSkpi, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

  /* Ambil detail SKPI dari API (asumsikan ada endpoint /api/skpi/:id) */
  useEffect(() => {
    if (!idSkpi) return;
    let cancelled = false;
    const fetchDetail = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/api/skpi/${idSkpi}`, {
          credentials: "include",
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Gagal memuat detail" }));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!cancelled) setDetail(data);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDetail();
    return () => { cancelled = true; };
  }, [idSkpi]);

  if (!idSkpi) return null;

  /* Jika tidak ada endpoint detail, fallback tampilkan data terbatas */
  const display = detail || {};
  const statusColor = STATUS_COLORS[display.status] || "#6b7280";

  const handleDownloadPDF = async () => {
    if (!idSkpi) return;
    try {
      const res = await fetch(`${API_BASE}/api/skpi/download/${idSkpi}`, { credentials: "include" });
      if (!res.ok) throw new Error("Gagal mengunduh");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement("a"), {
        href: url,
        download: `SKPI_${display.nim || "unknown"}_${(display.nama_mahasiswa || "").replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
      });
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.message);
    }
  };

  const handlePreviewPDF = () => {
    window.open(`${API_BASE}/api/skpi/preview-pdf/${idSkpi}`, "_blank");
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}><Eye size={16} /> Detail SKPI</div>
          <button onClick={onClose} className={styles.modalClose}><X size={18} /></button>
        </div>
        <div className={styles.modalBody}>
          {loading && <p className={styles.loadingText}>Memuat data...</p>}
          {error && <p className={styles.errorText}><AlertCircle size={14} /> {error}</p>}
          {!loading && !error && detail && (
            <div className={styles.detailGrid}>
              <div><label>NIM</label><p>{display.nim}</p></div>
              <div><label>Nama Mahasiswa</label><p>{display.nama_mahasiswa || display.nama}</p></div>
              <div><label>Program Studi</label><p>{display.prodi || display.program_studi}</p></div>
              <div><label>Nomor SKPI</label><p>{display.nomor_skpi || "-"}</p></div>
              <div><label>Tanggal Generate</label><p>{display.tanggal_generate}</p></div>
              <div><label>Tanggal Terbit</label><p>{display.tanggal_terbit || "-"}</p></div>
              <div><label>Status</label>
                <p><span className={styles.badge} style={{ background: statusColor }}>{display.status}</span></p>
              </div>
              <div><label>Total Poin</label><p><strong>{display.total_poin || 0} poin</strong></p></div>
              {display.tempat_lahir && <div><label>Tempat Lahir</label><p>{display.tempat_lahir}</p></div>}
              {display.tgl_lahir && <div><label>Tanggal Lahir</label><p>{display.tgl_lahir}</p></div>}
              {display.nomor_ijazah && <div><label>Nomor Ijazah</label><p>{display.nomor_ijazah}</p></div>}
            </div>
          )}
          {!loading && !error && !detail && <p className={styles.loadingText}>Data tidak tersedia.</p>}

          <div className={styles.modalFooter}>
            <button className={styles.btnPrimary} onClick={handleDownloadPDF}><Download size={16} /> Download PDF</button>
            <button className={styles.btnOutline} onClick={handlePreviewPDF}><FileText size={16} /> Preview PDF</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Halaman Utama ───────────────────────────────────── */
export default function RiwayatSKPIPage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterProdi, setFilterProdi] = useState("Semua");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const { toast, show, clear } = useToast();

  /* ── Fetch data dari backend ── */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSkpiList({ q: search, status: filterStatus, prodi: filterProdi, page });
      if (res) {
        setRows(res.rows || []);
        setTotal(res.total || 0);
        setTotalPages(Math.ceil((res.total || 0) / PER_PAGE));
      }
    } catch {
      setRows([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterProdi, page]);

  useEffect(() => {
    document.title = "Riwayat SKPI | Admin";
    loadData();
  }, [loadData]);

  /* ── Reset halaman saat filter/search berubah ── */
  useEffect(() => {
    setPage(1);
    loadData();
  }, [search, filterStatus, filterProdi]);

  /* ── Statistik ── */
  const totalTerbit = rows.filter(r => r.status === "resmi").length;
  const totalRevisi = rows.filter(r => r.status === "draft").length;
  const avgPoin = rows.length ? Math.round(rows.reduce((s, r) => s + (r.total_poin || 0), 0) / rows.length) : 0;

  const safePage = Math.min(page, totalPages);
  const startRow = (safePage - 1) * PER_PAGE + 1;
  const endRow = Math.min(safePage * PER_PAGE, total);

  return (
    <div className={styles.container}>
      <Toast toast={toast} onClose={clear} />

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Riwayat SKPI</h1>
          <p className={styles.subtitle}>Kelola dan pantau penerbitan SKPI mahasiswa</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FileText size={20} /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{total}</div>
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
            <div className={styles.statLabel}>Draft / Revisi</div>
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

      {/* Search & Filter Bar */}
      <div className={styles.searchBar}>
        <div className={styles.searchInput}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Cari NIM atau nama mahasiswa..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className={styles.clearSearch} onClick={() => setSearch("")}><X size={14} /></button>}
        </div>
        <div className={styles.filterActions}>
          <div className={styles.filterGroup}>
            <Filter size={14} />
            <select
              className={styles.filterSelect}
              value={filterProdi}
              onChange={e => setFilterProdi(e.target.value)}
            >
              <option value="Semua">Semua Prodi</option>
              {/* Daftar prodi diisi dari data? Sementara statis */}
              <option value="Teknologi Informasi">Teknologi Informasi</option>
              <option value="Sistem Informasi">Sistem Informasi</option>
              <option value="Manajemen">Manajemen</option>
              <option value="Kewirausahaan">Kewirausahaan</option>
              <option value="Pendidikan Guru Sekolah Dasar">PGSD</option>
              <option value="Agroekoteknologi">Agroekoteknologi</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <select
              className={styles.filterSelect}
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="Semua">Semua Status</option>
              <option value="draft">Draft</option>
              <option value="resmi">Terbit</option>
              <option value="diajukan">Diajukan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabel */}
      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.emptyState}>
            <FileText size={40} />
            <p>Memuat data...</p>
          </div>
        ) : rows.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>No</th>
                <th>NIM</th>
                <th>Nama Mahasiswa</th>
                <th>Program Studi</th>
                <th>Tanggal Generate</th>
                <th>Total Poin</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item, idx) => (
                <tr key={item.id_skpi || item.id_mahasiswa}>
                  <td>{startRow + idx}</td>
                  <td><code className={styles.code}>{item.nim}</code></td>
                  <td><strong>{item.nama_mahasiswa || item.nama}</strong></td>
                  <td>{item.prodi || item.program_studi}</td>
                  <td><div className={styles.dateCell}><Calendar size={12} /> {item.tanggal_generate}</div></td>
                  <td><strong className={styles.poinValue}>{item.total_poin || 0}</strong></td>
                  <td>
                    <span className={styles.badge} style={{ background: STATUS_COLORS[item.status] || "#6b7280" }}>
                      {item.status === "resmi" ? "Terbit" : item.status === "draft" ? "Draft" : item.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionGroup}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => setSelectedId(item.id_skpi || item.id_mahasiswa)}
                        title="Detail"
                      ><Eye size={14} /></button>
                      <button
                        className={styles.actionBtn}
                        onClick={async () => {
                          try {
                            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/skpi/download/${item.id_skpi}`, { credentials: "include" });
                            if (!res.ok) throw new Error("Gagal");
                            const blob = await res.blob();
                            const url = URL.createObjectURL(blob);
                            const a = Object.assign(document.createElement("a"), {
                              href: url,
                              download: `SKPI_${item.nim}_${(item.nama_mahasiswa || "").replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
                            });
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          } catch {
                            show("Gagal mengunduh", "error");
                          }
                        }}
                        title="Download PDF"
                      ><Download size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={styles.emptyState}>
            <FileText size={40} />
            <p>Tidak ada riwayat SKPI yang sesuai</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>Menampilkan {startRow}–{endRow} dari {total}</span>
          <div className={styles.paginationControls}>
            <button className={styles.pageBtn} onClick={() => setPage(1)} disabled={safePage === 1}>«</button>
            <button className={styles.pageBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .reduce((acc, p, i, arr) => {
                if (i > 0 && arr[i - 1] !== p - 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`dots-${i}`} className={styles.pageDots}>…</span>
                ) : (
                  <button
                    key={p}
                    className={`${styles.pageBtn} ${safePage === p ? styles.pageBtnActive : ""}`}
                    onClick={() => setPage(p)}
                  >{p}</button>
                )
              )
            }
            <button className={styles.pageBtn} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>
              <ChevronRight size={14} />
            </button>
            <button className={styles.pageBtn} onClick={() => setPage(totalPages)} disabled={safePage === totalPages}>»</button>
          </div>
        </div>
      )}

      {/* Modal Detail */}
      <DetailModal
        idSkpi={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}