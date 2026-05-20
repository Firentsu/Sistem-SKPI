"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMahasiswa } from "@/context/MahasiswaContext";
import {
  Plus, Edit2, Trash2, X,
  CheckCircle2, AlertCircle, FileText, Eye,
  Search, Filter, ChevronDown, RefreshCw,
} from "lucide-react";
import styles from "./kegiatan.module.css";
import {
  getMahasiswaKegiatan,
  deleteKegiatan,
  isMockMode,
} from "@/lib/api";
import {
  getJenisAktivitas,
  getKategoriAktivitas,
  getKelompokAktivitas,
  getLevelKegiatan,
  getTingkatPrestasi,
} from "@/lib/masterData";

// MASTER DATA
const JENIS_AKTIVITAS = getJenisAktivitas();
const KATEGORI_OPTIONS = getKategoriAktivitas();
const KELOMPOK_OPTIONS = getKelompokAktivitas();
const LEVEL_OPTIONS = getLevelKegiatan();
const TINGKAT_PRESTASI = getTingkatPrestasi();

const STATUS_LABEL = {
  diproses: "Menunggu",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
  revisi: "Revisi",
};

// ═══ KATEGORI SKPI (9 kategori) ═══
const KATEGORI_SKPI_MAHASISWA = [
  { no: "1", id: "prestasi", label: "Prestasi dan Penghargaan", en: "Achievement and Rewards" },
  { no: "2", id: "keterampilan", label: "Peningkatan Keterampilan Profesional", en: "Professional Skills Improvement" },
  { no: "3", id: "organisasi", label: "Pengalaman Berorganisasi dan Kepemimpinan", en: "Organization and Leadership" },
  { no: "4", id: "intelektual", label: "Pengembangan Intelektual", en: "Intellectual Development" },
  { no: "5", id: "praktik", label: "Praktik Kerja", en: "Professional Work Training" },
  { no: "6", id: "pembinaan", label: "Pembinaan Spiritual", en: "Spiritual Development" },
  { no: "7", id: "karakter", label: "Pembangunan Karakter dan Kepribadian", en: "Character and Personality Development" },
  { no: "8", id: "kursus", label: "Kursus-kursus", en: "Courses" },
  { no: "9", id: "skripsi", label: "Skripsi", en: "Thesis / Final Project" },
];

// Mock data (jika mode mock aktif)
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
    tanggal: "2026-03-25", status: "Menunggu", bukti: null, bukti_deskripsi: "",
    periode_mentor: "", created_at: "2026-03-10",
  },
];

// ========== TOAST ==========
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

// ========== MODAL LIHAT BUKTI ==========
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

// ========== HALAMAN UTAMA ==========
export default function KegiatanPage() {
  const router = useRouter();
  const { prodiConfig, removePendingKegiatan } = useMahasiswa();

  const [kegiatan, setKegiatan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalBukti, setModalBukti] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterKategori, setFilterKategori] = useState("Semua");
  const [filterOpen, setFilterOpen] = useState(false);

  const showToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

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

  useEffect(() => { loadKegiatan(); }, [loadKegiatan]);

  useEffect(() => {
    const handleFocus = () => loadKegiatan();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [loadKegiatan]);

  useEffect(() => { document.title = "Kegiatan Saya | SKPI Mahasiswa"; }, []);

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

  const handleEdit = (k) => {
    const normalizedStatus = (k.status || "").toString().toLowerCase();
    const isMenunggu = normalizedStatus === "menunggu" || normalizedStatus === "diproses";
    if (!isMenunggu) {
      showToast("Hanya kegiatan berstatus 'Menunggu' yang dapat diedit", "error");
      return;
    }
    if (!k.id) {
      showToast("Kegiatan sementara belum bisa diedit — hapus dan tambahkan ulang atau tunggu sinkronisasi.", "error");
      return;
    }
    router.push(`/mahasiswa/kegiatan/edit-kegiatan/${k.id}`);
  };

  const filtered = kegiatan.filter(k => {
    const q = search.toLowerCase();
    const matchSearch = k.nama_id.toLowerCase().includes(q) || k.nama_en.toLowerCase().includes(q);
    const matchStatus = filterStatus === "Semua" || k.status === filterStatus;
    const matchKat = filterKategori === "Semua" || k.kategori_skpi === filterKategori;
    return matchSearch && matchStatus && matchKat;
  });

  const activeFilters = (filterStatus !== "Semua" ? 1 : 0) + (filterKategori !== "Semua" ? 1 : 0) + (search ? 1 : 0);
  const totalDisetujui = kegiatan.filter(k => k.status === "Disetujui").length;
  const totalMenunggu = kegiatan.filter(k => k.status === "Menunggu").length;

  // Hitung kategori yang sudah terisi (disetujui)
  const kategoriTerisi = KATEGORI_SKPI_MAHASISWA.filter(k =>
    kegiatan.some(g => g.kategori_skpi === k.id && g.status === "Disetujui")
  ).length;

  return (
    <div className={styles.container}>
      <Toast message={toast} onClose={() => setToast(null)} />

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Kegiatan Saya</h1>
          <p className={styles.subtitle}>Catat aktivitas sesuai kategori SKPI — diverifikasi oleh admin</p>
        </div>
        <Link
          href="/mahasiswa/kegiatan/tambah-kegiatan"
          className={styles.addBtn}
          style={{ background: prodiConfig.primary }}
        >
          <Plus size={15} /> Tambah Kegiatan
        </Link>
      </div>

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
                <th>Jenis</th>
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
                const canEdit = isMenunggu && (!!k.id || !!k.tmpId);
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
                    <td className={styles.cellSecondary}>{k.jenis_aktivitas}</td>
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

      {modalBukti && (
        <BuktiModal
          bukti={modalBukti.bukti}
          namaKegiatan={modalBukti.nama}
          onClose={() => setModalBukti(null)}
        />
      )}
    </div>
  );
}