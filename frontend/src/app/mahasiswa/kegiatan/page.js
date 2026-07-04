"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMahasiswa } from "@/context/MahasiswaContext";
import {
  Plus, Edit2, Trash2, X, Send,
  CheckCircle2, AlertCircle, FileText, Eye,
  Search, Filter, ChevronDown, RefreshCw,
  BookOpen,
  CheckCircle, Award, Shield, History,
  ClipboardCheck, FileCheck, Trophy, Medal, TrendingUp,
} from "lucide-react";
import styles from "./kegiatan.module.css";
import pStyles from "../pengajuan/pengajuan.module.css";
import {
  getMahasiswaKegiatan,
  deleteKegiatan,
  isMockMode,
  getMahasiswaIcp,
  getPengajuanStatus,
  submitPengajuanSkpi,
} from "@/lib/api";
// ═══ PENGAJUAN CONSTANTS ═══
const MIN_ICP = 100;

const STATUS_LABEL = {
  diproses: "Menunggu",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
  revisi: "Revisi",
};

const PENGAJUAN_STATUS_MAP = {
  menunggu:  "Diproses",
  disetujui: "Selesai",
  ditolak:   "Ditolak",
};

function getIcpLevel(poin) {
  if (poin >= 200) return { label: "Gold",   color: "#ca8a04", bg: "#fef9c3", border: "#fde047", Icon: Trophy };
  if (poin >= 150) return { label: "Silver", color: "#2563eb", bg: "#dbeafe", border: "#93c5fd", Icon: Medal  };
  if (poin >= 100) return { label: "Bronze", color: "#92400e", bg: "#fef3c7", border: "#fcd34d", Icon: Award  };
  return { label: "Belum Memenuhi", color: "#dc2626", bg: "#fee2e2", border: "#fca5a5", Icon: AlertCircle };
}

// ═══ KATEGORI SKPI ═══
const KATEGORI_SKPI_MAHASISWA = [
  { no: "1", id: "prestasi",    label: "Prestasi dan Penghargaan",                  en: "Achievement and Rewards" },
  { no: "2", id: "keterampilan",label: "Peningkatan Keterampilan Profesional",       en: "Professional Skills Improvement" },
  { no: "3", id: "organisasi",  label: "Pengalaman Berorganisasi dan Kepemimpinan", en: "Organization and Leadership" },
  { no: "4", id: "intelektual", label: "Pengembangan Intelektual",                  en: "Intellectual Development" },
  { no: "5", id: "praktik",     label: "Praktik Kerja",                             en: "Professional Work Training" },
  { no: "6", id: "pembinaan",   label: "Pembinaan Spiritual",                       en: "Spiritual Development" },
  { no: "7", id: "karakter",    label: "Pembangunan Karakter dan Kepribadian",      en: "Character and Personality Development" },
  { no: "8", id: "kursus",      label: "Kursus-kursus",                             en: "Courses" },
  { no: "9", id: "skripsi",     label: "Skripsi",                                   en: "Thesis / Final Project" },
];

// ═══ MOCK DATA ═══
const MOCK_KEGIATAN = [
  {
    id: 1, nama_id: "Workshop React.js", nama_en: "React.js Workshop",
    jenis_aktivitas: "Peningkatan Keterampilan Profesional",
    kategori_skpi: "keterampilan",
    kategori: "Workshop", kelompok: "Akademik", level: "Nasional",
    periode: "Semester Genap 2025/2026", tingkat_prestasi: "Peserta",
    lokasi: "Kampus TI", penyelenggara: "Himpunan Mahasiswa TI",
    tanggal: "2026-03-20", status: "Disetujui", bukti: "bukti1.pdf",
    bukti_deskripsi: "", periode_mentor: "", created_at: "2026-03-01",
  },
  {
    id: 2, nama_id: "Seminar AI", nama_en: "AI Seminar",
    jenis_aktivitas: "Prestasi dan Kegiatan",
    kategori_skpi: "prestasi",
    kategori: "Seminar", kelompok: "Non-Akademik", level: "Internasional",
    periode: "Semester Ganjil 2025/2026", tingkat_prestasi: "Peserta",
    lokasi: "Online", penyelenggara: "Tech Corp",
    tanggal: "2026-03-25", status: "Menunggu", bukti: null,
    bukti_deskripsi: "", periode_mentor: "", created_at: "2026-03-10",
  },
];

// ═══ TOAST ═══
function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div className={`${styles.toast} ${message.type === "success" ? styles.toastSuccess : styles.toastError}`}>
      {message.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
      <span>{message.text}</span>
      <button onClick={onClose}><X size={13} /></button>
    </div>
  );
}

