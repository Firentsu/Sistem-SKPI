"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { useMahasiswa } from "@/context/MahasiswaContext";
import {
  Plus, Edit2, Trash2, Upload, FileImage, X,
  CheckCircle2, AlertCircle, FileText, Eye,
  Search, Filter, ChevronDown, RefreshCw,
} from "lucide-react";
import styles from "./kegiatan.module.css";
import {
  getMahasiswaKegiatan,
  editKegiatan,
  deleteKegiatan,
  isMockMode, // ← penting untuk cek mode
} from "@/lib/api";
import {
  getJenisAktivitas,
  getKategoriAktivitas,
  getKelompokAktivitas,
  getLevelKegiatan,
  getTingkatPrestasi,
} from "@/lib/masterData";

/* ─────────────────────────────────────────
   MASTER DATA
───────────────────────────────────────── */
const JENIS_AKTIVITAS  = getJenisAktivitas();
const KATEGORI_OPTIONS = getKategoriAktivitas();
const KELOMPOK_OPTIONS = getKelompokAktivitas();
const LEVEL_OPTIONS    = getLevelKegiatan();
const TINGKAT_PRESTASI = getTingkatPrestasi();

// Mapping status DB → label UI
const STATUS_LABEL = {
  diproses:  "Menunggu",
  disetujui: "Disetujui",
  ditolak:   "Ditolak",
  revisi:    "Revisi",
};

// Kategori SKPI yang bisa diisi mahasiswa (sesuai template)
const KATEGORI_SKPI_MAHASISWA = [
  { no: "1", id: "prestasi",     label: "Prestasi dan Penghargaan",                     en: "Achievement and Rewards" },
  { no: "2", id: "keterampilan", label: "Peningkatan Keterampilan Profesional",          en: "Professional Skills Improvement" },
  { no: "3", id: "organisasi",   label: "Pengalaman Berorganisasi dan Kepemimpinan",     en: "Organization and Leadership" },
  { no: "4", id: "intelektual",  label: "Pengembangan Intelektual",                      en: "Intellectual Development" },
  { no: "5", id: "praktik",      label: "Praktik Kerja",                                 en: "Professional Work Training" },
];

// Mock data HANYA untuk mode mock (backend tidak aktif)
const MOCK_KEGIATAN = [
  {
    id: 1, nama_id: "Workshop React.js", nama_en: "React.js Workshop",
    jenis_aktivitas: "Peningkatan Keterampilan Profesional",
    kategori_skpi: "keterampilan",
    kategori: "Workshop", kelompok: "Akademik", level: "Nasional",
    periode: "Semester Genap 2025/2026", tingkat_prestasi: "Peserta",
    lokasi: "Kampus TI", penyelenggara: "Himpunan Mahasiswa TI",
    tanggal: "2026-03-20", status: "Disetujui", bukti: "bukti1.pdf", created_at: "2026-03-01",
  },
  {
    id: 2, nama_id: "Seminar AI", nama_en: "AI Seminar",
    jenis_aktivitas: "Prestasi dan Kegiatan",
    kategori_skpi: "prestasi",
    kategori: "Seminar", kelompok: "Non-Akademik", level: "Internasional",
    periode: "Semester Ganjil 2025/2026", tingkat_prestasi: "Peserta",
    lokasi: "Online", penyelenggara: "Tech Corp",
    tanggal: "2026-03-25", status: "Menunggu", bukti: null, created_at: "2026-03-10",
  },
  {
    id: 3, nama_id: "Magang Startup", nama_en: "Startup Internship",
    jenis_aktivitas: "Praktik Kerja",
    kategori_skpi: "praktik",
    kategori: "Magang", kelompok: "Profesional", level: "Lokal",
    periode: "Liburan Semester", tingkat_prestasi: "",
    lokasi: "Jakarta", penyelenggara: "Startup.id",
    tanggal: "2026-03-10", status: "Ditolak", bukti: "bukti3.pdf", created_at: "2026-02-20",
  },
];

