"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, Filter, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2,
  X, Download, Eye, FileText, Loader2, Zap, Users, Award, TrendingUp,
  RefreshCw, Shield, Medal, Trophy, CheckSquare, Send,
} from "lucide-react";
import styles from "./page.module.css";
import {
  getMahasiswaList, getProdiList, getIcpSummary,
  generateSkpi, publishSkpi, getSkpiList,
} from "@/lib/api";

/* ─────────────────────────────────────────
   MOCK DATA
───────────────────────────────────────── */
const MOCK_MAHASISWA = [
  {
    id_mahasiswa: 1, nim: "20220001", nama: "Andi Saputra",
    prodi: "Teknologi Informasi", angkatan: "2022", status_skpi: "belum",
    total_poin: 85, detail_icp: [], tempat_lahir: "Bengkayang", tgl_lahir: "2000-01-15",
    tgl_masuk: "2022-08-01", tgl_lulus: null, nomor_ijazah: "",
    gelar: "Sarjana Komputer", gelar_eng: "Bachelor of Computer Science",
  },
  {
    id_mahasiswa: 2, nim: "20220002", nama: "Budi Wijaya",
    prodi: "Manajemen", angkatan: "2022", status_skpi: "diajukan",
    total_poin: 145, detail_icp: [], tempat_lahir: "Pontianak", tgl_lahir: "2000-03-20",
    tgl_masuk: "2022-08-01", tgl_lulus: null, nomor_ijazah: "",
    gelar: "Sarjana Manajemen", gelar_eng: "Bachelor of Management",
  },
  {
    id_mahasiswa: 3, nim: "20230001", nama: "Cindy Lestari",
    prodi: "Sistem Informasi", angkatan: "2023", status_skpi: "diterbitkan",
    total_poin: 210, detail_icp: [], tempat_lahir: "Jakarta", tgl_lahir: "2001-07-12",
    tgl_masuk: "2023-08-01", tgl_lulus: null, nomor_ijazah: "",
    gelar: "Sarjana Komputer", gelar_eng: "Bachelor of Computer Science",
  },
];

const MOCK_PRODI_LIST = [
  { id_prodi: 1, nama_prodi: "Teknologi Informasi" },
  { id_prodi: 2, nama_prodi: "Sistem Informasi" },
  { id_prodi: 3, nama_prodi: "Manajemen" },
  { id_prodi: 4, nama_prodi: "Kewirausahaan" },
  { id_prodi: 5, nama_prodi: "Pendidikan Guru Sekolah Dasar" },
  { id_prodi: 6, nama_prodi: "Agroekoteknologi" },
];

const API      = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const PER_PAGE = 10;

/* ── ICP Tiers ── */
const ICP_TIERS = [
  { min: 200, label: "Gold Achievement",   color: "#ca8a04", bg: "#fef9c3", border: "#fde047", icon: Trophy },
  { min: 150, label: "Silver Achievement", color: "#2563eb", bg: "#dbeafe", border: "#93c5fd", icon: Medal },
  { min: 100, label: "Bronze Achievement", color: "#92400e", bg: "#fef3c7", border: "#fcd34d", icon: Award },
  { min: 0,   label: "Belum Memenuhi",     color: "#dc2626", bg: "#fee2e2", border: "#fca5a5", icon: AlertCircle },
];
function getIcpTier(poin) {
  return ICP_TIERS.find(t => poin >= t.min) || ICP_TIERS[ICP_TIERS.length - 1];
}

const STATUS_SKPI_CFG = {
  belum:       { label: "Belum",       color: "#6b7280", bg: "#f3f4f6", border: "#d1d5db" },
  diajukan:    { label: "Proses",      color: "#d97706", bg: "#fef3c7", border: "#fde68a" },
  direvisi:    { label: "Revisi",      color: "#7c3aed", bg: "#ede9fe", border: "#c4b5fd" },
  diterbitkan: { label: "Diterbitkan", color: "#16a34a", bg: "#dcfce7", border: "#86efac" },
};