// ═══ MODAL BUKTI ═══
function BuktiModal({ bukti, namaKegiatan, onClose }) {
  const isImage = bukti && /\.(jpg|jpeg|png|webp|gif)$/i.test(bukti);
  const isPdf   = bukti && /\.pdf$/i.test(bukti);

  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const buktiUrl = bukti?.startsWith("http") ? bukti : `/api/uploads/bukti/${bukti}`;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalHeaderIcon}><FileText size={15} /></div>
            <div>
              <h3 className={styles.modalTitle}>Bukti Kegiatan</h3>
              <p className={styles.modalSub}>{namaKegiatan}</p>
            </div>
          </div>
          <button className={styles.modalCloseBtn} onClick={onClose}><X size={17} /></button>
        </div>
        <div className={styles.modalBody}>
          {isImage ? (
            <div className={styles.buktiPreviewWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={buktiUrl} alt="Bukti kegiatan" className={styles.buktiImg} />
            </div>
          ) : isPdf ? (
            <div className={styles.buktiPdfWrap}>
              <iframe src={buktiUrl} title="Bukti PDF" className={styles.buktiPdfFrame} />
            </div>
          ) : (
            <div className={styles.buktiUnknown}>
              <FileText size={40} />
              <p>File tidak dapat dipreview</p>
              <a href={buktiUrl} target="_blank" rel="noopener noreferrer" className={styles.buktiDownloadBtn}>
                Unduh File
              </a>
            </div>
          )}
        </div>
        <div className={styles.modalFooter}>
          <a href={buktiUrl} target="_blank" rel="noopener noreferrer" className={styles.btnOutline} download>
            Unduh Bukti
          </a>
          <button className={styles.btnSave} onClick={onClose}>Tutup</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// HALAMAN UTAMA
// ═══════════════════════════════════════════════════
export default function KegiatanPage() {
  const router = useRouter();
  const { prodiConfig, removePendingKegiatan } = useMahasiswa();

  // ── Tab ──
  const [activeTab, setActiveTab] = useState("kegiatan");

  // ── Kegiatan state ──
  const [kegiatan, setKegiatan]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [modalBukti, setModalBukti]       = useState(null);
  const [toast, setToast]                 = useState(null);
  const [search, setSearch]               = useState("");
  const [filterStatus, setFilterStatus]   = useState("Semua");
  const [filterKategori, setFilterKategori] = useState("Semua");
  const [filterOpen, setFilterOpen]       = useState(false);

  // ── Pengajuan state ──
  const [pengajuan, setPengajuan]         = useState(null);
  const [icpData, setIcpData]             = useState({ total_poin: 0, detail: [] });
  const [pengajuanLoading, setPengajuanLoading] = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [pengajuanMsg, setPengajuanMsg]   = useState(null);

  // ── Toast helper ──
  const showToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Load kegiatan ──
  const loadKegiatan = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMahasiswaKegiatan();
      if (data && Array.isArray(data.rows)) {
        const mapped = data.rows.map(k => ({
          id: k.id_kegiatan,
          nama_id: k.nama_kegiatan,
          nama_en: k.nama_kegiatan_eng || "",
          jenis_aktivitas: k.jenisaktivitas?.nama_indo || "",
          kategori_skpi: k.kategori_skpi || "",
          kategori: k.kategoriaktivitas?.nama_indo || "",
          kelompok: k.kelompokaktivitas?.nama_indo || "",
          level: k.levelkegiatan?.nama_level || "",
          periode: k.periode_kegiatan || "",
          tingkat_prestasi: k.tingkat_prestasi || "",
          lokasi: k.lokasi || "",
          penyelenggara: k.penyelenggara || "",
          tanggal: k.tanggal_kegiatan?.slice(0, 10) || "",
          status: STATUS_LABEL[k.status_verifikasi] || k.status_verifikasi,
          catatan_admin: k.catatan_admin || "",
          bukti: k.buktikegiatan?.[0]?.file_path || null,
          bukti_deskripsi: k.bukti_deskripsi || "",
          periode_mentor: k.periode_mentor || "",
          created_at: k.created_at,
        }));
        setKegiatan(mapped);
      } else if (isMockMode()) {
        setKegiatan(MOCK_KEGIATAN);
      } else {
        setKegiatan([]);
      }
    } catch (err) {
      console.error("Gagal memuat kegiatan:", err);
      if (isMockMode()) setKegiatan(MOCK_KEGIATAN);
      else setKegiatan([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Load pengajuan & ICP data ──
  const loadPengajuanData = useCallback(async () => {
    setPengajuanLoading(true);
    try {
      const [dataPengajuan, dataIcp] = await Promise.all([
        getPengajuanStatus(),
        getMahasiswaIcp(),
      ]);
      setPengajuan(dataPengajuan);
      setIcpData(dataIcp ?? { total_poin: 0, detail: [] });
    } catch {
      setPengajuan(null);
    } finally {
      setPengajuanLoading(false);
    }
  }, []);

  useEffect(() => { loadKegiatan(); }, [loadKegiatan]);

  // Load pengajuan data saat tab aktif
  useEffect(() => {
    if (activeTab === "pengajuan") loadPengajuanData();
  }, [activeTab, loadPengajuanData]);

  // Auto-refresh saat tab aktif kembali
  useEffect(() => {
    const handleFocus = () => loadKegiatan();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [loadKegiatan]);

  useEffect(() => {
    document.title = activeTab === "pengajuan"
      ? "Pengajuan SKPI | Mahasiswa SKPI"
      : "Kegiatan Saya | SKPI Mahasiswa";
  }, [activeTab]);

  // ── Handle delete ──
  const handleDelete = async (idOrTmp) => {
    const item = kegiatan.find(k => k.id === idOrTmp || k.tmpId === idOrTmp);
    if (!item) return showToast("Kegiatan tidak ditemukan", "error");

    if (item.tmpId && !item.id) {
      if (confirm(`Batalkan kegiatan "${item.nama_id}"?`)) {
        try { removePendingKegiatan(item.tmpId); } catch {}
        setKegiatan(prev => prev.filter(p => p.tmpId !== item.tmpId));
        showToast("Kegiatan dibatalkan");
      }
      return;
    }

    if (item.status === "Disetujui") {
      showToast("Kegiatan yang sudah disetujui tidak dapat dihapus", "error");
      return;
    }
    if (confirm(`Hapus kegiatan "${item.nama_id}"?`)) {
      const result = await deleteKegiatan(item.id);
      if (result.ok) {
        showToast("Kegiatan dihapus");
        await loadKegiatan();
      } else {
        showToast(result.data?.error || "Gagal menghapus", "error");
      }
    }
  };

  // ── Handle edit ──
  const handleEdit = (k) => {
    const normalizedStatus = (k.status || "").toString().toLowerCase();
    const isMenunggu = normalizedStatus === "menunggu" || normalizedStatus === "diproses";
    if (!isMenunggu) {
      showToast("Hanya kegiatan berstatus 'Menunggu' yang dapat diedit", "error");
      return;
    }
    if (!k.id) {
      showToast("Kegiatan sementara belum bisa diedit.", "error");
      return;
    }
    router.push(`/mahasiswa/kegiatan/edit-kegiatan/${k.id}`);
  };

  // ── Handle pengajuan ──
  const handleAjukan = async () => {
    if (!canSubmit) return;
    if (!syaratTerpenuhi) {
      if (!syaratKegiatan && !syaratIcp)
        showPengajuanMsg("Belum ada kegiatan disetujui dan total ICP belum mencapai 100 poin.", "error");
      else if (!syaratKegiatan)
        showPengajuanMsg("Minimal 1 kegiatan harus disetujui admin sebelum mengajukan SKPI.", "error");
      else
        showPengajuanMsg(`Total ICP Anda ${icpTotal} poin. Minimal 100 poin (Bronze) untuk mengajukan SKPI.`, "error");
      return;
    }
    setSubmitting(true);
    const res = await submitPengajuanSkpi();
    setSubmitting(false);
    if (res.ok) {
      showPengajuanMsg("Pengajuan SKPI berhasil dikirim! Menunggu verifikasi admin.");
      await loadPengajuanData();
    } else {
      showPengajuanMsg(res.data?.error || "Gagal mengirim pengajuan.", "error");
    }
  };

  const showPengajuanMsg = (text, type = "success") => {
    setPengajuanMsg({ type, text });
    setTimeout(() => setPengajuanMsg(null), 4000);
  };

  // ── Filter lokal ──
  const filtered = kegiatan.filter(k => {
    const q = search.toLowerCase();
    const matchSearch = k.nama_id.toLowerCase().includes(q) || k.nama_en.toLowerCase().includes(q);
    const matchStatus = filterStatus === "Semua" || k.status === filterStatus;
    const matchKat = filterKategori === "Semua" || k.kategori_skpi === filterKategori;
    return matchSearch && matchStatus && matchKat;
  });

  const activeFilters = (filterStatus !== "Semua" ? 1 : 0) + (filterKategori !== "Semua" ? 1 : 0) + (search ? 1 : 0);
  const totalDisetujui = kegiatan.filter(k => k.status === "Disetujui").length;
  const totalMenunggu  = kegiatan.filter(k => k.status === "Menunggu").length;
  const kategoriTerisi = KATEGORI_SKPI_MAHASISWA.filter(k =>
    kegiatan.some(g => g.kategori_skpi === k.id && g.status === "Disetujui")
  ).length;

  // ── Pengajuan computed ──
  const kegiatanDisetujui = kegiatan.filter(k => k.status === "Disetujui");
  const totalRevisi       = kegiatan.filter(k => k.status === "Revisi").length;
  const totalMenungguPng  = kegiatan.filter(k => k.status === "Menunggu").length;
  const icpTotal          = icpData.total_poin ?? 0;
  const icpLevel          = getIcpLevel(icpTotal);
  const IcpIcon           = icpLevel.Icon;
  const syaratKegiatan    = kegiatanDisetujui.length >= 1;
  const syaratIcp         = icpTotal >= MIN_ICP;
  const syaratTerpenuhi   = syaratKegiatan && syaratIcp;
  const displayStatus     = pengajuan
    ? (PENGAJUAN_STATUS_MAP[pengajuan.status_pengajuan] ?? pengajuan.status_pengajuan)
    : "Belum Diajukan";
  const canSubmit  = !pengajuan || pengajuan.status_pengajuan === "ditolak";
  const step1Done  = syaratTerpenuhi;
  const step2Done  = step1Done && (pengajuan?.status_pengajuan === "menunggu" || pengajuan?.status_pengajuan === "disetujui");
  const step3Done  = step2Done && pengajuan?.status_pengajuan === "disetujui";
  const icpPct     = Math.min(100, Math.round((icpTotal / MIN_ICP) * 100));

  return (
    <div className={styles.container}>
      <Toast message={toast} onClose={() => setToast(null)} />

      {/* ═══ HEADER ═══ */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            {activeTab === "pengajuan" ? "Pengajuan SKPI" : "Kegiatan Saya"}
          </h1>
          <p className={styles.subtitle}>
            {activeTab === "pengajuan"
              ? "Ajukan Surat Keterangan Pendamping Ijazah setelah memenuhi syarat"
              : "Catat aktivitas sesuai kategori SKPI — diverifikasi oleh admin"}
          </p>
        </div>

        {activeTab === "kegiatan" && (
          <Link
            href="/mahasiswa/kegiatan/tambah-kegiatan"
            className={styles.addBtn}
            style={{ background: prodiConfig.primary }}
          >
            <Plus size={15} /> Tambah Kegiatan
          </Link>
        )}
        {activeTab === "pengajuan" && (
          <button
            className={styles.refreshBtn}
            onClick={loadPengajuanData}
            disabled={pengajuanLoading}
            title="Refresh data pengajuan"
          >
            <RefreshCw size={15} className={pengajuanLoading ? styles.spinIcon : ""} />
          </button>
        )}
      </div>

      {/* ═══ TAB BAR ═══ */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tab} ${activeTab === "kegiatan" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("kegiatan")}
        >
          <BookOpen size={14} /> Kegiatan Saya
        </button>
        <button
          className={`${styles.tab} ${activeTab === "pengajuan" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("pengajuan")}
        >
          <Send size={14} /> Pengajuan SKPI
        </button>
      </div>

      {/* ════════════════════════════════════════
          TAB: KEGIATAN SAYA
      ════════════════════════════════════════ */}
      {activeTab === "kegiatan" && (
        <>
          {/* ═══ STAT CARDS ═══ */}
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <span className={styles.statValue} style={{ color: prodiConfig.primary }}>{kegiatan.length}</span>
              <span className={styles.statLabel}>Total Kegiatan</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue} style={{ color: "#16a34a" }}>{totalDisetujui}</span>
              <span className={styles.statLabel}>Disetujui</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue} style={{ color: "#d97706" }}>{totalMenunggu}</span>
              <span className={styles.statLabel}>Menunggu</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue} style={{ color: "#765439" }}>
                {kategoriTerisi}
                <span style={{ fontSize: 14, fontWeight: 500 }}>/{KATEGORI_SKPI_MAHASISWA.length}</span>
              </span>
              <span className={styles.statLabel}>Kategori SKPI Terisi</span>
            </div>
          </div>

          {/* ═══ FILTER BAR ═══ */}
          <div className={styles.filterBar}>
            <div className={styles.searchWrap}>
              <Search size={14} className={styles.searchIcon} />
              <input
                type="text" placeholder="Cari nama kegiatan…"
                value={search} onChange={e => setSearch(e.target.value)}
                className={styles.searchInput}
              />
              {search && <button className={styles.searchClear} onClick={() => setSearch("")}><X size={13}/></button>}
            </div>
            <div className={styles.toolbarRight}>
              <button
                className={`${styles.filterBtn} ${filterOpen || activeFilters ? styles.filterBtnActive : ""}`}
                onClick={() => setFilterOpen(o => !o)}
              >
                <Filter size={13} /> Filter
                {activeFilters > 0 && <span className={styles.filterBadge}>{activeFilters}</span>}
                <ChevronDown size={12} className={filterOpen ? styles.chevUp : ""} />
              </button>
              <button className={styles.refreshBtn} onClick={loadKegiatan} title="Refresh">
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {/* ═══ FILTER PANEL ═══ */}
          {filterOpen && (
            <div className={styles.filterPanel}>
              <div className={styles.filterGroup}>
                <p className={styles.filterLabel}>Status</p>
                <div className={styles.chipRow}>
                  {["Semua","Menunggu","Disetujui","Ditolak","Revisi"].map(s => (
                    <button key={s}
                      className={`${styles.chip} ${filterStatus === s ? styles.chipActive : ""}`}
                      style={filterStatus === s ? { background: prodiConfig.primary, borderColor: prodiConfig.primary, color: "#fff" } : {}}
                      onClick={() => setFilterStatus(s)}>{s}</button>
                  ))}
                </div>
              </div>
              <div className={styles.filterGroup}>
                <p className={styles.filterLabel}>Kategori SKPI</p>
                <div className={styles.chipRow}>
                  <button
                    className={`${styles.chip} ${filterKategori === "Semua" ? styles.chipActive : ""}`}
                    style={filterKategori === "Semua" ? { background: prodiConfig.primary, borderColor: prodiConfig.primary, color: "#fff" } : {}}
                    onClick={() => setFilterKategori("Semua")}>Semua</button>
                  {KATEGORI_SKPI_MAHASISWA.map(k => (
                    <button key={k.id}
                      className={`${styles.chip} ${filterKategori === k.id ? styles.chipActive : ""}`}
                      style={filterKategori === k.id ? { background: prodiConfig.primary, borderColor: prodiConfig.primary, color: "#fff" } : {}}
                      onClick={() => setFilterKategori(k.id)}>{k.no}. {k.label}</button>
                  ))}
                </div>
              </div>
              {activeFilters > 0 && (
                <button className={styles.resetFilter}
                  onClick={() => { setFilterStatus("Semua"); setFilterKategori("Semua"); setSearch(""); setFilterOpen(false); }}>
                  <RefreshCw size={12} /> Reset Filter
                </button>
              )}
            </div>
          )}

          {/* ═══ TABEL ═══ */}
          <div className={styles.tableWrapper}>
            {loading ? (
              <div className={styles.loadingRow}>
                <RefreshCw size={24} className={styles.spinIcon} />
                <span>Memuat kegiatan…</span>
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nama Kegiatan</th>
                    <th>Kategori SKPI</th>
                    <th>Tanggal</th>
                    <th className={styles.thCenter}>Status</th>
                    <th className={styles.thCenter}>Bukti</th>
                    <th className={styles.thCenter}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(k => {
                    const skpiKat = KATEGORI_SKPI_MAHASISWA.find(c => c.id === k.kategori_skpi);
                    const normalizedStatus = (k.status || "").toString().toLowerCase();
                    const isMenunggu = normalizedStatus === "menunggu" || normalizedStatus === "diproses";
                    const canEdit   = isMenunggu && (!!k.id || !!k.tmpId);
                    const canDelete = !!k.tmpId || isMenunggu;
                    return (
                      <tr key={k.tmpId ?? k.id}>
                        <td>
                          <div className={styles.namaCell}>
                            <strong className={styles.namaId}>{k.nama_id}</strong>
                            {k.nama_en && <small className={styles.namaEn}>{k.nama_en}</small>}
                            {k.catatan_admin && k.status === "Revisi" && (
                              <span className={styles.catatanAdmin}>📝 {k.catatan_admin}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          {skpiKat ? (
                            <span className={styles.skpiKatBadge}
                              style={{ background: `${prodiConfig.primary}14`, color: prodiConfig.primary, borderColor: `${prodiConfig.primary}30` }}>
                              {skpiKat.no}. {skpiKat.label}
                            </span>
                          ) : <span className={styles.naKat}>—</span>}
                        </td>
                        <td className={styles.cellSecondary}>{k.tanggal}</td>
                        <td className={styles.thCenter}>
                          <span className={`${styles.statusBadge} ${styles[`status_${k.status?.toLowerCase()}`]}`}>
                            {k.status}
                          </span>
                        </td>
                        <td className={styles.thCenter}>
                          {k.bukti ? (
                            <button className={styles.buktiBtn}
                              style={{ color: prodiConfig.primary }}
                              onClick={() => setModalBukti({ bukti: k.bukti, nama: k.nama_id })}>
                              <Eye size={14} /> Lihat
                            </button>
                          ) : (
                            <span className={styles.noBukti}>—</span>
                          )}
                        </td>
                        <td className={styles.thCenter}>
                          <div className={styles.actions}>
                            <button title="Edit" onClick={() => handleEdit(k)}
                              disabled={!canEdit} className={styles.actionBtn}
                              style={canEdit ? { color: prodiConfig.primary } : {}}>
                              <Edit2 size={14} />
                            </button>
                            <button title="Hapus" onClick={() => handleDelete(k.tmpId ?? k.id)}
                              disabled={!canDelete} className={`${styles.actionBtn} ${styles.actionDanger}`}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className={styles.emptyRow}>
                        {search || filterStatus !== "Semua" || filterKategori !== "Semua"
                          ? "Tidak ada kegiatan yang sesuai filter."
                          : "Belum ada kegiatan. Klik \"Tambah Kegiatan\" untuk mulai."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* ═══ MODAL BUKTI ═══ */}
          {modalBukti && (
            <BuktiModal
              bukti={modalBukti.bukti}
              namaKegiatan={modalBukti.nama}
              onClose={() => setModalBukti(null)}
            />
          )}
        </>
      )}

      {/* ════════════════════════════════════════
          TAB: PENGAJUAN SKPI
      ════════════════════════════════════════ */}
      {activeTab === "pengajuan" && (
        <>
          {pengajuanLoading ? (
            <div className={styles.loadingRow}>
              <RefreshCw size={24} className={styles.spinIcon} />
              <span>Memuat data pengajuan…</span>
            </div>
          ) : (
            <>
              {/* ── 4 Stat Cards ── */}
              <div className={pStyles.statsGrid}>
                <div className={`${pStyles.statCard} ${pStyles.statCardGreen}`}>
                  <div className={`${pStyles.statAccent} ${pStyles.accentGreen}`}/>
                  <div className={`${pStyles.statIconWrap} ${pStyles.iconGreen}`}><Award size={18}/></div>
                  <div className={pStyles.statBody}>
                    <span className={pStyles.statValue}>{kegiatanDisetujui.length}</span>
                    <span className={pStyles.statLabel}>Kegiatan Disetujui</span>
                  </div>
                </div>

                <div className={`${pStyles.statCard} ${pStyles.statCardAmber}`}>
                  <div className={`${pStyles.statAccent} ${pStyles.accentAmber}`}/>
                  <div className={`${pStyles.statIconWrap} ${pStyles.iconAmber}`}><History size={18}/></div>
                  <div className={pStyles.statBody}>
                    <span className={pStyles.statValue}>{totalMenungguPng}</span>
                    <span className={pStyles.statLabel}>Menunggu Verifikasi</span>
                  </div>
                </div>

                <div className={pStyles.statCard}
                  style={{ borderLeft: "4px solid transparent", outline: `1px solid ${icpLevel.border}` }}>
                  <div className={pStyles.statAccent} style={{ background: icpLevel.color }}/>
                  <div className={pStyles.statIconWrap} style={{ background: icpLevel.bg, color: icpLevel.color }}>
                    <IcpIcon size={18}/>
                  </div>
                  <div className={pStyles.statBody}>
                    <span className={pStyles.statValue} style={{ color: icpLevel.color }}>{icpTotal}</span>
                    <span className={pStyles.statLabel}>Total Poin ICP</span>
                  </div>
                </div>

                <div className={`${pStyles.statCard} ${syaratTerpenuhi ? pStyles.statCardGreen : pStyles.statCardRed}`}>
                  <div className={`${pStyles.statAccent} ${syaratTerpenuhi ? pStyles.accentGreen : pStyles.accentRed}`}/>
                  <div className={`${pStyles.statIconWrap} ${syaratTerpenuhi ? pStyles.iconGreen : pStyles.iconRed}`}>
                    <Shield size={18}/>
                  </div>
                  <div className={pStyles.statBody}>
                    <span className={`${pStyles.statValue} ${syaratTerpenuhi ? pStyles.valGreen : pStyles.valRed}`}>
                      {syaratTerpenuhi ? "Terpenuhi" : "Belum"}
                    </span>
                    <span className={pStyles.statLabel}>Syarat Pengajuan</span>
                  </div>
                </div>
              </div>

              {/* ── Step Indicator ── */}
              <div className={pStyles.stepCard}>
                <h3 className={pStyles.stepCardTitle}>Alur Pengajuan SKPI</h3>
                <div className={pStyles.stepsRow}>
                  <div className={pStyles.stepItem}>
                    <div className={`${pStyles.stepCircle} ${step1Done ? pStyles.stepDone : pStyles.stepPending}`}>
                      {step1Done ? <CheckCircle size={16}/> : <span>1</span>}
                    </div>
                    <span className={`${pStyles.stepLabel} ${step1Done ? pStyles.stepLabelDone : ""}`}>Persyaratan</span>
                  </div>
                  <div className={`${pStyles.stepLine} ${step2Done ? pStyles.stepLineDone : ""}`}/>
                  <div className={pStyles.stepItem}>
                    <div className={`${pStyles.stepCircle} ${step2Done ? pStyles.stepDone : pStyles.stepPending}`}>
                      {step2Done ? <ClipboardCheck size={16}/> : <span>2</span>}
                    </div>
                    <span className={`${pStyles.stepLabel} ${step2Done ? pStyles.stepLabelDone : ""}`}>Pengajuan Dikirim</span>
                  </div>
                  <div className={`${pStyles.stepLine} ${step3Done ? pStyles.stepLineDone : ""}`}/>
                  <div className={pStyles.stepItem}>
                    <div className={`${pStyles.stepCircle} ${step3Done ? pStyles.stepDone : pStyles.stepPending}`}>
                      {step3Done ? <FileCheck size={16}/> : <span>3</span>}
                    </div>
                    <span className={`${pStyles.stepLabel} ${step3Done ? pStyles.stepLabelDone : ""}`}>SKPI Terbit</span>
                  </div>
                </div>

                <div className={pStyles.stepFooter}>
                  <div className={pStyles.statusRow}>
                    <span className={pStyles.statusLabel}>Status Pengajuan</span>
                    <span className={`${pStyles.statusBadge}
                      ${displayStatus === "Diproses" ? pStyles.badgeAmber
                      : displayStatus === "Selesai"  ? pStyles.badgeGreen
                      : displayStatus === "Ditolak"  ? pStyles.badgeRed
                      : pStyles.badgeNeutral}`}>
                      {displayStatus}
                    </span>
                  </div>

                  {pengajuan?.catatan_admin && (
                    <div className={pStyles.catatanBox}>
                      <AlertCircle size={14}/>
                      <span>Catatan Admin: {pengajuan.catatan_admin}</span>
                    </div>
                  )}

                  {displayStatus === "Diproses" && !syaratTerpenuhi && (
                    <div className={pStyles.catatanBox} style={{ borderColor: "#fca5a5", background: "#fff5f5", color: "#b91c1c" }}>
                      <AlertCircle size={14}/>
                      <span>
                        Pengajuan Anda dikirim namun persyaratan belum lengkap
                        {!syaratIcp ? ` (ICP ${icpTotal} poin, minimal 100 poin)` : ""}
                        . Hubungi admin untuk klarifikasi.
                      </span>
                    </div>
                  )}

                  {displayStatus === "Diproses" && syaratTerpenuhi && (
                    <p className={pStyles.processingNote}>
                      Pengajuan sedang diproses oleh admin. Pantau status secara berkala.
                    </p>
                  )}

                  {displayStatus === "Selesai" && (
                    <div className={pStyles.successNote}>
                      <CheckCircle size={14}/>
                      <span>SKPI telah diterbitkan. Lihat di halaman Riwayat untuk mengunduh.</span>
                    </div>
                  )}

                  {canSubmit && !syaratTerpenuhi && (
                    <div className={pStyles.syaratBelumTerpenuhi}>
                      <AlertCircle size={13}/>
                      <span>
                        {!syaratKegiatan && !syaratIcp
                          ? "Belum ada kegiatan yang disetujui dan total ICP belum mencapai 100 poin."
                          : !syaratKegiatan
                          ? "Minimal 1 kegiatan harus disetujui admin sebelum dapat mengajukan SKPI."
                          : `Total ICP Anda ${icpTotal} poin — minimal 100 poin (Bronze) untuk mengajukan SKPI.`}
                      </span>
                    </div>
                  )}

                  {canSubmit && (
                    <button
                      className={`${pStyles.ajukanBtn} ${!syaratTerpenuhi ? pStyles.ajukanBtnLocked : ""}`}
                      onClick={handleAjukan}
                      disabled={submitting}>
                      {submitting
                        ? <><RefreshCw size={15} className={pStyles.spinIcon}/> Memproses…</>
                        : <><Send size={15}/> Ajukan SKPI</>}
                    </button>
                  )}
                </div>
              </div>

              {/* ── Progress Cards ── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div className={pStyles.progressCard}>
                  <div className={pStyles.progressHeader}>
                    <span className={pStyles.progressTitle}>Kegiatan Terverifikasi</span>
                    <span className={pStyles.progressFraction}>{kegiatanDisetujui.length} / {kegiatan.length}</span>
                  </div>
                  <div className={pStyles.progressTrack}>
                    <div className={pStyles.progressFill}
                      style={{ width: kegiatan.length > 0 ? `${Math.round((kegiatanDisetujui.length / kegiatan.length) * 100)}%` : "0%" }}/>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                    <span className={pStyles.reqIcon}
                      style={{ background: syaratKegiatan ? "#dcfce7" : "#fee2e2", color: syaratKegiatan ? "#047857" : "#b91c1c", width: 22, height: 22, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      {syaratKegiatan ? <CheckCircle size={13}/> : <AlertCircle size={13}/>}
                    </span>
                    <p className={pStyles.progressNote} style={{ margin: 0 }}>
                      {syaratKegiatan ? "Syarat kegiatan terpenuhi" : "Minimal 1 kegiatan harus disetujui admin"}
                    </p>
                  </div>
                  {totalRevisi > 0 && (
                    <div className={pStyles.revisiWarning}>
                      <AlertCircle size={13}/>
                      <span>{totalRevisi} kegiatan perlu direvisi</span>
                    </div>
                  )}
                </div>

                <div className={pStyles.progressCard}>
                  <div className={pStyles.progressHeader}>
                    <span className={pStyles.progressTitle}>
                      <TrendingUp size={13} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }}/>
                      Total Poin ICP
                    </span>
                    <span className={pStyles.progressFraction} style={{ color: icpLevel.color, fontWeight: 700 }}>
                      {icpTotal} / {MIN_ICP} poin
                    </span>
                  </div>
                  <div className={pStyles.progressTrack}>
                    <div className={pStyles.progressFill}
                      style={{ width: `${icpPct}%`, background: icpLevel.color, transition: "width 0.5s ease" }}/>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span className={pStyles.reqIcon}
                        style={{ background: syaratIcp ? "#dcfce7" : "#fee2e2", color: syaratIcp ? "#047857" : "#b91c1c", width: 22, height: 22, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                        {syaratIcp ? <CheckCircle size={13}/> : <AlertCircle size={13}/>}
                      </span>
                      <p className={pStyles.progressNote} style={{ margin: 0 }}>
                        {syaratIcp ? "Syarat ICP terpenuhi" : `Kurang ${MIN_ICP - icpTotal} poin lagi`}
                      </p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                      background: icpLevel.bg, color: icpLevel.color, border: `1px solid ${icpLevel.border}` }}>
                      <IcpIcon size={10} style={{ display: "inline", marginRight: 3 }}/>{icpLevel.label}
                    </span>
                  </div>
                  {icpTotal === 0 && (
                    <div className={pStyles.revisiWarning} style={{ marginTop: 8 }}>
                      <AlertCircle size={13}/>
                      <span>Poin ICP belum tersedia. Hubungi admin untuk verifikasi ICP.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Requirements Card ── */}
              <div className={pStyles.reqCard}>
                <div className={pStyles.reqHeader}>
                  <ClipboardCheck size={16}/>
                  <h3 className={pStyles.reqTitle}>Persyaratan Pengajuan SKPI</h3>
                </div>
                <div className={pStyles.reqList}>
                  <div className={pStyles.reqItem}>
                    <span className={`${pStyles.reqIcon} ${syaratKegiatan ? pStyles.reqIconGreen : pStyles.reqIconAmber}`}>
                      {syaratKegiatan ? <CheckCircle size={15}/> : <AlertCircle size={15}/>}
                    </span>
                    <span>Minimal <strong>1 kegiatan</strong> berstatus <strong>Disetujui</strong> oleh admin
                      {" "}
                      <span style={{ color: syaratKegiatan ? "#047857" : "#b45309", fontWeight: 700 }}>
                        ({kegiatanDisetujui.length} terpenuhi)
                      </span>
                    </span>
                  </div>
                  <div className={pStyles.reqItem}>
                    <span className={`${pStyles.reqIcon} ${syaratIcp ? pStyles.reqIconGreen : pStyles.reqIconAmber}`}>
                      {syaratIcp ? <CheckCircle size={15}/> : <AlertCircle size={15}/>}
                    </span>
                    <span>Total ICP minimal <strong>100 poin</strong> (Bronze Achievement)
                      {" "}
                      <span style={{ color: syaratIcp ? "#047857" : "#b45309", fontWeight: 700 }}>
                        ({icpTotal} poin)
                      </span>
                    </span>
                  </div>
                  <div className={pStyles.reqItem}>
                    <span className={`${pStyles.reqIcon} ${pStyles.reqIconGreen}`}><CheckCircle size={15}/></span>
                    <span>Data profil (NIM, nama, prodi) sudah lengkap</span>
                  </div>
                  <div className={pStyles.reqItem}>
                    <span className={`${pStyles.reqIcon} ${pStyles.reqIconAmber}`}><Shield size={15}/></span>
                    <span>Pengajuan akan diverifikasi oleh admin. Pantau status di halaman ini.</span>
                  </div>
                  <div className={pStyles.reqItem}>
                    <span className={`${pStyles.reqIcon} ${pStyles.reqIconAmber}`}><RefreshCw size={15}/></span>
                    <span>Jika pengajuan ditolak, Anda dapat mengajukan kembali setelah melengkapi persyaratan.</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Pengajuan Toast */}
          {pengajuanMsg && (
            <div className={`${pStyles.toast} ${pengajuanMsg.type === "success" ? pStyles.toastSuccess : pStyles.toastError}`}>
              {pengajuanMsg.type === "success" ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
              <span>{pengajuanMsg.text}</span>
              <button className={pStyles.toastClose} onClick={() => setPengajuanMsg(null)}>×</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
