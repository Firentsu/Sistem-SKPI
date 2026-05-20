"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMahasiswa } from "@/context/MahasiswaContext";
import {
  ArrowLeft, Save, Upload, FileText, X,
  AlertCircle, CheckCircle2,
} from "lucide-react";
import styles from "../../tambah-kegiatan/tambah.module.css";
import { getDetailKegiatan, updateKegiatan } from "@/lib/api";
import {
  getJenisAktivitas,
  getKategoriAktivitas,
  getKelompokAktivitas,
  getLevelKegiatan,
  getTingkatPrestasi,
  getPeriodeSemester,
} from "@/lib/masterData";

// ═══ SKPI_MAP (9 kategori) ═══
const SKPI_MAP = {
  prestasi: {
    label: "1. Prestasi dan Penghargaan",
    jenis: ["Prestasi dan Kegiatan"],
    kelompok: ["Akademik", "Non-Akademik"],
    kategori: ["Lomba/Kompetisi", "Olimpiade", "Penghargaan / Award"],
    hasPrestasi: true,
    requiredFields: ["nama_id", "nama_en", "kategori_skpi", "jenis_aktivitas", "kelompok", "kategori", "level", "periode", "lokasi", "penyelenggara", "tanggal"],
    multiNama: false,
    buktiWajib: true,
  },
  keterampilan: {
    label: "2. Peningkatan Keterampilan Profesional",
    jenis: ["Peningkatan Keterampilan Profesional"],
    kelompok: ["Akademik", "Profesional"],
    kategori: ["Workshop / Pelatihan", "Sertifikasi Profesional", "Kursus"],
    hasPrestasi: false,
    requiredFields: ["nama_id", "nama_en", "kategori_skpi", "jenis_aktivitas", "kelompok", "kategori", "level", "periode", "lokasi", "penyelenggara", "tanggal"],
    multiNama: false,
    buktiWajib: true,
  },
  organisasi: {
    label: "3. Pengalaman Berorganisasi & Kepemimpinan",
    jenis: ["Pengalaman Berorganisasi dan Kepemimpinan"],
    kelompok: ["Organisasi", "Kepemimpinan"],
    kategori: ["Pengurus Organisasi", "Kepanitiaan Kegiatan", "Komunitas / UKM", "Relawan / Sukarelawan", "Mentoring / Pembimbing"],
    hasPrestasi: false,
    requiredFields: ["nama_id", "nama_en", "kategori_skpi", "jenis_aktivitas", "kelompok", "kategori", "level", "periode", "lokasi", "penyelenggara", "tanggal"],
    multiNama: false,
    buktiWajib: true,
  },
  intelektual: {
    label: "4. Pengembangan Intelektual",
    jenis: ["Pengembangan Intelektual"],
    kelompok: ["Akademik", "Penelitian"],
    kategori: ["Asisten Penelitian / Riset", "Publikasi Ilmiah", "Konferensi Ilmiah", "Pertukaran Pelajar / Exchange", "Seminar / Webinar", "Kuliah Umum / Studium Generale"],
    hasPrestasi: false,
    requiredFields: ["nama_id", "nama_en", "kategori_skpi", "jenis_aktivitas", "kelompok", "kategori", "level", "periode", "lokasi", "penyelenggara", "tanggal"],
    multiNama: false,
    buktiWajib: true,
  },
  praktik: {
    label: "5. Praktik Kerja",
    jenis: ["Praktik Kerja"],
    kelompok: ["Profesional"],
    kategori: ["Magang / PKL", "Kewirausahaan / Startup"],
    hasPrestasi: false,
    requiredFields: ["nama_id", "nama_en", "kategori_skpi", "jenis_aktivitas", "kelompok", "kategori", "level", "periode", "lokasi", "penyelenggara", "tanggal"],
    multiNama: false,
    buktiWajib: true,
  },
  pembinaan: {
    label: "6. Pembinaan Spiritual",
    jenis: ["Pembinaan Spiritual"],
    kelompok: ["Spiritual"],
    kategori: ["Ret-ret / Pembinaan"],
    hasPrestasi: false,
    requiredFields: ["nama_id", "nama_en", "kategori_skpi", "jenis_aktivitas", "kelompok", "kategori", "level", "periode", "lokasi", "penyelenggara", "tanggal"],
    multiNama: true,
    buktiWajib: true,
  },
  karakter: {
    label: "7. Pembangunan Karakter dan Kepribadian",
    jenis: ["Pembangunan Karakter dan Kepribadian"],
    kelompok: ["Karakter"],
    kategori: ["Matkul Penciri", "Pembangunan Karakter"],
    hasPrestasi: false,
    requiredFields: ["nama_id", "nama_en", "kategori_skpi", "jenis_aktivitas", "kelompok", "kategori", "level"],
    multiNama: true,
    buktiWajib: false,
  },
  kursus: {
    label: "8. Kursus-kursus",
    jenis: ["Kursus-kursus"],
    kelompok: ["Profesional", "Akademik"],
    kategori: ["Kursus Online", "Kursus Tatap Muka"],
    hasPrestasi: false,
    requiredFields: ["nama_id", "nama_en", "kategori_skpi", "jenis_aktivitas", "kelompok", "kategori"],
    multiNama: false,
    buktiWajib: true,
  },
  skripsi: {
    label: "9. Skripsi",
    jenis: ["Skripsi"],
    kelompok: ["Akademik"],
    kategori: ["Skripsi / Tugas Akhir"],
    hasPrestasi: false,
    requiredFields: ["nama_id", "nama_en", "kategori_skpi", "jenis_aktivitas", "kelompok", "kategori"],
    multiNama: false,
    buktiWajib: true,
  },
};