/* ─────────────────────────────────────────
   TOAST
───────────────────────────────────────── */
function Toast({ message, onClose }) {
  if (!message) return null;
  const isOk = message.type === "success";
  return (
    <div className={`${styles.toast} ${isOk ? styles.toastSuccess : styles.toastError}`}>
      {isOk ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
      <span>{message.text}</span>
      <button onClick={onClose}><X size={13} /></button>
    </div>
  );
}

/* ─────────────────────────────────────────
   MODAL LIHAT BUKTI
───────────────────────────────────────── */
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
              <iframe
                src={buktiUrl}
                title="Bukti PDF"
                className={styles.buktiPdfFrame}
              />
            </div>
          ) : (
            <div className={styles.buktiUnknown}>
              <FileText size={40} />
              <p>File tidak dapat dipreview</p>
              <a href={buktiUrl} target="_blank" rel="noopener noreferrer"
                className={styles.buktiDownloadBtn}>
                Unduh File
              </a>
            </div>
          )}
        </div>
        <div className={styles.modalFooter}>
          <a href={buktiUrl} target="_blank" rel="noopener noreferrer"
            className={styles.btnOutline} download>
            Unduh Bukti
          </a>
          <button className={styles.btnSave} onClick={onClose}>Tutup</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MODAL EDIT KEGIATAN
