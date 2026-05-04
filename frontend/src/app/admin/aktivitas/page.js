"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Activity, Search, Filter, Eye, Loader2, ChevronLeft, ChevronRight,
  AlertCircle, CheckCircle2, X, Clock, FileCheck, XCircle, RefreshCw,
  RotateCcw, Paperclip, User, Calendar, MapPin, Tag, Building2,
  ChevronDown, Download, Image as ImageIcon, FileText,
} from "lucide-react";
import { getAktivitasList, verifikasiAktivitas } from "@/lib/api";
import styles from "./aktivitas.module.css";

/* ── KONSTANTA ── */
const STATUS_CFG = {
  diproses:  { label: "Diproses",  color: "#f59e0b", bg: "#fef3c7", icon: Clock,       border: "#fde68a" },
  disetujui: { label: "Disetujui", color: "#16a34a", bg: "#dcfce7", icon: FileCheck,   border: "#86efac" },
  ditolak:   { label: "Ditolak",   color: "#dc2626", bg: "#fee2e2", icon: XCircle,     border: "#fca5a5" },
  revisi:    { label: "Revisi",    color: "#7c3aed", bg: "#ede9fe", icon: RotateCcw,   border: "#c4b5fd" },
};

const JENIS_COLOR = {
  Workshop:    "#7c3aed", Seminar:     "#06b6d4", Kompetisi:   "#ec4899",
  Training:    "#f59e0b", Webinar:     "#6366f1", Magang:      "#10b981",
  Organisasi:  "#8b5cf6", Kursus:      "#0ea5e9", Lomba:       "#f43f5e",
};

function getJenisColor(nama) {
  return JENIS_COLOR[nama] || "#765439";
}

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

/* ── JENIS BADGE ── */
function JenisBadge({ nama }) {
  const c = getJenisColor(nama);
  return (
    <span style={{
      background: `${c}18`, color: c, border: `1px solid ${c}40`,
      borderRadius: "20px", padding: "2px 9px",
      fontSize: "11.5px", fontWeight: 700, whiteSpace: "nowrap",
    }}>{nama || "-"}</span>
  );
}

/* ── BUKTI FILE VIEWER ── */
function BuktiItem({ bukti }) {
  const isImg = ["jpg","jpeg","png","gif","webp"].some(ext =>
    bukti.file_path?.toLowerCase().endsWith(ext));
  const API = process.env.NEXT_PUBLIC_API_URL || "";
  const url = bukti.file_path?.startsWith("http")
    ? bukti.file_path
    : `${API}/uploads/${bukti.file_path}`;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={styles.buktiItem}>
      {isImg ? <ImageIcon size={13}/> : <FileText size={13}/>}
      <span>{bukti.file_path?.split("/").pop() || "File Bukti"}</span>
      <Download size={12}/>
    </a>
  );
}