const PRODI_CFG = {
  "Teknologi Informasi":           { color: "#5b21b6", bg: "#ede9fe", border: "#c4b5fd", gradient: "linear-gradient(135deg,#7c3aed,#5b21b6)", label: "TI" },
  "Sistem Informasi":              { color: "#1d4ed8", bg: "#dbeafe", border: "#93c5fd", gradient: "linear-gradient(135deg,#2563eb,#1d4ed8)", label: "SI" },
  "Manajemen":                     { color: "#0369a1", bg: "#e0f2fe", border: "#7dd3fc", gradient: "linear-gradient(135deg,#0284c7,#0369a1)", label: "MNJ" },
  "Kewirausahaan":                 { color: "#065f46", bg: "#d1fae5", border: "#6ee7b7", gradient: "linear-gradient(135deg,#059669,#065f46)", label: "KWU" },
  "Pendidikan Guru Sekolah Dasar": { color: "#854d0e", bg: "#fef9c3", border: "#fde047", gradient: "linear-gradient(135deg,#ca8a04,#854d0e)", label: "PGSD" },
  "Agroekoteknologi":              { color: "#166534", bg: "#dcfce7", border: "#86efac", gradient: "linear-gradient(135deg,#16a34a,#166534)", label: "AGRO" },
};
function getProdiCfg(nama) {
  return PRODI_CFG[nama] || { color: "#765439", bg: "#fdf4ec", border: "#e4d4c4", gradient: "linear-gradient(135deg,#765439,#4a2f1a)", label: "?" };
}

function getAngkatanList() {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear; y >= currentYear - 10; y--) {
    years.push(y);
  }
  return years;
}

/* ══ Toast ══ */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
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

