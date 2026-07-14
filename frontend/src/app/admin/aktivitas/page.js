"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Activity, Search, Filter, Eye, Loader2, ChevronLeft, ChevronRight,
  AlertCircle, CheckCircle2, X, Clock, FileCheck, XCircle, RefreshCw,
  RotateCcw, Paperclip, User, Calendar, MapPin, Tag, Building2,
  ChevronDown, Download, Image as ImageIcon, FileText, SlidersHorizontal,
} from "lucide-react";
import { getAktivitasList, verifikasiAktivitas, getUploadUrl } from "@/lib/api";
import styles from "./aktivitas.module.css";
import AktivitasStatusChart from "@/components/AktivitasStatusChart";

/* ── KONSTANTA ── */
const STATUS_CFG = {
  diproses:  { label: "Diproses",  color: "#f59e0b", bg: "#fef3c7", icon: Clock,       border: "#fde68a" },
  disetujui: { label: "Disetujui", color: "#16a34a", bg: "#dcfce7", icon: FileCheck,   border: "#86efac" },
  ditolak:   { label: "Ditolak",   color: "#dc2626", bg: "#fee2e2", icon: XCircle,     border: "#fca5a5" },
  revisi:    { label: "Revisi",    color: "#7c3aed", bg: "#ede9fe", icon: RotateCcw,   border: "#c4b5fd" },
};

// Label Kategori SKPI (9 kategori)
const SKPI_LABELS = {
  prestasi: "1. Prestasi dan Penghargaan",
  keterampilan: "2. Peningkatan Keterampilan Profesional",
  organisasi: "3. Pengalaman Berorganisasi & Kepemimpinan",
  intelektual: "4. Pengembangan Intelektual",
  praktik: "5. Praktik Kerja",
  pembinaan: "6. Pembinaan Spiritual",
  karakter: "7. Pembangunan Karakter dan Kepribadian",
  kursus: "8. Kursus-kursus",
  skripsi: "9. Skripsi",
};

// Kategori SKPI tidak disimpan sebagai kolom di DB — diturunkan dari "jenis
// aktivitas" (tiap jenis memetakan 1:1 ke satu kategori SKPI).
const JENIS_TO_SKPI = {
  "Prestasi dan Kegiatan":                     "prestasi",
  "Peningkatan Keterampilan Profesional":      "keterampilan",
  "Pengalaman Berorganisasi dan Kepemimpinan": "organisasi",
  "Pengembangan Intelektual":                  "intelektual",
  "Penelitian":                                "intelektual",
  "Praktik Kerja":                             "praktik",
  "Pengabdian Masyarakat":                     "organisasi",
  "Pembinaan Spiritual":                       "pembinaan",
  "Pembangunan Karakter dan Kepribadian":      "karakter",
  "Kursus-kursus":                             "kursus",
  "Skripsi":                                   "skripsi",
};

/* ── TOAST ── */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);
  const remove = id => setToasts(p => p.filter(t => t.id !== id));
  return { toasts, add, remove };
}

function Toasts({ toasts, remove }) {
  return (
    <div className={styles.toastStack}>
      {toasts.map(t => (
        <div key={t.id} className={`${styles.toast} ${t.type === "success" ? styles.toastOk : styles.toastErr}`}>
          {t.type === "success" ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>}
          <span>{t.msg}</span>
          <button onClick={() => remove(t.id)}><X size={12}/></button>
        </div>
      ))}
    </div>
  );
}

/* ── STATUS BADGE ── */
function StatusBadge({ status, size = "md" }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.diproses;
  const Icon = cfg.icon;
  return (
    <span className={`${styles.statusBadge} ${size === "sm" ? styles.statusSm : ""}`}
      style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
      <Icon size={size === "sm" ? 10 : 12} />
      {cfg.label}
    </span>
  );
}

/* ── BUKTI FILE VIEWER ── */
function BuktiItem({ bukti }) {
  const isImg = ["jpg","jpeg","png","gif","webp"].some(ext =>
    bukti.file_path?.toLowerCase().endsWith(ext));
  const url = getUploadUrl(bukti.file_path);

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={styles.buktiItem}>
      {isImg ? <ImageIcon size={13}/> : <FileText size={13}/>}
      <span>{bukti.file_path?.split("/").pop() || "File Bukti"}</span>
      <Download size={12}/>
    </a>
  );
}