/* ── MODAL DETAIL & VERIFIKASI ── */
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
        {/* Header */}
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
              <InfoRow label="Jenis" value={<JenisBadge nama={data.jenisaktivitas?.nama_indo}/>} />
              <InfoRow label="Kategori" value={data.kategoriaktivitas?.nama_indo || "-"} />
              {data.kelompokaktivitas && <InfoRow label="Kelompok" value={data.kelompokaktivitas?.nama_indo} />}
              {data.levelkegiatan    && <InfoRow label="Level" value={data.levelkegiatan?.nama_level} />}
              {data.posisikegiatan   && <InfoRow label="Posisi/Peran" value={data.posisikegiatan?.nama_posisi} />}
              <InfoRow label="Penyelenggara" value={<span className={styles.flexRow}><Building2 size={12}/>{data.penyelenggara || "-"}</span>} />
              <InfoRow label="Tanggal" value={<span className={styles.flexRow}><Calendar size={12}/>{tgl}</span>} />
              {data.lokasi && <InfoRow label="Lokasi" value={<span className={styles.flexRow}><MapPin size={12}/>{data.lokasi}</span>} />}
              {data.periode_kegiatan && <InfoRow label="Periode" value={data.periode_kegiatan} />}
              {data.tingkat_prestasi && <InfoRow label="Tingkat" value={data.tingkat_prestasi} />}
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
  const [filterOpen, setFilterOpen]     = useState(false);
  const [detail, setDetail]       = useState(null);
  const { toasts, add: toast, remove } = useToast();

  const loadData = useCallback(async (q = search, status = filterStatus, pg = page) => {
    setLoading(true);
    const res = await getAktivitasList({ q, status, page: pg });
    if (res) {
      setRows(res.rows ?? []);
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

  const handleSaved = (id, newStatus, catatan) => {
    setRows(prev => prev.map(r =>
      r.id_kegiatan === id
        ? { ...r, status_verifikasi: newStatus, catatan_admin: catatan }
        : r
    ));
    toast(`Status diubah menjadi "${STATUS_CFG[newStatus]?.label}"`);
  };

  /* ── Statistik dari semua data (server-side count jika available) ── */
  const stats = {
    total,
    diproses:  rows.filter(r => r.status_verifikasi === "diproses").length,
    disetujui: rows.filter(r => r.status_verifikasi === "disetujui").length,
    ditolak:   rows.filter(r => r.status_verifikasi === "ditolak").length,
    revisi:    rows.filter(r => r.status_verifikasi === "revisi").length,
  };

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

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIco}/>
          <input className={styles.searchInp}
            placeholder="Cari nama kegiatan, mahasiswa, atau NIM..."
            value={search} onChange={e => handleSearch(e.target.value)}/>
          {search && <button className={styles.searchClr} onClick={() => handleSearch("")}><X size={13}/></button>}
        </div>
        <div className={styles.toolRight}>
          {/* Filter Status Dropdown */}
          <div className={styles.filterWrap}>
            <button className={`${styles.filterBtn} ${filterStatus !== "Semua" ? styles.filterBtnOn : ""}`}
              onClick={() => setFilterOpen(o => !o)}>
              <Filter size={13}/> {filterStatus === "Semua" ? "Semua Status" : STATUS_CFG[filterStatus]?.label}
              <ChevronDown size={12} className={filterOpen ? styles.chevUp : ""}/>
            </button>
            {filterOpen && (
              <div className={styles.filterDrop}>
                {["Semua", "diproses", "disetujui", "revisi", "ditolak"].map(s => {
                  const cfg = STATUS_CFG[s];
                  const Icon = cfg?.icon;
                  return (
                    <button key={s}
                      className={`${styles.filterOpt} ${filterStatus === s ? styles.filterOptActive : ""}`}
                      onClick={() => { handleStatusFilter(s); setFilterOpen(false); }}
                      style={filterStatus === s && cfg ? { background: cfg.bg, color: cfg.color } : {}}
                    >
                      {Icon && <Icon size={12}/>}
                      {cfg ? cfg.label : "Semua Status"}
                      {filterStatus === s && <CheckCircle2 size={11} style={{ marginLeft: "auto" }}/>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <span className={styles.countLabel}>{total} kegiatan</span>
        </div>
      </div>

      {/* Tabel */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thNo}>No.</th>
              <th>Nama Kegiatan</th>
              <th>Mahasiswa</th>
              <th>Jenis</th>
              <th>Kategori</th>
              <th className={styles.thCenter}>Tanggal</th>
              <th className={styles.thCenter}>Status</th>
              <th className={styles.thCenter}>Bukti</th>
              <th className={styles.thCenter}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className={styles.emptyTd}>
                <div className={styles.emptyState}><Loader2 size={30} className={styles.spin}/><p>Memuat data...</p></div>
              </td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={9} className={styles.emptyTd}>
                <div className={styles.emptyState}>
                  <Activity size={42}/>
                  <p>Tidak ada kegiatan yang ditemukan</p>
                  <span>Coba ubah filter atau kata pencarian</span>
                </div>
              </td></tr>
            ) : rows.map((row, idx) => (
              <tr key={row.id_kegiatan}>
                <td className={styles.tdNo}>{(safePage - 1) * PER_PAGE + idx + 1}</td>
                <td>
                  <div className={styles.kegiatanName}>{row.nama_kegiatan}</div>
                  {row.penyelenggara && (
                    <div className={styles.kegiatanSub}><Building2 size={10}/>{row.penyelenggara}</div>
                  )}
                </td>
                <td>
                  <div className={styles.mhsName}>{row.mahasiswa?.nama || "-"}</div>
                  <code className={styles.mhsNim}>{row.mahasiswa?.nim || "-"}</code>
                </td>
                <td><JenisBadge nama={row.jenisaktivitas?.nama_indo}/></td>
                <td className={styles.tdKat}>{row.kategoriaktivitas?.nama_indo || "-"}</td>
                <td className={styles.tdCenter}>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <span className={styles.paginInfo}>{total === 0 ? 0 : (safePage-1)*PER_PAGE+1}–{Math.min(safePage*PER_PAGE, total)} dari {total}</span>
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