/* ══════════════════════════════════════════════════
   PREVIEW MODAL
══════════════════════════════════════════════════ */
function PreviewModal({ mhs, onClose, onGenerate, onPublish, generating, publishing, existingSkpi }) {
  const [status,      setStatus]      = useState("loading");
  const [errMsg,      setErrMsg]      = useState("");
  const [noTemplate,  setNoTemplate]  = useState(null);
  const [pdfUrl,      setPdfUrl]      = useState("");
  const [downloading, setDownloading] = useState(false);

  const tier     = getIcpTier(mhs?.total_poin ?? 0);
  const TierIcon = tier.icon;

  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  useEffect(() => {
    if (!mhs?.id_mahasiswa) return;
    let cancelled = false;

    const fetchPdf = async () => {
      setStatus("loading");
      setErrMsg("");
      setNoTemplate(null);
      try {
        const res = await fetch(`${API}/api/skpi/preview-pdf/${mhs.id_mahasiswa}`, { credentials: "include" });
        if (!cancelled) {
          if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            if (json.code === "NO_TEMPLATE") {
              setNoTemplate({ prodi: mhs.prodi, available: json.available || [] });
              setStatus("error");
            } else {
              setErrMsg(json.error || `Error ${res.status}`);
              setStatus("error");
            }
            return;
          }
          const blob = await res.blob();
          setPdfUrl(URL.createObjectURL(blob));
          setStatus("ok");
        }
      } catch (e) {
        if (!cancelled) {
          setErrMsg(e.message);
          setStatus("error");
        }
      }
    };

    fetchPdf();
    return () => { cancelled = true; };
  }, [mhs?.id_mahasiswa]);

  useEffect(() => () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); }, [pdfUrl]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res  = await fetch(`${API}/api/skpi/download/${mhs.id_mahasiswa}`, { credentials: "include" });
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement("a"), {
        href: url,
        download: `SKPI_${mhs.nim}_${(mhs.nama || "").replace(/[^a-zA-Z0-9]/g, "_")}.docx`,
      });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch(e) { alert("Gagal download: " + e.message); }
    finally    { setDownloading(false); }
  };

  const handleDownloadPdf = () => {
    if (!pdfUrl) return;
    const a = Object.assign(document.createElement("a"), {
      href: pdfUrl,
      download: `SKPI_${mhs.nim}_${(mhs.nama || "").replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
    });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  if (!mhs) return null;

  return (
    <div className={styles.previewOverlay}>
      <div className={styles.previewBar}>
        <div className={styles.previewBarLeft}>
          <FileText size={16}/>
          <span>Preview SKPI — <strong>{mhs.nama}</strong> ({mhs.nim})</span>
          <span className={styles.previewTier}
            style={{ background: tier.bg, color: tier.color, border: `1px solid ${tier.border}` }}>
            <TierIcon size={11}/> {tier.label}
          </span>
          {status === "ok" && (
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginLeft: 4 }}>
              PDF · {mhs.prodi}
            </span>
          )}
        </div>
        <div className={styles.previewBarRight}>
          <button className={styles.btnDownloadDocx} onClick={handleDownload}
            disabled={downloading || status !== "ok"}>
            {downloading ? <Loader2 size={14} className={styles.spin}/> : <Download size={14}/>}
            {downloading ? "Mengunduh..." : "Download .docx"}
          </button>
          <button className={styles.btnDownloadPdf} onClick={handleDownloadPdf}
            disabled={status !== "ok"}>
            <Download size={14}/> Download PDF
          </button>
          {!existingSkpi && (
            <button
              className={`${styles.btnGenerate} ${generating ? styles.btnLoading : ""}`}
              onClick={onGenerate}
              disabled={generating || mhs.total_poin < 100 || status !== "ok"}
              title={mhs.total_poin < 100 ? "ICP belum memenuhi syarat Bronze (100 poin)" : "Generate SKPI"}>
              {generating ? <Loader2 size={14} className={styles.spin}/> : <Zap size={14}/>}
              {generating ? "Generating..." : "Generate SKPI"}
            </button>
          )}
          {existingSkpi?.status === "draft" && (
            <button
              className={`${styles.btnPublish} ${publishing ? styles.btnLoading : ""}`}
              onClick={onPublish} disabled={publishing}>
              {publishing ? <Loader2 size={14} className={styles.spin}/> : <Send size={14}/>}
              {publishing ? "Menerbitkan..." : "Terbitkan Resmi"}
            </button>
          )}
          {existingSkpi?.status === "resmi" && (
            <span className={styles.btnResmi}><CheckSquare size={14}/> Sudah Diterbitkan</span>
          )}
          <button className={styles.previewClose} onClick={onClose}><X size={18}/></button>
        </div>
      </div>

      <div className={styles.previewScroll} style={{ background: "#525252", padding: 0 }}>
        {status === "loading" && (
          <div className={styles.previewLoading}>
            <Loader2 size={32} className={styles.spin} style={{ color: "#f5dfc0" }}/>
            <p style={{ color: "#f5dfc0", marginTop: 14, fontSize: 14 }}>Mengkonversi ke PDF…</p>
            <p style={{ color: "rgba(245,223,192,0.5)", fontSize: 12, marginTop: 4 }}>
              LibreOffice memproses SKPI {mhs.nama}
            </p>
          </div>
        )}
        {status === "error" && noTemplate && (
          <div className={styles.previewError}>
            <FileText size={48} style={{ color: "#f59e0b", marginBottom: 12 }}/>
            <p style={{ color: "#f59e0b", fontWeight: 700, fontSize: 16 }}>Template Belum Tersedia</p>
            <p style={{ color: "rgba(255,220,100,0.85)", fontSize: 14, marginTop: 8, textAlign: "center", maxWidth: 460 }}>
              Template SKPI untuk Program Studi{" "}
              <strong style={{ color: "#fbbf24" }}>{noTemplate.prodi}</strong> belum diupload.
            </p>
            {noTemplate.available.length > 0 && (
              <p style={{ color: "rgba(255,220,100,0.6)", fontSize: 12, marginTop: 8, textAlign: "center" }}>
                Template tersedia: {noTemplate.available.join(", ")}
              </p>
            )}
            <p style={{ color: "rgba(255,220,100,0.5)", fontSize: 12, marginTop: 6 }}>
              Upload template di halaman <strong>Template SKPI</strong>
            </p>
          </div>
        )}
        {status === "error" && !noTemplate && (
          <div className={styles.previewError}>
            <AlertCircle size={36} style={{ color: "#fca5a5" }}/>
            <p style={{ color: "#fca5a5", fontWeight: 700, marginTop: 12 }}>Gagal memuat PDF</p>
            <p style={{ color: "rgba(252,165,165,0.7)", fontSize: 13, marginTop: 6, textAlign: "center", maxWidth: 420 }}>
              {errMsg}
            </p>
            <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, marginTop: 8 }}>
              Pastikan LibreOffice terinstall di server
            </p>
          </div>
        )}
        {status === "ok" && pdfUrl && (
          <embed
            src={`${pdfUrl}#toolbar=1&navpanes=0&view=Fit&zoom=75`}
            type="application/pdf"
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
          />
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   HALAMAN UTAMA
══════════════════════════════════════════ */
export default function GenerateSkpiPage() {
  const [rows,        setRows]        = useState([]);
  const [total,       setTotal]       = useState(0);
  const [totalPages,  setTotalPages]  = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(1);
  const [search,      setSearch]      = useState("");
  const [filterProdi,    setFilterProdi]    = useState("Semua");
  const [filterStatus,   setFilterStatus]   = useState("Semua");
  const [filterIcp,      setFilterIcp]      = useState("Semua");
  const [filterAngkatan, setFilterAngkatan] = useState("Semua");
  const [prodiList,   setProdiList]   = useState([]);
  const [skpiMap,     setSkpiMap]     = useState({});
  const [preview,     setPreview]     = useState(null);
  const [generating,  setGenerating]  = useState(false);
  const [publishing,  setPublishing]  = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toasts, add: toast, remove } = useToast();
  const searchTimer = useRef(null);

  const angkatanList = getAngkatanList();

  useEffect(() => {
    getProdiList()
      .then(list => setProdiList(list?.length ? list : MOCK_PRODI_LIST))
      .catch(() => setProdiList(MOCK_PRODI_LIST));
    document.title = "Generate SKPI | Admin";
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [mhsRes, icpRes] = await Promise.all([
          getMahasiswaList({ q: search, prodi: filterProdi, page }),
          getIcpSummary({ page }),
        ]);
        if (cancelled) return;

        let mergedRows = [];
        if (mhsRes?.rows?.length) {
          const icpById = {};
          (icpRes?.rows || []).forEach(r => { icpById[r.id_mahasiswa] = r; });
          mergedRows = mhsRes.rows.map(m => ({
            id_mahasiswa: m.id_mahasiswa,
            nim: m.nim,
            nama: m.nama,
            prodi: m.programstudi?.nama_prodi || "-",
            angkatan: m.angkatan || "-",
            status_skpi: m.status_skpi || "belum",
            total_poin: icpById[m.id_mahasiswa]?.total_poin || 0,
            detail_icp: icpById[m.id_mahasiswa]?.detail_icp || [],
            tempat_lahir: m.tempat_lahir, tgl_lahir: m.tgl_lahir, tgl_masuk: m.tanggal_masuk,
            tgl_lulus: m.tanggal_lulus, nomor_ijazah: m.nomor_ijazah,
            gelar: m.gelar, gelar_eng: m.gelar_eng,
          }));
        } else {
          mergedRows = MOCK_MAHASISWA.map(m => ({ ...m }));
        }

        let filtered = mergedRows
          .filter(m => {
            if (filterIcp === "Gold")   return m.total_poin >= 200;
            if (filterIcp === "Silver") return m.total_poin >= 150 && m.total_poin < 200;
            if (filterIcp === "Bronze") return m.total_poin >= 100 && m.total_poin < 150;
            if (filterIcp === "Kurang") return m.total_poin < 100;
            if (filterIcp === "Siap")   return m.total_poin >= 100;
            return true;
          })
          .filter(m => filterStatus === "Semua" || m.status_skpi === filterStatus)
          .filter(m => filterAngkatan === "Semua" || String(m.angkatan) === String(filterAngkatan))
          .filter(m => {
            if (!search) return true;
            return m.nim.includes(search) || m.nama.toLowerCase().includes(search.toLowerCase());
          });

        setRows(filtered);
        setTotal(filtered.length);
        setTotalPages(Math.ceil(filtered.length / PER_PAGE) || 1);
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setRows(MOCK_MAHASISWA);
          setTotal(MOCK_MAHASISWA.length);
          setTotalPages(1);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [search, filterProdi, page, filterIcp, filterStatus, filterAngkatan, refreshTrigger]);

  useEffect(() => {
    if (rows.length === 0) return;
    getSkpiList({ page: 1 }).then(res => {
      if (!res) return;
      const map = {};
      (res.rows || []).forEach(s => { map[s.id_mahasiswa] = s; });
      setSkpiMap(map);
    });
  }, [rows]);

  const handleSearch = val => {
    setSearch(val);
    setPage(1);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setRefreshTrigger(t => t + 1);
    }, 400);
  };

  const handleGenerate = async () => {
    if (!preview || preview.total_poin < 100) {
      toast("ICP belum memenuhi syarat minimum Bronze (100 poin)", "error"); return;
    }
    setGenerating(true);
    const res = await generateSkpi(preview.id_mahasiswa);
    setGenerating(false);
    if (res.ok) {
      toast(`SKPI untuk ${preview.nama} berhasil digenerate!`);
      setSkpiMap(prev => ({ ...prev, [preview.id_mahasiswa]: res.data }));
      setRows(prev => prev.map(r =>
        r.id_mahasiswa === preview.id_mahasiswa ? { ...r, status_skpi: "diajukan" } : r
      ));
      setPreview(prev => ({ ...prev, status_skpi: "diajukan" }));
    } else {
      toast(res.data?.error || "Gagal generate SKPI", "error");
    }
  };

  const handlePublish = async () => {
    const skpi = skpiMap[preview?.id_mahasiswa];
    if (!skpi) return;
    setPublishing(true);
    const res = await publishSkpi(skpi.id_skpi, "resmi");
    setPublishing(false);
    if (res.ok) {
      toast(`SKPI ${preview.nama} berhasil diterbitkan resmi!`);
      setSkpiMap(prev => ({ ...prev, [preview.id_mahasiswa]: { ...skpi, status: "resmi" } }));
      setRows(prev => prev.map(r =>
        r.id_mahasiswa === preview.id_mahasiswa ? { ...r, status_skpi: "diterbitkan" } : r
      ));
    } else {
      toast(res.data?.error || "Gagal menerbitkan SKPI", "error");
    }
  };

  const stats = {
    total: rows.length,
    siap:        rows.filter(r => r.total_poin >= 100).length,
    diterbitkan: rows.filter(r => r.status_skpi === "diterbitkan").length,
    rataIcp:     rows.length ? Math.round(rows.reduce((s, r) => s + r.total_poin, 0) / rows.length) : 0,
  };
  const safePage = Math.min(page, totalPages);

  return (
    <div className={styles.container}>
      <Toasts toasts={toasts} remove={remove}/>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Generate &amp; Penerbitan SKPI</h1>
          <p className={styles.subtitle}>Generate, preview, dan terbitkan SKPI mahasiswa</p>
        </div>
        <button className={styles.btnRefresh} onClick={() => setRefreshTrigger(t => t + 1)} disabled={loading}>
          <RefreshCw size={14} className={loading ? styles.spin : ""}/>
        </button>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        {[
          { icon: Users,       label: "Total Mahasiswa", val: stats.total,         color: "#765439", bg: "#fdf4ec" },
          { icon: Award,       label: "Siap Generate",   val: stats.siap,          color: "#16a34a", bg: "#dcfce7" },
          { icon: CheckSquare, label: "Diterbitkan",     val: stats.diterbitkan,   color: "#2563eb", bg: "#dbeafe" },
          { icon: TrendingUp,  label: "Rata-rata ICP",   val: stats.rataIcp,       color: "#7c3aed", bg: "#ede9fe" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div className={styles.statCard} key={s.label} style={{ "--card-accent": s.color }}>
              <div className={styles.statIcon} style={{ background: s.bg, color: s.color }}><Icon size={20}/></div>
              <div className={styles.statInfo}>
                <div className={styles.statValue} style={{ color: s.color }}>{s.val}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Banner */}
      <div className={styles.icpBanner}>
        <Shield size={14}/>
        <span>Syarat generate SKPI: minimal <strong>Bronze Achievement (100 ICP)</strong> &nbsp;|&nbsp;
          🥉 Bronze: 100–149 &nbsp;·&nbsp; 🥈 Silver: 150–199 &nbsp;·&nbsp; 🥇 Gold: ≥200 poin</span>
      </div>

      {/* Filter Bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchBox}>
          <Search size={15} className={styles.searchIco}/>
          <input className={styles.searchInp}
            placeholder="Cari NIM atau nama mahasiswa..."
            value={search} onChange={e => handleSearch(e.target.value)}/>
          {search && <button className={styles.searchClr} onClick={() => handleSearch("")}><X size={13}/></button>}
        </div>
        <div className={styles.filterGroup}>
          <Filter size={13}/>
          <select className={styles.filterSelect} value={filterProdi}
            onChange={e => { setFilterProdi(e.target.value); setPage(1); }}>
            <option value="Semua">Semua Prodi</option>
            {prodiList.map(p => <option key={p.id_prodi} value={p.nama_prodi}>{p.nama_prodi}</option>)}
          </select>
          <select className={styles.filterSelect} value={filterAngkatan}
            onChange={e => { setFilterAngkatan(e.target.value); setPage(1); }}>
            <option value="Semua">Semua Angkatan</option>
            {angkatanList.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className={styles.filterSelect} value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="Semua">Semua Status</option>
            <option value="belum">Belum Generate</option>
            <option value="diajukan">Sudah Generate</option>
            <option value="diterbitkan">Diterbitkan</option>
          </select>
          <select className={styles.filterSelect} value={filterIcp}
            onChange={e => { setFilterIcp(e.target.value); setPage(1); }}>
            <option value="Semua">Semua ICP</option>
            <option value="Siap">Siap (≥100)</option>
            <option value="Gold">🥇 Gold (≥200)</option>
            <option value="Silver">🥈 Silver (150–199)</option>
            <option value="Bronze">🥉 Bronze (100–149)</option>
            <option value="Kurang">❌ Belum Memenuhi</option>
          </select>
        </div>
      </div>

      {/* Tabel */}
      <div className={styles.tableWrapper}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.colNo}>No.</th>
                <th>Mahasiswa</th>
                <th>NIM</th>
                <th>Program Studi</th>
                <th className={styles.colAngkatan}>Angkatan</th>
                <th className={styles.colIcp}>ICP</th>
                <th className={styles.colStatus}>Status SKPI</th>
                <th className={styles.colAksi}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className={styles.emptyTd}>
                  <div className={styles.emptyState}>
                    <Loader2 size={30} className={styles.spin}/><p>Memuat data...</p>
                  </div>
                </td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} className={styles.emptyTd}>
                  <div className={styles.emptyState}>
                    <FileText size={42}/><p>Tidak ada data mahasiswa</p>
                    <span>Coba ubah filter pencarian</span>
                  </div>
                </td></tr>
              ) : rows.map((row, idx) => {
                const tier      = getIcpTier(row.total_poin);
                const TierIcon  = tier.icon;
                const prodiCfg  = getProdiCfg(row.prodi);
                const skpiData  = skpiMap[row.id_mahasiswa];
                const statusCfg = STATUS_SKPI_CFG[row.status_skpi] || STATUS_SKPI_CFG.belum;
                const canGenerate = row.total_poin >= 100 && !skpiData;

                return (
                  <tr key={row.id_mahasiswa} className={row.total_poin < 100 ? styles.rowDim : ""}>
                    <td className={styles.tdNo}>{(safePage - 1) * PER_PAGE + idx + 1}</td>
                    <td>
                      <div className={styles.mhsCell}>
                        <div className={styles.avatar} style={{ background: prodiCfg.gradient }}>
                          {row.nama.charAt(0)}
                        </div>
                        <div>
                          <div className={styles.mhsName}>{row.nama}</div>
                        </div>
                      </div>
                    </td>
                    <td><code className={styles.mhsNim}>{row.nim}</code></td>
                    <td>
                      <span className={styles.prodiBadge}
                        style={{ background: prodiCfg.bg, color: prodiCfg.color, borderColor: prodiCfg.border }}>
                        <span className={styles.prodiDot}
                          style={{ background: prodiCfg.gradient, fontSize: prodiCfg.label.length > 3 ? 7 : 8 }}>
                          {prodiCfg.label}
                        </span>
                        {row.prodi}
                      </span>
                    </td>
                    <td className={styles.colAngkatan}>
                      <span className={styles.angkatanBadge}>{row.angkatan}</span>
                    </td>
                    <td className={styles.colIcp}>
                      <div className={styles.icpCell}>
                        <span className={styles.icpScore} style={{ color: tier.color }}>{row.total_poin}</span>
                        <span className={styles.icpTier}
                          style={{ background: tier.bg, color: tier.color, borderColor: tier.border }}>
                          <TierIcon size={10}/> {tier.label.split(" ")[0]}
                        </span>
                      </div>
                    </td>
                    <td className={styles.colStatus}>
                      <span className={styles.skpiStatus}
                        style={{ background: statusCfg.bg, color: statusCfg.color, borderColor: statusCfg.border }}>
                        {statusCfg.label}
                        {skpiData?.status === "resmi" && <CheckCircle2 size={10} style={{ marginLeft: 3 }}/>}
                      </span>
                    </td>
                    <td className={styles.colAksi}>
                      <div className={styles.actionGroup}>
                        <button className={styles.btnPreview}
                          onClick={() => setPreview(row)}>
                          <Eye size={13}/> Preview
                        </button>
                        {canGenerate && (
                          <button className={styles.btnGen}
                            onClick={() => setPreview(row)}
                            title="Generate SKPI">
                            <Zap size={13}/>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <span className={styles.paginInfo}>
            {total === 0 ? 0 : (safePage - 1) * PER_PAGE + 1}–{Math.min(safePage * PER_PAGE, total)} dari {total}
          </span>
          <div className={styles.paginBtns}>
            <button className={styles.pBtn} onClick={() => { setPage(1); }} disabled={safePage === 1}>«</button>
            <button className={styles.pBtn} onClick={() => { setPage(p => Math.max(1, p - 1)); }} disabled={safePage === 1}><ChevronLeft size={13}/></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .reduce((acc, p, i, arr) => { if (i > 0 && arr[i - 1] !== p - 1) acc.push("…"); acc.push(p); return acc; }, [])
              .map((p, i) => p === "…"
                ? <span key={`d${i}`} className={styles.pDots}>…</span>
                : <button key={p} className={`${styles.pBtn} ${safePage === p ? styles.pBtnOn : ""}`}
                    onClick={() => { setPage(p); }}>{p}</button>
              )}
            <button className={styles.pBtn} onClick={() => { setPage(p => Math.min(totalPages, p + 1)); }} disabled={safePage === totalPages}><ChevronRight size={13}/></button>
            <button className={styles.pBtn} onClick={() => { setPage(totalPages); }} disabled={safePage === totalPages}>»</button>
          </div>
        </div>
      )}

      {preview && (
        <PreviewModal
          mhs={preview}
          onClose={() => setPreview(null)}
          onGenerate={handleGenerate}
          onPublish={handlePublish}
          generating={generating}
          publishing={publishing}
          existingSkpi={skpiMap[preview.id_mahasiswa] || null}
        />
      )}
    </div>
  );
}