/* ── MODAL DETAIL & VERIFIKASI (tetap sama) ── */
function DetailModal({ data, onClose, onSaved }) {
  const [status, setStatus]   = useState(data?.status_verifikasi || "diproses");
  const [catatan, setCatatan] = useState(data?.catatan_admin || "");
  const [saving, setSaving]   = useState(false);
  const { add: toast }        = useToast();

  useEffect(() => {
    setStatus(data?.status_verifikasi || "diproses");
    setCatatan(data?.catatan_admin || "");
  }, [data]);

  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  if (!data) return null;

  const handleSave = async () => {
    setSaving(true);
    const res = await verifikasiAktivitas(data.id_kegiatan, status, catatan);
    setSaving(false);
    if (res.ok) {
      onSaved(data.id_kegiatan, status, catatan);
      onClose();
    }
  };

  const tgl = data.tanggal_kegiatan
    ? new Date(data.tanggal_kegiatan).toLocaleDateString("id-ID", { day:"numeric", month:"long", year:"numeric" })
    : "-";

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <div className={styles.modalHeadLeft}>
            <div className={styles.modalIcon}><Eye size={16}/></div>
            <div>
              <div className={styles.modalTitle}>Detail &amp; Verifikasi Aktivitas</div>
              <div className={styles.modalSub}>ID Kegiatan: #{String(data.id_kegiatan).padStart(4,"0")}</div>
            </div>
          </div>
          <button className={styles.modalCloseBtn} onClick={onClose}><X size={17}/></button>
        </div>

        <div className={styles.modalBody}>
          {/* ── Info Aktivitas ── */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardTitle}><Activity size={13}/> Informasi Aktivitas</div>
            <div className={styles.infoGrid}>
              <InfoRow label="Nama Aktivitas" value={<strong>{data.nama_kegiatan}</strong>} full />
              {data.nama_kegiatan_eng && <InfoRow label="Nama (English)" value={<em>{data.nama_kegiatan_eng}</em>} full />}
              <InfoRow label="Kategori SKPI" value={SKPI_LABELS[data.kategori_skpi] || data.kategori_skpi || "-"} />
              <InfoRow label="Kategori" value={data.kategoriaktivitas?.nama_indo || "-"} />
              {data.kelompokaktivitas && <InfoRow label="Kelompok" value={data.kelompokaktivitas?.nama_indo} />}
              {data.levelkegiatan    && <InfoRow label="Level" value={data.levelkegiatan?.nama_level} />}
              {data.posisikegiatan   && <InfoRow label="Posisi/Peran" value={data.posisikegiatan?.nama_posisi} />}
              <InfoRow label="Penyelenggara" value={<span className={styles.flexRow}><Building2 size={12}/>{data.penyelenggara || "-"}</span>} />
              <InfoRow label="Tanggal" value={<span className={styles.flexRow}><Calendar size={12}/>{tgl}</span>} />
              {data.lokasi && <InfoRow label="Lokasi" value={<span className={styles.flexRow}><MapPin size={12}/>{data.lokasi}</span>} />}
              {data.periode_kegiatan && <InfoRow label="Periode Semester" value={data.periode_kegiatan} />}
              {data.periode_mentor && <InfoRow label="Periode Pendampingan" value={data.periode_mentor} />}
              {data.bukti_deskripsi && <InfoRow label="Deskripsi Bukti" value={data.bukti_deskripsi} full />}
              {data.tingkat_prestasi && <InfoRow label="Tingkat Prestasi" value={data.tingkat_prestasi} />}
              {data.peringkat        && <InfoRow label="Peringkat" value={data.peringkat} />}
            </div>
          </div>

          {/* ── Mahasiswa ── */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardTitle}><User size={13}/> Mahasiswa Pengusul</div>
            <div className={styles.infoGrid}>
              <InfoRow label="Nama" value={<strong>{data.mahasiswa?.nama || "-"}</strong>} />
              <InfoRow label="NIM"  value={<code className={styles.nim}>{data.mahasiswa?.nim || "-"}</code>} />
            </div>
          </div>

          {/* ── Bukti Kegiatan ── */}
          {data.buktikegiatan?.length > 0 && (
            <div className={styles.infoCard}>
              <div className={styles.infoCardTitle}><Paperclip size={13}/> Bukti Kegiatan ({data.buktikegiatan.length})</div>
              <div className={styles.buktiList}>
                {data.buktikegiatan.map(b => <BuktiItem key={b.id_bukti} bukti={b}/>)}
              </div>
            </div>
          )}

          {/* ── Status Saat Ini ── */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardTitle}><Tag size={13}/> Status Verifikasi Saat Ini</div>
            <div style={{ padding: "4px 0 8px" }}>
              <StatusBadge status={data.status_verifikasi}/>
            </div>
            {data.catatan_admin && (
              <div className={styles.catatanBox}>
                <strong>Catatan Admin:</strong> {data.catatan_admin}
              </div>
            )}
          </div>

          {/* ── Form Verifikasi ── */}
          <div className={styles.verifCard}>
            <div className={styles.infoCardTitle}><FileCheck size={13}/> Ubah Status Verifikasi</div>
            <div className={styles.statusOptions}>
              {Object.entries(STATUS_CFG).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button key={key}
                    className={`${styles.statusOpt} ${status === key ? styles.statusOptActive : ""}`}
                    style={status === key ? { background: cfg.bg, borderColor: cfg.border, color: cfg.color } : {}}
                    onClick={() => setStatus(key)}
                  >
                    <Icon size={14}/> {cfg.label}
                  </button>
                );
              })}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Catatan Admin (opsional)</label>
              <textarea className={styles.textarea} rows={3}
                placeholder="Tulis catatan untuk mahasiswa jika ada..."
                value={catatan} onChange={e => setCatatan(e.target.value)}/>
            </div>
          </div>
        </div>

        <div className={styles.modalFoot}>
          <button className={styles.btnGhost} onClick={onClose}>Tutup</button>
          <button className={styles.btnSave} onClick={handleSave} disabled={saving}
            style={{ background: STATUS_CFG[status]?.color }}>
            {saving ? <Loader2 size={14} className={styles.spin}/> : <FileCheck size={14}/>}
            {saving ? "Menyimpan..." : "Simpan Verifikasi"}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, full }) {
  return (
    <div className={`${styles.infoRow} ${full ? styles.infoRowFull : ""}`}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoVal}>{value}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   HALAMAN UTAMA
══════════════════════════════════════════════════════════════ */
const PER_PAGE = 10;

export default function AktivitasPage() {
  const [rows, setRows]           = useState([]);
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterKategori, setFilterKategori] = useState("Semua");
  const [filterOpen, setFilterOpen]     = useState(false);
  const [detail, setDetail]       = useState(null);
  const { toasts, add: toast, remove } = useToast();

  const loadData = useCallback(async (q = search, status = filterStatus, pg = page) => {
    setLoading(true);
    const res = await getAktivitasList({ q, status, page: pg });
    if (res) {
      // Turunkan kategori SKPI dari jenis aktivitas (tidak ada kolomnya di DB).
      const rows = (res.rows ?? []).map(r => ({
        ...r,
        kategori_skpi: r.kategori_skpi || JENIS_TO_SKPI[r.jenisaktivitas?.nama_indo] || "",
      }));
      setRows(rows);
      setTotal(res.total ?? 0);
      setTotalPages(Math.ceil((res.total ?? 0) / PER_PAGE) || 1);
    }
    setLoading(false);
  }, [search, filterStatus, page]);

  useEffect(() => { loadData(); document.title = "Aktivitas | Admin SKPI"; }, [loadData]);

  // Debounce search
  const searchTimer = useRef(null);
  const handleSearch = val => {
    setSearch(val); setPage(1);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadData(val, filterStatus, 1), 400);
  };

  const handleStatusFilter = status => {
    setFilterStatus(status); setPage(1);
    loadData(search, status, 1);
  };

  const handleKategoriFilter = kat => {
    setFilterKategori(kat);
    // filter lokal, tidak perlu reload
  };

  const handleSaved = (id, newStatus, catatan) => {
    setRows(prev => prev.map(r =>
      r.id_kegiatan === id
        ? { ...r, status_verifikasi: newStatus, catatan_admin: catatan }
        : r
    ));
    toast(`Status diubah menjadi "${STATUS_CFG[newStatus]?.label}"`);
  };

  // Filter lokal berdasarkan kategori SKPI
  const filteredRows = filterKategori === "Semua"
    ? rows
    : rows.filter(r => r.kategori_skpi === filterKategori);

  /* ── Statistik dari semua data ── */
  const stats = {
    total,
    diproses:  rows.filter(r => r.status_verifikasi === "diproses").length,
    disetujui: rows.filter(r => r.status_verifikasi === "disetujui").length,
    ditolak:   rows.filter(r => r.status_verifikasi === "ditolak").length,
    revisi:    rows.filter(r => r.status_verifikasi === "revisi").length,
  };

  // Data untuk grafik status. Warna = warna status resmi aplikasi (versi pekat
  // yang dipakai stat cards, kontras baik & lolos cek keterbacaan warna).
  const statusChartData = [
    { key: "diproses",  label: "Diproses",  value: stats.diproses,  color: "#d97706" },
    { key: "disetujui", label: "Disetujui", value: stats.disetujui, color: "#16a34a" },
    { key: "revisi",    label: "Revisi",    value: stats.revisi,    color: "#7c3aed" },
    { key: "ditolak",   label: "Ditolak",   value: stats.ditolak,   color: "#dc2626" },
  ];

  const safePage = Math.min(page, totalPages);

  return (
    <div className={styles.page}>
      <Toasts toasts={toasts} remove={remove}/>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Verifikasi Aktivitas Mahasiswa</h1>
          <p className={styles.pageSub}>Tinjau dan verifikasi kegiatan yang diajukan mahasiswa</p>
        </div>
        <button className={styles.btnRefresh} onClick={() => loadData()} disabled={loading} title="Refresh">
          <RefreshCw size={14} className={loading ? styles.spin : ""}/>
        </button>
      </div>

      {/* Stat Cards */}
      <div className={styles.statsGrid}>
        {[
          { label: "Total Kegiatan", val: total,          color: "#765439", bg: "#fdf4ec", icon: Activity    },
          { label: "Diproses",       val: stats.diproses,  color: "#d97706", bg: "#fef3c7", icon: Clock       },
          { label: "Disetujui",      val: stats.disetujui, color: "#16a34a", bg: "#dcfce7", icon: FileCheck   },
          { label: "Revisi",         val: stats.revisi,    color: "#7c3aed", bg: "#ede9fe", icon: RotateCcw   },
          { label: "Ditolak",        val: stats.ditolak,   color: "#dc2626", bg: "#fee2e2", icon: XCircle     },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div className={styles.statCard} key={s.label}>
              <div className={styles.statIcon} style={{ background: s.bg, color: s.color }}>
                <Icon size={18}/>
              </div>
              <div>
                <div className={styles.statVal} style={{ color: s.color }}>{s.val}</div>
                <div className={styles.statLbl}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grafik distribusi status */}
      <AktivitasStatusChart data={statusChartData} accent="#765439" />

      {/* Toolbar: search + filter */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIco}/>
          <input
            className={styles.searchInp}
            placeholder="Cari nama kegiatan, mahasiswa, atau NIM..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
          {search && (
            <button className={styles.searchClr} onClick={() => handleSearch("")}>
              <X size={13}/>
            </button>
          )}
        </div>

        <div className={styles.toolRight}>
          {/* Filter Kategori SKPI */}
          <div className={styles.filterWrap}>
            <select
              className={styles.filterSelect}
              value={filterKategori}
              onChange={e => handleKategoriFilter(e.target.value)}
            >
              <option value="Semua">Semua Kategori</option>
              {Object.entries(SKPI_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div className={styles.filterWrap}>
            <select
              className={styles.filterSelect}
              value={filterStatus}
              onChange={e => handleStatusFilter(e.target.value)}
            >
              <option value="Semua">Semua Status</option>
              <option value="diproses">Diproses</option>
              <option value="disetujui">Disetujui</option>
              <option value="revisi">Revisi</option>
              <option value="ditolak">Ditolak</option>
            </select>
          </div>

          <span className={styles.countLabel}>{filteredRows.length} kegiatan</span>
        </div>
      </div>

      {/* Tabel */}
      <div className={styles.tableCard}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={`${styles.thNo} ${styles.hideMobile}`}>No.</th>
                <th>
                  <span className={styles.colLabelFull}>Nama Kegiatan</span>
                  <span className={styles.colLabelShort}>Kegiatan</span>
                </th>
                <th className={styles.hideMobile}>Mahasiswa</th>
                <th className={`${styles.thCenter} ${styles.hideMobile}`}>Kategori</th>
                <th className={`${styles.thCenter} ${styles.hideMobile}`}>Tanggal</th>
                <th className={styles.thCenter}>Status</th>
                <th className={styles.thCenter}>Bukti</th>
                <th className={`${styles.thCenter} ${styles.thAksi}`}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className={styles.emptyTd}>
                    <div className={styles.emptyState}>
                      <Loader2 size={30} className={styles.spin}/>
                      <p>Memuat data...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.emptyTd}>
                    <div className={styles.emptyState}>
                      <Activity size={42}/>
                      <p>Tidak ada kegiatan yang ditemukan</p>
                      <span>Coba ubah filter atau kata pencarian</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRows.map((row, idx) => (
                <tr key={row.id_kegiatan}>
                  <td className={`${styles.tdNo} ${styles.hideMobile}`}>{(safePage - 1) * PER_PAGE + idx + 1}</td>
                  <td>
                    <div className={styles.kegiatanName}>{row.nama_kegiatan}</div>
                    {row.penyelenggara && (
                      <div className={styles.kegiatanSub}><Building2 size={10}/>{row.penyelenggara}</div>
                    )}
                  </td>
                  <td className={styles.hideMobile}>
                    <div className={styles.mhsName}>{row.mahasiswa?.nama || "-"}</div>
                    <code className={styles.mhsNim}>{row.mahasiswa?.nim || "-"}</code>
                  </td>
                  <td className={`${styles.tdKat} ${styles.hideMobile}`}>
                    {SKPI_LABELS[row.kategori_skpi] || row.kategoriaktivitas?.nama_indo || "-"}
                  </td>
                  <td className={`${styles.tdCenter} ${styles.hideMobile}`}>
                    <div className={styles.tglBadge}>
                      {row.tanggal_kegiatan
                        ? new Date(row.tanggal_kegiatan).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"})
                        : "-"}
                    </div>
                  </td>
                  <td className={styles.tdCenter}><StatusBadge status={row.status_verifikasi} size="sm"/></td>
                  <td className={styles.tdCenter}>
                    <span className={`${styles.buktiCount} ${row.buktikegiatan?.length > 0 ? styles.buktiHas : styles.buktiNone}`}>
                      <Paperclip size={11}/>{row.buktikegiatan?.length || 0}
                    </span>
                  </td>
                  <td className={styles.tdCenter}>
                    <button className={styles.btnVerif} onClick={() => setDetail(row)} title="Lihat Detail & Verifikasi">
                      <Eye size={14}/> Verifikasi
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <span className={styles.paginInfo}>
            {total === 0 ? 0 : (safePage-1)*PER_PAGE+1}–{Math.min(safePage*PER_PAGE, total)} dari {total}
          </span>
          <div className={styles.paginBtns}>
            <button className={styles.pBtn} onClick={() => { setPage(1); loadData(search, filterStatus, 1); }} disabled={safePage===1}>«</button>
            <button className={styles.pBtn} onClick={() => { const p=Math.max(1,safePage-1); setPage(p); loadData(search,filterStatus,p); }} disabled={safePage===1}><ChevronLeft size={13}/></button>
            {Array.from({length:totalPages},(_,i)=>i+1)
              .filter(p=>p===1||p===totalPages||Math.abs(p-safePage)<=1)
              .reduce((acc,p,i,arr)=>{if(i>0&&arr[i-1]!==p-1)acc.push("…");acc.push(p);return acc;},[])
              .map((p,i)=>p==="…"
                ?<span key={`d${i}`} className={styles.pDots}>…</span>
                :<button key={p} className={`${styles.pBtn} ${safePage===p?styles.pBtnOn:""}`}
                    onClick={()=>{setPage(p);loadData(search,filterStatus,p);}}>{p}</button>
              )}
            <button className={styles.pBtn} onClick={()=>{const p=Math.min(totalPages,safePage+1);setPage(p);loadData(search,filterStatus,p);}} disabled={safePage===totalPages}><ChevronRight size={13}/></button>
            <button className={styles.pBtn} onClick={()=>{setPage(totalPages);loadData(search,filterStatus,totalPages);}} disabled={safePage===totalPages}>»</button>
          </div>
        </div>
      )}

      {/* Modal */}
      {detail && <DetailModal data={detail} onClose={() => setDetail(null)} onSaved={handleSaved}/>}
    </div>
  );
}