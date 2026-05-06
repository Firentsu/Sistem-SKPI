"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMahasiswa } from "@/context/MahasiswaContext";
import {
  ArrowLeft, Save, Upload, FileText, X,
  AlertCircle, CheckCircle2,
} from "lucide-react";
import styles from "../.././tambah-kegiatan/tambah.module.css"; // reuse CSS dari tambah-kegiatan
import { getDetailKegiatan, updateKegiatan } from "@/lib/api";
import { getLevelKegiatan, getTingkatPrestasi } from "@/lib/masterData";

// Sama dengan SKPI_MAP di tambah-kegiatan
const SKPI_MAP = {
  prestasi: {
    label: "1. Prestasi dan Penghargaan",
    color: "#7c3aed",
    jenis: ["Prestasi dan Kegiatan"],
    kelompok: ["Akademik", "Non-Akademik"],
    kategori: ["Lomba / Kompetisi", "Olimpiade", "Penghargaan / Award"],
    hasPrestasi: true,
  },
  keterampilan: {
    label: "2. Peningkatan Keterampilan Profesional",
    color: "#0369a1",
    jenis: ["Peningkatan Keterampilan Profesional"],
    kelompok: ["Akademik", "Profesional"],
    kategori: ["Workshop / Pelatihan", "Seminar / Webinar", "Sertifikasi Profesi", "Kursus", "Kuliah Umum / Studium Generale"],
    hasPrestasi: false,
  },
  organisasi: {
    label: "3. Pengalaman Berorganisasi & Kepemimpinan",
    color: "#065f46",
    jenis: ["Pengalaman Berorganisasi dan Kepemimpinan"],
    kelompok: ["Organisasi", "Kepemimpinan"],
    kategori: ["Pengurus Organisasi", "Kepanitiaan Kegiatan", "Komunitas / UKM", "Relawan / Sukarelawan", "Mentoring / Pembimbing"],
    hasPrestasi: false,
  },
  intelektual: {
    label: "4. Pengembangan Intelektual",
    color: "#92400e",
    jenis: ["Pengembangan Intelektual"],
    kelompok: ["Akademik", "Penelitian"],
    kategori: ["Asisten Penelitian / Riset", "Publikasi Ilmiah", "Konferensi Ilmiah", "Pertukaran Pelajar / Exchange"],
    hasPrestasi: false,
  },
  praktik: {
    label: "5. Praktik Kerja",
    color: "#b91c1c",
    jenis: ["Praktik Kerja"],
    kelompok: ["Profesional"],
    kategori: ["Magang / PKL", "Praktik Kerja Lapangan", "Kewirausahaan / Startup"],
    hasPrestasi: false,
  },
};

const LEVEL_OPTIONS = getLevelKegiatan();
const TINGKAT_PRESTASI = getTingkatPrestasi();

const PERIODE_OPTIONS = [
  "Semester Ganjil 2018/2019", "Semester Genap 2018/2019",
  "Semester Ganjil 2019/2020", "Semester Genap 2019/2020",
  "Semester Ganjil 2020/2021", "Semester Genap 2020/2021",
  "Semester Ganjil 2021/2022", "Semester Genap 2021/2022",
  "Semester Ganjil 2022/2023", "Semester Genap 2022/2023",
  "Semester Ganjil 2023/2024", "Semester Genap 2023/2024",
  "Semester Ganjil 2024/2025", "Semester Genap 2024/2025",
  "Semester Ganjil 2025/2026", "Semester Genap 2025/2026",
  "Liburan Semester Genap 2023/2024",
  "Liburan Semester Genap 2024/2025",
  "Liburan Semester Genap 2025/2026",
];

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className={`${styles.toast} ${styles[`toast${type}`]}`}>
      {type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      <span>{message}</span>
      <button onClick={onClose} className={styles.toastClose}><X size={14} /></button>
    </div>
  );
}