const JENIS_OPTIONS = getJenisAktivitas();
const KATEGORI_OPTIONS = getKategoriAktivitas();
const KELOMPOK_OPTIONS = getKelompokAktivitas();
const LEVEL_OPTIONS = getLevelKegiatan();
const TINGKAT_PRESTASI = getTingkatPrestasi();
const PERIODE_OPTIONS = getPeriodeSemester();

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
  const requiredFields = activeMap?.requiredFields ?? [];
  const isBuktiWajib = activeMap?.buktiWajib ?? true;
  const isMentor = form.kategori_skpi === "organisasi" && form.kategori === "Mentoring / Pembimbing";

  const isRequired = (fieldName) => requiredFields.includes(fieldName);
  const labelRequired = (fieldName) => isRequired(fieldName) ? <span className={styles.req}>*</span> : <span className={styles.optBadge}>opsional</span>;

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

    // Validasi field wajib sesuai kategori
    const missing = requiredFields.filter(k => !form[k]);
    if (missing.length) {
      setError("Lengkapi semua field yang wajib diisi.");
      return;
    }
    if (isBuktiWajib && !file && !existingBukti) {
      setError("Upload bukti kegiatan wajib dilampirkan.");
      return;
    }
    if (isMentor && !form.periode_mentor) {
      setError("Periode pendampingan wajib diisi untuk kegiatan mentor.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        tanggal_kegiatan: form.tanggal,
        bukti_deskripsi: buktiDeskripsi.trim() || null,
        periode_mentor: form.periode_mentor || null,
      };
      // Hapus field opsional yang kosong
      Object.keys(payload).forEach(k => {
        if (!isRequired(k) && payload[k] === "") {
          payload[k] = null;
        }
      });

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
      <div className={styles.page} style={{ justifyContent: "center", alignItems: "center", display: "flex", minHeight: "60vh" }}>
        <div className={styles.spin} style={{ marginRight: 10 }} /> Memuat data...
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
          <p className={styles.sub}>Perbarui data kegiatan yang masih berstatus &quot;Menunggu&quot;</p>
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
              <label className={styles.lbl}>Nama (Indonesia) {labelRequired("nama_id")}</label>
              <input className={styles.input} value={form.nama_id}
                onChange={e => setField("nama_id", e.target.value)} />
            </div>
            <div className={styles.fg}>
              <label className={styles.lbl}>Nama (English) {labelRequired("nama_en")}</label>
              <input className={styles.input} value={form.nama_en}
                onChange={e => setField("nama_en", e.target.value)} />
            </div>
          </div>
        </div>

        {/* KATEGORI SKPI */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>Kategori SKPI <span className={styles.req}>*</span></p>
          <div className={styles.katGrid}>
            {Object.entries(SKPI_MAP).map(([id, m]) => {
              const isActive = form.kategori_skpi === id;
              return (
                <button key={id} type="button"
                  className={`${styles.katBtn} ${isActive ? styles.katBtnActive : ""}`}
                  onClick={() => handleKategoriSKPI(id)}
                  style={isActive ? { borderColor: pc, background: `${pc}0d`, color: pc } : {}}
                >
                  <span className={styles.katNo}
                    style={{ background: isActive ? pc : "#f5ece4", color: isActive ? "#fff" : "#9e7b5e" }}>
                    {id === "pembinaan" ? "6" : id === "karakter" ? "7" : id === "kursus" ? "8" : id === "skripsi" ? "9" : id.charAt(0).toUpperCase()}
                  </span>
                  <span className={styles.katLabel}>{m.label}</span>
                  {isActive && <CheckCircle2 size={15} className={styles.katCheck} style={{ color: pc }} />}
                </button>
              );
            })}
          </div>
        </div>

        {activeMap && (
          <>
            {/* KLASIFIKASI */}
            <div className={styles.card}>
              <p className={styles.cardTitle}>Klasifikasi Kegiatan</p>
              <div className={styles.row2}>
                <div className={styles.fg}>
                  <label className={styles.lbl}>Jenis Aktivitas {labelRequired("jenis_aktivitas")}</label>
                  {activeMap.jenis.length === 1 ? (
                    <div className={styles.autoFill} style={{ borderColor: `${pc}40`, color: pc, background: `${pc}08` }}>
                      <CheckCircle2 size={13} /> {activeMap.jenis[0]}
                    </div>
                  ) : (
                    <select className={styles.input} value={form.jenis_aktivitas}
                      onChange={e => setField("jenis_aktivitas", e.target.value)}>
                      <option value="">-- Pilih Jenis --</option>
                      {activeMap.jenis.map(j => <option key={j}>{j}</option>)}
                    </select>
                  )}
                </div>
                <div className={styles.fg}>
                  <label className={styles.lbl}>Kelompok Aktivitas {labelRequired("kelompok")}</label>
                  {activeMap.kelompok.length === 1 ? (
                    <div className={styles.autoFill} style={{ borderColor: `${pc}40`, color: pc, background: `${pc}08` }}>
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
                  <label className={styles.lbl}>Kategori Kegiatan {labelRequired("kategori")}</label>
                  <select className={styles.input} value={form.kategori}
                    onChange={e => setField("kategori", e.target.value)}>
                    <option value="">-- Pilih Kategori --</option>
                    {activeMap.kategori.map(k => <option key={k}>{k}</option>)}
                  </select>
                </div>
                <div className={styles.fg}>
                  <label className={styles.lbl}>Tingkat / Level {labelRequired("level")}</label>
                  <select className={styles.input} value={form.level}
                    onChange={e => setField("level", e.target.value)}>
                    <option value="">-- Pilih Level --</option>
                    {LEVEL_OPTIONS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                {activeMap.hasPrestasi && (
                  <div className={`${styles.fg} ${styles.fullSpan}`}>
                    <label className={styles.lbl}>Prestasi yang Diraih {labelRequired("tingkat_prestasi")}</label>
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

            {/* WAKTU & TEMPAT */}
            <div className={styles.card}>
              <p className={styles.cardTitle}>Waktu & Tempat</p>
              <div className={styles.row2}>
                <div className={styles.fg}>
                  <label className={styles.lbl}>Periode Semester {labelRequired("periode")}</label>
                  <select className={styles.input} value={form.periode}
                    onChange={e => setField("periode", e.target.value)}>
                    <option value="">-- Pilih Periode --</option>
                    {PERIODE_OPTIONS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className={styles.fg}>
                  <label className={styles.lbl}>Tanggal Pelaksanaan {labelRequired("tanggal")}</label>
                  <input type="date" className={styles.input} value={form.tanggal}
                    onChange={e => setField("tanggal", e.target.value)} />
                </div>
                <div className={styles.fg}>
                  <label className={styles.lbl}>Lokasi / Kota {labelRequired("lokasi")}</label>
                  <input className={styles.input} placeholder="Contoh: Bengkayang"
                    value={form.lokasi} onChange={e => setField("lokasi", e.target.value)} />
                </div>
                <div className={styles.fg}>
                  <label className={styles.lbl}>Penyelenggara {labelRequired("penyelenggara")}</label>
                  <input className={styles.input} placeholder="Contoh: KOMINFO / Himpunan Mahasiswa TI"
                    value={form.penyelenggara} onChange={e => setField("penyelenggara", e.target.value)} />
                </div>
              </div>
            </div>

            {/* BUKTI */}
            <div className={styles.card}>
              <p className={styles.cardTitle}>Bukti Kegiatan {isBuktiWajib ? <span className={styles.req}>*</span> : <span className={styles.optBadge}>opsional</span>}</p>
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
          </>
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