───────────────────────────────────────── */
function EditKegiatanModal({ isOpen, onClose, onSave, kegiatan, prodiColor }) {
  const [form, setForm] = useState(kegiatan || {
    nama_id: "", nama_en: "", jenis_aktivitas: "", kategori_skpi: "",
    kategori: "", kelompok: "", level: "", periode: "",
    tingkat_prestasi: "", lokasi: "", penyelenggara: "", tanggal: "", bukti: null,
  });
  const [file,        setFile]        = useState(null);
  const [previewUrl,  setPreviewUrl]  = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [dragOver,    setDragOver]    = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    if (isOpen && kegiatan) { setForm(kegiatan); setFile(null); setPreviewUrl(null); setUploadError(""); }
  }, [isOpen, kegiatan]);

  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  function processFile(f) {
    setUploadError("");
    if (!["application/pdf","image/jpeg","image/png","image/webp"].includes(f.type)) {
      setUploadError("Format harus PDF, JPG, PNG, atau WebP"); return;
    }
    if (f.size > 2 * 1024 * 1024) { setUploadError("Ukuran maksimal 2 MB"); return; }
    setFile(f);
    if (f.type.startsWith("image/")) {
      const r = new FileReader(); r.onloadend = () => setPreviewUrl(r.result); r.readAsDataURL(f);
    } else setPreviewUrl(null);
  }

  const handleSubmit = e => {
    e.preventDefault();
    const req = ["nama_id","nama_en","jenis_aktivitas","kategori_skpi","kategori","kelompok","level","periode","lokasi","penyelenggara","tanggal"];
    if (req.some(k => !form[k])) { alert("Lengkapi semua field bertanda *"); return; }
    if (!file && !kegiatan?.bukti) { alert("Upload bukti kegiatan (wajib)"); return; }
    onSave({ ...form, _file: file });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalHeaderIcon}><Edit2 size={15} /></div>
            <div>
              <h3 className={styles.modalTitle}>Edit Kegiatan</h3>
              <p className={styles.modalSub}>Perbarui data kegiatan — hanya tersedia saat status Menunggu</p>
            </div>
          </div>
          <button className={styles.modalCloseBtn} onClick={onClose}><X size={17} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {/* Nama */}
            <div className={styles.sectionLabel}>IDENTITAS KEGIATAN</div>
            <div className={styles.formRow2}>
              <div className={styles.fg}>
                <label className={styles.fl}>Nama (Indonesia) <span className={styles.req}>*</span></label>
                <input className={styles.input} value={form.nama_id}
                  onChange={e => setForm(p => ({...p, nama_id: e.target.value}))}
                  placeholder="Contoh: Workshop React.js" />
              </div>
              <div className={styles.fg}>
                <label className={styles.fl}>Nama (English) <span className={styles.req}>*</span></label>
                <input className={styles.input} value={form.nama_en}
                  onChange={e => setForm(p => ({...p, nama_en: e.target.value}))}
                  placeholder="Example: React.js Workshop" />
              </div>
            </div>

            {/* Kategori SKPI */}
            <div className={styles.sectionLabel}>KATEGORI SKPI</div>
            <div className={styles.formRow2}>
              <div className={styles.fg}>
                <label className={styles.fl}>Kategori SKPI <span className={styles.req}>*</span></label>
                <select className={styles.input} value={form.kategori_skpi}
                  onChange={e => setForm(p => ({...p, kategori_skpi: e.target.value}))}>
                  <option value="">-- Pilih Kategori SKPI --</option>
                  {KATEGORI_SKPI_MAHASISWA.map(k => (
                    <option key={k.id} value={k.id}>{k.no}. {k.label}</option>
                  ))}
                </select>
              </div>
              <div className={styles.fg}>
                <label className={styles.fl}>Jenis Aktivitas <span className={styles.req}>*</span></label>
                <select className={styles.input} value={form.jenis_aktivitas}
                  onChange={e => setForm(p => ({...p, jenis_aktivitas: e.target.value}))}>
                  <option value="">-- Pilih Jenis Aktivitas --</option>
                  {JENIS_AKTIVITAS.map(j => <option key={j}>{j}</option>)}
                </select>
              </div>
            </div>
            <div className={styles.formRow2}>
              <div className={styles.fg}>
                <label className={styles.fl}>Kategori Kegiatan <span className={styles.req}>*</span></label>
                <select className={styles.input} value={form.kategori}
                  onChange={e => setForm(p => ({...p, kategori: e.target.value}))}>
                  <option value="">-- Pilih Kategori --</option>
                  {KATEGORI_OPTIONS.map(k => <option key={k}>{k}</option>)}
                </select>
              </div>
              <div className={styles.fg}>
                <label className={styles.fl}>Kelompok <span className={styles.req}>*</span></label>
                <select className={styles.input} value={form.kelompok}
                  onChange={e => setForm(p => ({...p, kelompok: e.target.value}))}>
                  <option value="">-- Pilih Kelompok --</option>
                  {KELOMPOK_OPTIONS.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div className={styles.formRow2}>
              <div className={styles.fg}>
                <label className={styles.fl}>Level <span className={styles.req}>*</span></label>
                <select className={styles.input} value={form.level}
                  onChange={e => setForm(p => ({...p, level: e.target.value}))}>
                  <option value="">-- Pilih Level --</option>
                  {LEVEL_OPTIONS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div className={styles.fg}>
                <label className={styles.fl}>Tingkat Prestasi</label>
                <select className={styles.input} value={form.tingkat_prestasi}
                  onChange={e => setForm(p => ({...p, tingkat_prestasi: e.target.value}))}>
                  <option value="">-- Opsional --</option>
                  {TINGKAT_PRESTASI.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Waktu & Tempat */}
            <div className={styles.sectionLabel}>WAKTU & TEMPAT</div>
            <div className={styles.formRow2}>
              <div className={styles.fg}>
                <label className={styles.fl}>Periode <span className={styles.req}>*</span></label>
                <input className={styles.input} placeholder="Contoh: Semester Ganjil 2025"
                  value={form.periode} onChange={e => setForm(p => ({...p, periode: e.target.value}))} />
              </div>
              <div className={styles.fg}>
                <label className={styles.fl}>Tanggal Pelaksanaan <span className={styles.req}>*</span></label>
                <input type="date" className={styles.input} value={form.tanggal}
                  onChange={e => setForm(p => ({...p, tanggal: e.target.value}))} />
              </div>
            </div>
            <div className={styles.formRow2}>
              <div className={styles.fg}>
                <label className={styles.fl}>Lokasi <span className={styles.req}>*</span></label>
                <input className={styles.input} placeholder="Contoh: Bengkayang / Online"
                  value={form.lokasi} onChange={e => setForm(p => ({...p, lokasi: e.target.value}))} />
              </div>
              <div className={styles.fg}>
                <label className={styles.fl}>Penyelenggara <span className={styles.req}>*</span></label>
                <input className={styles.input} placeholder="Contoh: Himpunan Mahasiswa TI"
                  value={form.penyelenggara} onChange={e => setForm(p => ({...p, penyelenggara: e.target.value}))} />
              </div>
            </div>

            {/* Upload Bukti */}
            <div className={styles.sectionLabel}>BUKTI KEGIATAN</div>
            <div
              className={`${styles.uploadZone} ${dragOver ? styles.uploadZoneActive : ""}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) processFile(f); }}
              onClick={() => fileRef.current?.click()}
              role="button" tabIndex={0}
              onKeyDown={e => e.key === "Enter" && fileRef.current?.click()}
              style={{ borderColor: dragOver ? prodiColor : undefined }}
            >
              <input type="file" ref={fileRef} hidden
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }} />
              {file ? (
                <div className={styles.uploadPreview}>
                  {previewUrl
                    ? <img src={previewUrl} alt="preview" className={styles.previewImg} />
                    : <FileText size={32} color={prodiColor} />}
                  <div className={styles.uploadPreviewInfo}>
                    <span className={styles.uploadFileName}>{file.name}</span>
                    <span className={styles.uploadFileSize}>{(file.size/1024).toFixed(0)} KB</span>
                  </div>
                  <button type="button" className={styles.uploadRemoveBtn}
                    onClick={e => { e.stopPropagation(); setFile(null); setPreviewUrl(null); }}>
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <div className={styles.uploadPlaceholder}>
                  <div className={styles.uploadIconWrap} style={{ background: `${prodiColor}18` }}>
                    <Upload size={20} color={prodiColor} />
                  </div>
                  <p className={styles.uploadText}>{dragOver ? "Lepaskan di sini…" : "Klik atau seret file bukti"}</p>
                  <p className={styles.uploadHint}>Sertifikat / SK / Foto · PDF, JPG, PNG, WebP · maks. 2 MB</p>
                </div>
              )}
            </div>
            {uploadError && <div className={styles.uploadError}><AlertCircle size={13}/> {uploadError}</div>}
            {kegiatan?.bukti && !file && (
              <div className={styles.uploadExisting}>
                <FileText size={13}/> Bukti terpasang: <strong>{kegiatan.bukti}</strong>
                <span className={styles.uploadExistingNote}>(biarkan kosong jika tidak ingin mengganti)</span>
              </div>
            )}
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnGhost} onClick={onClose}>Batal</button>
            <button type="submit" className={styles.btnSave} style={{ background: prodiColor }}>
              <CheckCircle2 size={14} /> Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   HALAMAN UTAMA
───────────────────────────────────────── */
export default function KegiatanPage() {
  const { prodiConfig } = useMahasiswa();

  const [kegiatan,      setKegiatan]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [modalEdit,     setModalEdit]     = useState(null);
  const [modalBukti,    setModalBukti]    = useState(null);
  const [toast,         setToast]         = useState(null);
  const [search,        setSearch]        = useState("");
  const [filterStatus,  setFilterStatus]  = useState("Semua");
  const [filterKategori,setFilterKategori]= useState("Semua");
  const [filterOpen,    setFilterOpen]    = useState(false);

  const showToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadKegiatan = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMahasiswaKegiatan();
      // Jika API mengembalikan data dengan properti rows (array)
      if (data && Array.isArray(data.rows)) {
        const mapped = data.rows.map(k => ({
          id:              k.id_kegiatan,
          nama_id:         k.nama_kegiatan,
          nama_en:         k.nama_kegiatan_eng || "",
          jenis_aktivitas: k.jenisaktivitas?.nama_indo || "",
          kategori_skpi:   k.kategori_skpi || "",
          kategori:        k.kategoriaktivitas?.nama_indo || "",
          kelompok:        k.kelompokaktivitas?.nama_indo || "",
          level:           k.levelkegiatan?.nama_level || "",
          periode:         k.periode_kegiatan || "",
          tingkat_prestasi:k.tingkat_prestasi || "",
          lokasi:          k.lokasi || "",
          penyelenggara:   k.penyelenggara || "",
          tanggal:         k.tanggal_kegiatan?.slice(0, 10) || "",
          status:          STATUS_LABEL[k.status_verifikasi] || k.status_verifikasi,
          catatan_admin:   k.catatan_admin || "",
          bukti:           k.buktikegiatan?.[0]?.file_path || null,
          created_at:      k.created_at,
        }));
        setKegiatan(mapped);
      } else if (isMockMode()) {
        // Hanya gunakan mock jika mode mock aktif (backend tidak tersedia)
        setKegiatan(MOCK_KEGIATAN);
      } else {
        // Backend aktif tapi data tidak sesuai, tetap kosong
        setKegiatan([]);
      }
    } catch (err) {
      console.error("Gagal memuat kegiatan:", err);
      if (isMockMode()) {
        setKegiatan(MOCK_KEGIATAN);
      } else {
        setKegiatan([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadKegiatan(); }, [loadKegiatan]);
  useEffect(() => { document.title = "Kegiatan Saya | SKPI Mahasiswa"; }, []);

  const handleSaveEdit = async (data) => {
    const { _file, ...rest } = data;
    const result = await editKegiatan(modalEdit.id, rest, _file);
    if (result.ok) {
      showToast("Kegiatan berhasil diperbarui");
      await loadKegiatan();
    } else {
      showToast(result.data?.error || "Gagal update kegiatan", "error");
    }
    setModalEdit(null);
  };

  const handleDelete = async (id) => {
    const item = kegiatan.find(k => k.id === id);
    if (item?.status === "Disetujui") {
      showToast("Kegiatan yang sudah disetujui tidak dapat dihapus", "error"); return;
    }
    if (confirm(`Hapus kegiatan "${item?.nama_id}"?`)) {
      const result = await deleteKegiatan(id);
      if (result.ok) {
        showToast("Kegiatan dihapus");
        await loadKegiatan();
      } else {
        showToast(result.data?.error || "Gagal menghapus", "error");
      }
    }
  };

  const handleEdit = (k) => {
    if (k.status !== "Menunggu") {
      showToast("Hanya kegiatan berstatus 'Menunggu' yang dapat diedit", "error"); return;
    }
    setModalEdit(k);
  };

  // Filter
  const filtered = kegiatan.filter(k => {
    const q = search.toLowerCase();
    const matchSearch = k.nama_id.toLowerCase().includes(q) || k.nama_en.toLowerCase().includes(q);
    const matchStatus = filterStatus === "Semua" || k.status === filterStatus;
    const matchKat    = filterKategori === "Semua" || k.kategori_skpi === filterKategori;
    return matchSearch && matchStatus && matchKat;
  });

  const activeFilters = (filterStatus !== "Semua" ? 1 : 0) + (filterKategori !== "Semua" ? 1 : 0) + (search ? 1 : 0);

  const totalDisetujui = kegiatan.filter(k => k.status === "Disetujui").length;
  const totalMenunggu  = kegiatan.filter(k => k.status === "Menunggu").length;

  return (
    <div className={styles.container}>
      <Toast message={toast} onClose={() => setToast(null)} />

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Kegiatan Saya</h1>
          <p className={styles.subtitle}>Catat aktivitas sesuai kategori SKPI — diverifikasi oleh admin</p>
        </div>
        <Link href="/mahasiswa/kegiatan/tambah-kegiatan"
          className={styles.addBtn} style={{ background: prodiConfig.primary }}>
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
            {KATEGORI_SKPI_MAHASISWA.filter(k => kegiatan.some(g => g.kategori_skpi === k.id && g.status === "Disetujui")).length}
            <span style={{ fontSize: 14, fontWeight: 500 }}>/{KATEGORI_SKPI_MAHASISWA.length}</span>
          </span>
          <span className={styles.statLabel}>Kategori SKPI Terisi</span>
        </div>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input type="text" placeholder="Cari nama kegiatan…"
            value={search} onChange={e => setSearch(e.target.value)}
            className={styles.searchInput} />
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
                const canEdit = k.status === "Menunggu";
                return (
                  <tr key={k.id}>
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
                        <button title="Hapus" onClick={() => handleDelete(k.id)}
                          disabled={!canEdit} className={`${styles.actionBtn} ${styles.actionDanger}`}>
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

      <EditKegiatanModal
        isOpen={!!modalEdit}
        onClose={() => setModalEdit(null)}
        onSave={handleSaveEdit}
        kegiatan={modalEdit}
        prodiColor={prodiConfig.primary}
      />

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