export default function EditKegiatanPage() {
  const router = useRouter();
  const { id } = useParams();
  const { prodiConfig } = useMahasiswa();

  const [form, setForm] = useState({
    nama_id: "", nama_en: "",
    kategori_skpi: "",
    jenis_aktivitas: "", kelompok: "", kategori: "",
    level: "", tingkat_prestasi: "",
    periode: "", lokasi: "", penyelenggara: "", tanggal: "",
    periode_mentor: "",
  });
  const [buktiDeskripsi, setBuktiDeskripsi] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [existingBukti, setExistingBukti] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const fileRef = useRef();

  const activeMap = form.kategori_skpi ? SKPI_MAP[form.kategori_skpi] : null;
  const isMentor = form.kategori_skpi === "organisasi" && form.kategori === "Mentoring / Pembimbing";

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await getDetailKegiatan(id);
        if (!data) throw new Error("Data tidak ditemukan");
        setForm({
          nama_id: data.nama_kegiatan || "",
          nama_en: data.nama_kegiatan_eng || "",
          kategori_skpi: data.kategori_skpi || "",
          jenis_aktivitas: data.jenisaktivitas?.nama_indo || "",
          kelompok: data.kelompokaktivitas?.nama_indo || "",
          kategori: data.kategoriaktivitas?.nama_indo || "",
          level: data.levelkegiatan?.nama_level || "",
          tingkat_prestasi: data.tingkat_prestasi || "",
          periode: data.periode_kegiatan || "",
          lokasi: data.lokasi || "",
          penyelenggara: data.penyelenggara || "",
          tanggal: data.tanggal_kegiatan?.slice(0, 10) || "",
          periode_mentor: data.periode_mentor || "",
        });
        setBuktiDeskripsi(data.bukti_deskripsi || "");
        setExistingBukti(data.buktikegiatan?.[0]?.file_path || null);
      } catch (err) {
        setError("Gagal memuat data kegiatan.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) loadData();
  }, [id]);

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleKategoriSKPI = (newId) => {
    const map = SKPI_MAP[newId];
    setForm(prev => ({
      ...prev,
      kategori_skpi: newId,
      jenis_aktivitas: map.jenis[0],
      kelompok: map.kelompok.length === 1 ? map.kelompok[0] : "",
      kategori: "",
      tingkat_prestasi: "",
      periode_mentor: "",
    }));
  };

  function processFile(f) {
    setUploadError("");
    if (!["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      setUploadError("Format harus PDF, JPG, PNG, atau WebP."); return;
    }
    if (f.size > 2 * 1024 * 1024) {
      setUploadError("Ukuran file maksimal 2 MB."); return;
    }
    setFile(f);
    if (f.type.startsWith("image/")) {
      const r = new FileReader(); r.onloadend = () => setPreviewUrl(r.result); r.readAsDataURL(f);
    } else setPreviewUrl(null);
  }

  const showToast = (msg, type = "success") => {
    setToast({ message: msg, type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const required = [
      "nama_id", "nama_en", "kategori_skpi", "jenis_aktivitas",
      "kelompok", "kategori", "level", "periode", "lokasi", "penyelenggara", "tanggal",
    ];
    if (required.some(k => !form[k])) {
      setError("Lengkapi semua field yang wajib diisi."); return;
    }
    if (!file && !existingBukti) {
      setError("Upload bukti kegiatan wajib dilampirkan."); return;
    }
    if (isMentor && !form.periode_mentor) {
      setError("Periode pendampingan wajib diisi untuk kegiatan mentor."); return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        tanggal_kegiatan: form.tanggal,
        bukti_deskripsi: buktiDeskripsi.trim() || null,
        periode_mentor: form.periode_mentor || null,
      };
      const res = await updateKegiatan(id, payload, file);
      if (!res.ok) {
        setError(res.data?.error || "Gagal menyimpan perubahan.");
        setSaving(false);
        return;
      }
      showToast("Perubahan berhasil disimpan!", "success");
      setTimeout(() => router.push("/mahasiswa/kegiatan"), 2000);
    } catch (err) {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const pc = prodiConfig.primary;

  if (loading) {
    return (
      <div className={styles.page} style={{ justifyContent: "center", alignItems: "center" }}>
        <div className={styles.spin} /> Memuat data...
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <ArrowLeft size={15} />
        </button>
        <div>
          <h1 className={styles.title}>Edit Kegiatan</h1>
          <p className={styles.sub}>Perbarui data kegiatan yang masih berstatus "Menunggu"</p>
        </div>
      </div>

      {error && (
        <div className={styles.alertErr}>
          <AlertCircle size={14} /> <span>{error}</span>
          <button onClick={() => setError("")}><X size={12} /></button>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* NAMA KEGIATAN */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>Nama Kegiatan</p>
          <div className={styles.row2}>
            <div className={styles.fg}>
              <label className={styles.lbl}>Nama (Indonesia) <span className={styles.req}>*</span></label>
              <input className={styles.input} value={form.nama_id}
                onChange={e => setField("nama_id", e.target.value)} />
            </div>
            <div className={styles.fg}>
              <label className={styles.lbl}>Nama (English) <span className={styles.req}>*</span></label>
              <input className={styles.input} value={form.nama_en}
                onChange={e => setField("nama_en", e.target.value)} />
            </div>
          </div>
        </div>

        {/* KATEGORI SKPI (tombol) */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>Kategori Kegiatan <span className={styles.req}>*</span></p>
          <div className={styles.katGrid}>
            {Object.entries(SKPI_MAP).map(([id, m], i) => {
              const isActive = form.kategori_skpi === id;
              return (
                <button key={id} type="button"
                  className={`${styles.katBtn} ${isActive ? styles.katBtnActive : ""}`}
                  onClick={() => handleKategoriSKPI(id)}
                  style={isActive ? { borderColor: m.color, background: `${m.color}0d`, color: m.color } : {}}>
                  <span className={styles.katNo}
                    style={{ background: isActive ? m.color : "#f5ece4", color: isActive ? "#fff" : "#9e7b5e" }}>
                    {i+1}
                  </span>
                  <span className={styles.katLabel}>{m.label}</span>
                  {isActive && <CheckCircle2 size={15} className={styles.katCheck} style={{ color: m.color }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* KLASIFIKASI */}
        {activeMap && (
          <div className={styles.card}>
            <p className={styles.cardTitle}>Klasifikasi Kegiatan</p>
            <div className={styles.row2}>
              <div className={styles.fg}>
                <label className={styles.lbl}>Jenis Aktivitas</label>
                <div className={styles.autoFill} style={{ borderColor: `${pc}40`, color: pc }}>
                  <CheckCircle2 size={13} /> {activeMap.jenis[0]}
                </div>
              </div>
              <div className={styles.fg}>
                <label className={styles.lbl}>Kelompok Aktivitas <span className={styles.req}>*</span></label>
                {activeMap.kelompok.length === 1 ? (
                  <div className={styles.autoFill} style={{ borderColor: `${pc}40`, color: pc }}>
                    <CheckCircle2 size={13} /> {activeMap.kelompok[0]}
                  </div>
                ) : (
                  <select className={styles.input} value={form.kelompok}
                    onChange={e => setField("kelompok", e.target.value)}>
                    <option value="">-- Pilih Kelompok --</option>
                    {activeMap.kelompok.map(g => <option key={g}>{g}</option>)}
                  </select>
                )}
              </div>
              <div className={styles.fg}>
                <label className={styles.lbl}>Kategori Kegiatan <span className={styles.req}>*</span></label>
                <select className={styles.input} value={form.kategori}
                  onChange={e => setField("kategori", e.target.value)}>
                  <option value="">-- Pilih Kategori --</option>
                  {activeMap.kategori.map(k => <option key={k}>{k}</option>)}
                </select>
              </div>
              <div className={styles.fg}>
                <label className={styles.lbl}>Tingkat / Level <span className={styles.req}>*</span></label>
                <select className={styles.input} value={form.level}
                  onChange={e => setField("level", e.target.value)}>
                  <option value="">-- Pilih Level --</option>
                  {LEVEL_OPTIONS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              {activeMap.hasPrestasi && (
                <div className={`${styles.fg} ${styles.fullSpan}`}>
                  <label className={styles.lbl}>Prestasi yang Diraih <span className={styles.optBadge}>opsional</span></label>
                  <select className={styles.input} value={form.tingkat_prestasi}
                    onChange={e => setField("tingkat_prestasi", e.target.value)}>
                    <option value="">-- Pilih jika ada --</option>
                    {TINGKAT_PRESTASI.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              )}
              {isMentor && (
                <div className={`${styles.fg} ${styles.fullSpan}`}>
                  <label className={styles.lbl}>Periode Pendampingan <span className={styles.req}>*</span></label>
                  <input className={styles.input} placeholder="Contoh: Semester Ganjil 2025/2026"
                    value={form.periode_mentor}
                    onChange={e => setField("periode_mentor", e.target.value)} />
                  <small className={styles.fieldNote}>Periode saat kamu menjadi mentor</small>
                </div>
              )}
            </div>
          </div>
        )}

        {/* WAKTU & TEMPAT */}
        {activeMap && (
          <div className={styles.card}>
            <p className={styles.cardTitle}>Waktu & Tempat</p>
            <div className={styles.row2}>
              <div className={styles.fg}>
                <label className={styles.lbl}>Periode Semester <span className={styles.req}>*</span></label>
                <select className={styles.input} value={form.periode}
                  onChange={e => setField("periode", e.target.value)}>
                  <option value="">-- Pilih Periode --</option>
                  {PERIODE_OPTIONS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className={styles.fg}>
                <label className={styles.lbl}>Tanggal Pelaksanaan <span className={styles.req}>*</span></label>
                <input type="date" className={styles.input} value={form.tanggal}
                  onChange={e => setField("tanggal", e.target.value)} />
              </div>
              <div className={styles.fg}>
                <label className={styles.lbl}>Lokasi / Kota <span className={styles.req}>*</span></label>
                <input className={styles.input} placeholder="Contoh: Bengkayang / Online"
                  value={form.lokasi} onChange={e => setField("lokasi", e.target.value)} />
              </div>
              <div className={styles.fg}>
                <label className={styles.lbl}>Penyelenggara <span className={styles.req}>*</span></label>
                <input className={styles.input} placeholder="Contoh: KOMINFO / Himpunan Mahasiswa TI"
                  value={form.penyelenggara} onChange={e => setField("penyelenggara", e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* BUKTI + DESKRIPSI */}
        {activeMap && (
          <div className={styles.card}>
            <p className={styles.cardTitle}>Bukti Kegiatan <span className={styles.req}>*</span></p>
            <div
              className={`${styles.dropZone} ${dragOver ? styles.dropActive : ""}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) processFile(f); }}
              onClick={() => fileRef.current?.click()}
              role="button" tabIndex={0}
              style={file || existingBukti ? { borderColor: pc, background: `${pc}06` } : dragOver ? { borderColor: pc } : {}}
            >
              <input type="file" ref={fileRef} hidden accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }} />
              {file ? (
                <div className={styles.fileRow}>
                  {previewUrl
                    ? <img src={previewUrl} alt="preview" className={styles.previewImg} />
                    : <div className={styles.pdfIcon} style={{ background: `${pc}14` }}><FileText size={24} color={pc} /></div>
                  }
                  <div className={styles.fileInfo}>
                    <p className={styles.fileName}>{file.name}</p>
                    <p className={styles.fileSize}>{(file.size/1024).toFixed(0)} KB</p>
                    <p className={styles.fileOk} style={{ color: pc }}><CheckCircle2 size={12} /> Siap diupload</p>
                  </div>
                  <button type="button" className={styles.fileRemove}
                    onClick={e => { e.stopPropagation(); setFile(null); setPreviewUrl(null); }}>
                    <X size={13} />
                  </button>
                </div>
              ) : existingBukti ? (
                <div className={styles.fileRow}>
                  <div className={styles.pdfIcon} style={{ background: `${pc}14` }}><FileText size={24} color={pc} /></div>
                  <div className={styles.fileInfo}>
                    <p className={styles.fileName}>Bukti terpasang: {existingBukti}</p>
                    <p className={styles.fileOk} style={{ color: pc }}>Kosongkan jika tidak ingin mengganti</p>
                  </div>
                  <button type="button" className={styles.fileRemove}
                    onClick={e => { e.stopPropagation(); setExistingBukti(null); setFile(null); }}>
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <div className={styles.dropContent}>
                  <div className={styles.dropIcon} style={{ background: `${pc}14` }}><Upload size={22} color={pc} /></div>
                  <p className={styles.dropText}>{dragOver ? "Lepaskan di sini…" : "Klik atau seret file bukti"}</p>
                  <p className={styles.dropHint}>PDF, JPG, PNG, WebP · maks. 2 MB</p>
                </div>
              )}
            </div>
            {uploadError && <div className={styles.uploadErr}><AlertCircle size={13} /> {uploadError}</div>}
            <div className={styles.fg} style={{ marginTop: 16 }}>
              <label className={styles.lbl}>Deskripsi Pendukung <span className={styles.optBadge}>opsional</span></label>
              <textarea className={styles.textarea} rows={2}
                placeholder="Keterangan tambahan untuk bukti"
                value={buktiDeskripsi}
                onChange={e => setBuktiDeskripsi(e.target.value)} />
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={() => router.back()}>Batal</button>
          <button type="submit" className={styles.saveBtn} style={{ background: pc }} disabled={saving}>
            {saving ? <><span className={styles.spin} /> Menyimpan…</> : <><Save size={14} /> Simpan Perubahan</>}
          </button>
        </div>
      </form>
    </div>
  );
}