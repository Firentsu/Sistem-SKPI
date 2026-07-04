"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMahasiswa } from "@/context/MahasiswaContext";
import {
  ArrowLeft, Save, Upload, FileText, X,
  AlertCircle, CheckCircle2, Plus, Trash2,
} from "lucide-react";
import styles from "./tambah.module.css";
import { submitKegiatan, uploadBuktiKegiatan } from "@/lib/api";
import {
  getJenisAktivitas,
  getKategoriAktivitas,
  getKelompokAktivitas,
  getLevelKegiatan,
  getTingkatPrestasi,
  getPeriodeSemester,
  refreshMasterData,
} from "@/lib/masterData";

/* ─────────────────────────────────────────
   KATEGORI SKPI → Mapping master data
───────────────────────────────────────── */
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

const EMPTY_FORM = {
  nama_id: "",
  nama_en: "",
  kategori_skpi: "",
  jenis_aktivitas: "",
  kelompok: "",
  kategori: "",
  level: "",
  tingkat_prestasi: "",
  periode: "",
  lokasi: "",
  penyelenggara: "",
  tanggal: "",
};

// ── Toast ──
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

export default function TambahKegiatanPage() {
  const router = useRouter();
  const { prodiConfig } = useMahasiswa();

  // Opsi dropdown diambil dari master data (DB) via state agar ikut ter-render
  // ulang setelah data API tiba. Nilai awal = default agar UI tidak kosong.
  const [JENIS_OPTIONS,    setJenisOptions]    = useState(getJenisAktivitas);
  const [KATEGORI_OPTIONS, setKategoriOptions] = useState(getKategoriAktivitas);
  const [KELOMPOK_OPTIONS, setKelompokOptions] = useState(getKelompokAktivitas);
  const [LEVEL_OPTIONS,    setLevelOptions]    = useState(getLevelKegiatan);
  const [TINGKAT_OPTIONS,  setTingkatOptions]  = useState(getTingkatPrestasi);
  const [PERIODE_OPTIONS,  setPeriodeOptions]  = useState(getPeriodeSemester);

  useEffect(() => {
    let alive = true;
    refreshMasterData().then(() => {
      if (!alive) return;
      setJenisOptions(getJenisAktivitas());
      setKategoriOptions(getKategoriAktivitas());
      setKelompokOptions(getKelompokAktivitas());
      setLevelOptions(getLevelKegiatan());
      setTingkatOptions(getTingkatPrestasi());
      setPeriodeOptions(getPeriodeSemester());
    });
    return () => { alive = false; };
  }, []);

  const [form, setForm] = useState(EMPTY_FORM);
  const [namaList, setNamaList] = useState([{ id: 1, nama_id: "", nama_en: "" }]);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState(null);
  const [buktiDeskripsi, setBuktiDeskripsi] = useState("");
  const fileRef = useRef();

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const activeMap = SKPI_MAP[form.kategori_skpi] || null;
  const filteredJenis    = activeMap ? JENIS_OPTIONS.filter(j => activeMap.jenis.includes(j)) : [];
  const filteredKelompok = activeMap ? KELOMPOK_OPTIONS.filter(k => activeMap.kelompok.includes(k)) : [];
  const filteredKategori = activeMap ? KATEGORI_OPTIONS.filter(k => activeMap.kategori.includes(k)) : [];
  const showTingkatPrestasi = activeMap?.hasPrestasi ?? false;

  const requiredFields = activeMap?.requiredFields ?? [];
  const isMultiNama = activeMap?.multiNama ?? false;
  const isBuktiWajib = activeMap?.buktiWajib ?? true;

  const isRequired = (fieldName) => requiredFields.includes(fieldName);
  const labelRequired = (fieldName) => isRequired(fieldName) ? <span className={styles.req}>*</span> : <span className={styles.optBadge}>opsional</span>;

  const handlePilihKategori = (id) => {
    const map = SKPI_MAP[id];
    if (!map) return;
    const jenisFiltered = JENIS_OPTIONS.filter(j => map.jenis.includes(j));
    const kelompokFiltered = KELOMPOK_OPTIONS.filter(k => map.kelompok.includes(k));
    setForm({
      kategori_skpi: id,
      jenis_aktivitas: jenisFiltered.length === 1 ? jenisFiltered[0] : "",
      kelompok: kelompokFiltered.length === 1 ? kelompokFiltered[0] : "",
      kategori: "",
      level: "",
      tingkat_prestasi: "",
      periode: "",
      lokasi: "",
      penyelenggara: "",
      tanggal: "",
    });
    setNamaList([{ id: Date.now(), nama_id: "", nama_en: "" }]);
    setFile(null);
    setPreviewUrl(null);
  };

  const addNama = () => {
    setNamaList(prev => [...prev, { id: Date.now(), nama_id: "", nama_en: "" }]);
  };

  const removeNama = (id) => {
    setNamaList(prev => prev.filter(item => item.id !== id));
  };

  const updateNama = (id, field, value) => {
    setNamaList(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
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
      const r = new FileReader();
      r.onloadend = () => setPreviewUrl(r.result);
      r.readAsDataURL(f);
    } else setPreviewUrl(null);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // validasi field wajib (global, tanpa nama kegiatan)
    const missing = requiredFields.filter(k => !form[k]);
    if (missing.length) {
      setError("Lengkapi semua field yang wajib diisi.");
      return;
    }

    // validasi nama kegiatan
    if (isMultiNama) {
      const validNama = namaList.every(n => n.nama_id.trim() !== "");
      if (!validNama || namaList.length === 0) {
        setError("Minimal satu nama kegiatan wajib diisi.");
        return;
      }
    } else {
      if (!form.nama_id || !form.nama_en) {
        setError("Nama kegiatan wajib diisi.");
        return;
      }
    }

    if (isBuktiWajib && !file) {
      setError("Upload bukti kegiatan wajib dilampirkan.");
      return;
    }

    setLoading(true);

    const commonPayload = {
      ...form,
      tanggal_kegiatan: form.tanggal || null,
      bukti_deskripsi: buktiDeskripsi.trim() || null,
    };
    Object.keys(commonPayload).forEach(k => {
      if (!isRequired(k) && commonPayload[k] === "") {
        commonPayload[k] = null;
      }
    });

    let kegIds = [];

    try {
      if (isMultiNama) {
        for (const namaItem of namaList) {
          const payload = {
            ...commonPayload,
            nama_id: namaItem.nama_id.trim(),
            nama_en: namaItem.nama_en.trim(),
          };
          const res = await submitKegiatan(payload);
          if (!res.ok) {
            setError(res.data?.error || "Gagal menyimpan kegiatan.");
            setLoading(false);
            return;
          }
          const kegId = res.data?.id_kegiatan || res.data?.id;
          kegIds.push(kegId);
        }
      } else {
        const payload = {
          ...commonPayload,
          nama_id: form.nama_id,
          nama_en: form.nama_en,
        };
        const res = await submitKegiatan(payload);
        if (!res.ok) {
          setError(res.data?.error || "Gagal menyimpan kegiatan.");
          setLoading(false);
          return;
        }
        const kegId = res.data?.id_kegiatan || res.data?.id;
        kegIds.push(kegId);
      }

      // upload bukti untuk setiap kegiatan yang berhasil dibuat
      if (file && kegIds.length > 0) {
        for (const kegId of kegIds) {
          const fd = new FormData();
          fd.append("bukti", file, file.name);
          await uploadBuktiKegiatan(kegId, fd);
        }
      }

      setSuccess(true);
      const msg = isMultiNama
        ? `${kegIds.length} kegiatan berhasil disimpan!`
        : "Kegiatan berhasil disimpan!";
      showToast(`✓ ${msg} Menunggu verifikasi admin.`, "success");
      setTimeout(() => router.push("/mahasiswa/kegiatan"), 2500);
    } catch (err) {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const pc = prodiConfig.primary;

  return (
    <div className={styles.page}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <ArrowLeft size={15} />
        </button>
        <div>
          <h1 className={styles.title}>Tambah Kegiatan</h1>
          <p className={styles.sub}>Isi data kegiatan sesuai sertifikat yang kamu miliki</p>
        </div>
      </div>

      {error && (
        <div className={styles.alertErr}>
          <AlertCircle size={14} /> <span>{error}</span>
          <button onClick={() => setError("")}><X size={12} /></button>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>

        {/* STEP 1 — NAMA KEGIATAN */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>Nama Kegiatan</p>

          {isMultiNama ? (
            <div className={styles.namaList}>
              {namaList.map((item, idx) => (
                <div key={item.id} className={styles.namaRow}>
                  <div className={styles.namaFields}>
                    <div className={styles.fg}>
                      <label className={styles.lbl}>Nama (ID) {labelRequired("nama_id")}</label>
                      <input className={styles.input}
                        value={item.nama_id || ""}
                        onChange={e => updateNama(item.id, "nama_id", e.target.value)}
                        placeholder="Nama kegiatan" />
                    </div>
                    <div className={styles.fg}>
                      <label className={styles.lbl}>Nama (EN) {labelRequired("nama_en")}</label>
                      <input className={styles.input}
                        value={item.nama_en || ""}
                        onChange={e => updateNama(item.id, "nama_en", e.target.value)}
                        placeholder="English name" />
                    </div>
                  </div>
                  {namaList.length > 1 && (
                    <button type="button" className={styles.removeNamaBtn} onClick={() => removeNama(item.id)}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className={styles.addNamaBtn} onClick={addNama}>
                <Plus size={14} /> Tambah Nama Kegiatan
              </button>
            </div>
          ) : (
            <div className={styles.row2}>
              <div className={styles.fg}>
                <label className={styles.lbl}>Nama (Bahasa Indonesia) {labelRequired("nama_id")}</label>
                <input className={styles.input} value={form.nama_id || ""}
                  onChange={e => set("nama_id", e.target.value)}
                  placeholder="Contoh: Workshop React.js" />
              </div>
              <div className={styles.fg}>
                <label className={styles.lbl}>Nama (English) {labelRequired("nama_en")}</label>
                <input className={styles.input} value={form.nama_en || ""}
                  onChange={e => set("nama_en", e.target.value)}
                  placeholder="Example: National Workshop" />
              </div>
            </div>
          )}
        </div>

        {/* STEP 2 — KATEGORI SKPI */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>Kategori SKPI <span className={styles.req}>*</span></p>
          <div className={styles.katGrid}>
            {Object.entries(SKPI_MAP).map(([id, m]) => {
              const isActive = form.kategori_skpi === id;
              return (
                <button key={id} type="button"
                  className={`${styles.katBtn} ${isActive ? styles.katBtnActive : ""}`}
                  onClick={() => handlePilihKategori(id)}
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
            {/* STEP 3 — KLASIFIKASI */}
            <div className={styles.card}>
              <p className={styles.cardTitle}>Klasifikasi Kegiatan</p>
              <div className={styles.row2}>
                <div className={styles.fg}>
                  <label className={styles.lbl}>Jenis Aktivitas {labelRequired("jenis_aktivitas")}</label>
                  {filteredJenis.length === 1 ? (
                    <div className={styles.autoFill} style={{ borderColor: `${pc}40`, color: pc, background: `${pc}08` }}>
                      <CheckCircle2 size={13} /> {filteredJenis[0]}
                    </div>
                  ) : (
                    <select className={styles.input} value={form.jenis_aktivitas || ""}
                      onChange={e => set("jenis_aktivitas", e.target.value)}>
                      <option value="">-- Pilih Jenis --</option>
                      {filteredJenis.map(j => <option key={j}>{j}</option>)}
                    </select>
                  )}
                </div>
                <div className={styles.fg}>
                  <label className={styles.lbl}>Kelompok Aktivitas {labelRequired("kelompok")}</label>
                  {filteredKelompok.length === 1 ? (
                    <div className={styles.autoFill} style={{ borderColor: `${pc}40`, color: pc, background: `${pc}08` }}>
                      <CheckCircle2 size={13} /> {filteredKelompok[0]}
                    </div>
                  ) : (
                    <select className={styles.input} value={form.kelompok || ""}
                      onChange={e => set("kelompok", e.target.value)}>
                      <option value="">-- Pilih Kelompok --</option>
                      {filteredKelompok.map(k => <option key={k}>{k}</option>)}
                    </select>
                  )}
                </div>
                <div className={styles.fg}>
                  <label className={styles.lbl}>Kategori Kegiatan {labelRequired("kategori")}</label>
                  <select className={styles.input} value={form.kategori || ""}
                    onChange={e => set("kategori", e.target.value)}>
                    <option value="">-- Pilih Kategori --</option>
                    {filteredKategori.map(k => <option key={k}>{k}</option>)}
                  </select>
                </div>
                <div className={styles.fg}>
                  <label className={styles.lbl}>Tingkat / Level {labelRequired("level")}</label>
                  <select className={styles.input} value={form.level || ""}
                    onChange={e => set("level", e.target.value)}>
                    <option value="">-- Pilih Level --</option>
                    {LEVEL_OPTIONS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                {showTingkatPrestasi && (
                  <div className={`${styles.fg} ${styles.fullSpan}`}>
                    <label className={styles.lbl}>Prestasi yang Diraih {labelRequired("tingkat_prestasi")}</label>
                    <select className={styles.input} value={form.tingkat_prestasi || ""}
                      onChange={e => set("tingkat_prestasi", e.target.value)}>
                      <option value="">-- Pilih jika ada --</option>
                      {TINGKAT_OPTIONS.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* STEP 4 — WAKTU & TEMPAT */}
            <div className={styles.card}>
              <p className={styles.cardTitle}>Waktu & Tempat</p>
              <div className={styles.row2}>
                <div className={styles.fg}>
                  <label className={styles.lbl}>Periode Semester {labelRequired("periode")}</label>
                  <select className={styles.input} value={form.periode || ""}
                    onChange={e => set("periode", e.target.value)}>
                    <option value="">-- Pilih Periode --</option>
                    {PERIODE_OPTIONS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className={styles.fg}>
                  <label className={styles.lbl}>Tanggal Pelaksanaan {labelRequired("tanggal")}</label>
                  <input type="date" className={styles.input} value={form.tanggal || ""}
                    onChange={e => set("tanggal", e.target.value)} />
                </div>
                <div className={styles.fg}>
                  <label className={styles.lbl}>Lokasi / Kota {labelRequired("lokasi")}</label>
                  <input className={styles.input} placeholder="Contoh: Bengkayang"
                    value={form.lokasi || ""} onChange={e => set("lokasi", e.target.value)} />
                </div>
                <div className={styles.fg}>
                  <label className={styles.lbl}>Penyelenggara {labelRequired("penyelenggara")}</label>
                  <input className={styles.input} placeholder="Nama penyelenggara"
                    value={form.penyelenggara || ""} onChange={e => set("penyelenggara", e.target.value)} />
                </div>
              </div>
            </div>

            {/* STEP 5 — BUKTI KEGIATAN */}
            <div className={styles.card}>
              <p className={styles.cardTitle}>Bukti Kegiatan {isBuktiWajib ? <span className={styles.req}>*</span> : <span className={styles.optBadge}>opsional</span>}</p>
              <div
                className={`${styles.dropZone} ${dragOver ? styles.dropActive : ""}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) processFile(f); }}
                onClick={() => fileRef.current?.click()}
                role="button" tabIndex={0}
                style={file ? { borderColor: pc, background: `${pc}06` } : dragOver ? { borderColor: pc } : {}}
              >
                <input type="file" ref={fileRef} hidden accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }} />
                {file ? (
                  <div className={styles.fileRow}>
                    {previewUrl ? (
                      <img src={previewUrl} alt="preview" className={styles.previewImg} />
                    ) : (
                      <div className={styles.pdfIcon} style={{ background: `${pc}14` }}>
                        <FileText size={24} color={pc} />
                      </div>
                    )}
                    <div className={styles.fileInfo}>
                      <p className={styles.fileName}>{file.name}</p>
                      <p className={styles.fileSize}>{(file.size / 1024).toFixed(0)} KB · {file.type.split("/")[1]?.toUpperCase()}</p>
                      <p className={styles.fileOk} style={{ color: pc }}><CheckCircle2 size={12} /> Siap diupload</p>
                    </div>
                    <button type="button" className={styles.fileRemove}
                      onClick={e => { e.stopPropagation(); setFile(null); setPreviewUrl(null); }}>
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <div className={styles.dropContent}>
                    <div className={styles.dropIcon} style={{ background: `${pc}14` }}>
                      <Upload size={22} color={pc} />
                    </div>
                    <p className={styles.dropText}>{dragOver ? "Lepaskan di sini…" : "Klik atau seret file ke sini"}</p>
                    <p className={styles.dropHint}>PDF, JPG, PNG, WebP · maks. 2 MB</p>
                  </div>
                )}
              </div>
              {uploadError && <div className={styles.uploadErr}><AlertCircle size={13} /> {uploadError}</div>}
              <div className={styles.fg} style={{ marginTop: 16 }}>
                <label className={styles.lbl}>Deskripsi Pendukung <span className={styles.optBadge}>opsional</span></label>
                <textarea className={styles.textarea} rows={3}
                  value={buktiDeskripsi || ""} onChange={e => setBuktiDeskripsi(e.target.value)} />
              </div>
            </div>

            {/* INFORMASI */}
            <div className={styles.infoNote}>
              <AlertCircle size={14} />
              <span><strong>Perhatian:</strong> Setelah disimpan, kegiatan akan masuk ke antrian verifikasi admin.</span>
            </div>

            <div className={styles.actions}>
              <button type="button" className={styles.cancelBtn} onClick={() => router.back()}>Batal</button>
              <button type="submit" className={styles.saveBtn} style={{ background: pc }} disabled={loading || success}>
                {loading ? <><span className={styles.spin} /> Menyimpan…</> : success ? <><CheckCircle2 size={14} /> Tersimpan!</> : <><Save size={14} /> Simpan Kegiatan</>}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}