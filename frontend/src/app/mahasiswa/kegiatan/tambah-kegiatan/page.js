"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMahasiswa } from "@/context/MahasiswaContext";
import {
  ArrowLeft, Save, Upload, FileText, X,
  AlertCircle, CheckCircle2,
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
} from "@/lib/masterData";

/* ─────────────────────────────────────────
   KATEGORI SKPI → Mapping terhadap master data
   Nama‑nama di sini HARUS cocok dengan yang
   ada di master data (default atau dari admin)
───────────────────────────────────────── */
const SKPI_MAP = {
  prestasi: {
    label: "1. Prestasi dan Penghargaan",
    jenis: ["Prestasi dan Kegiatan"],
    kelompok: ["Akademik", "Non-Akademik"],
    kategori: [
      "Lomba/Kompetisi",
      "Olimpiade",
      "Penghargaan / Award",
    ],
    hasPrestasi: true,
  },
  keterampilan: {
    label: "2. Peningkatan Keterampilan Profesional",
    jenis: ["Peningkatan Keterampilan Profesional"],
    kelompok: ["Akademik", "Profesional"],
    kategori: [
      "Workshop / Pelatihan",
      "Sertifikasi Profesional",
      "Kursus",
    ],
    hasPrestasi: false,
  },
  organisasi: {
    label: "3. Pengalaman Berorganisasi & Kepemimpinan",
    jenis: ["Pengalaman Berorganisasi dan Kepemimpinan"],
    kelompok: ["Organisasi", "Kepemimpinan"],
    kategori: [
      "Pengurus Organisasi",
      "Kepanitiaan Kegiatan",
      "Komunitas / UKM",
      "Relawan / Sukarelawan",
      "Mentoring / Pembimbing",
    ],
    hasPrestasi: false,
  },
  intelektual: {
    label: "4. Pengembangan Intelektual",
    jenis: ["Pengembangan Intelektual"],
    kelompok: ["Akademik", "Penelitian"],
    kategori: [
      "Asisten Penelitian / Riset",
      "Publikasi Ilmiah",
      "Konferensi Ilmiah",
      "Pertukaran Pelajar / Exchange",
      "Seminar / Webinar",
      "Kuliah Umum / Studium Generale",
    ],
    hasPrestasi: false,
  },
  praktik: {
    label: "5. Praktik Kerja",
    jenis: ["Praktik Kerja"],
    kelompok: ["Profesional"],
    kategori: [
      "Magang / PKL",
      "Kewirausahaan / Startup",
    ],
    hasPrestasi: false,
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

// ── Toast ───────────────────────────────────────────────────
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

  // ═══════════════════════════════════════════════
  // AMBIL DATA MASTER TERBARU DARI CACHE
  // ═══════════════════════════════════════════════
  const JENIS_OPTIONS      = getJenisAktivitas();
  const KATEGORI_OPTIONS   = getKategoriAktivitas();
  const KELOMPOK_OPTIONS   = getKelompokAktivitas();
  const LEVEL_OPTIONS      = getLevelKegiatan();
  const TINGKAT_OPTIONS    = getTingkatPrestasi();
  const PERIODE_OPTIONS    = getPeriodeSemester();

  const [form, setForm] = useState(EMPTY_FORM);
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

  // Mapping aktif berdasarkan kategori SKPI yang dipilih
  const activeMap = SKPI_MAP[form.kategori_skpi] || null;

  // Filter opsi dropdown berdasarkan mapping
  const filteredJenis    = activeMap ? JENIS_OPTIONS.filter(j => activeMap.jenis.includes(j)) : [];
  const filteredKelompok = activeMap ? KELOMPOK_OPTIONS.filter(k => activeMap.kelompok.includes(k)) : [];
  const filteredKategori = activeMap ? KATEGORI_OPTIONS.filter(k => activeMap.kategori.includes(k)) : [];
  const showTingkatPrestasi = activeMap?.hasPrestasi ?? false;

  // ── Handler pilih kategori SKPI ──────────────────────────
  const handlePilihKategori = (id) => {
    const map = SKPI_MAP[id];
    if (!map) return;

    // Hitung opsi yang sudah difilter
    const jenisFiltered = JENIS_OPTIONS.filter(j => map.jenis.includes(j));
    const kelompokFiltered = KELOMPOK_OPTIONS.filter(k => map.kelompok.includes(k));

    setForm(p => ({
      ...p,
      kategori_skpi: id,
      jenis_aktivitas: jenisFiltered.length === 1 ? jenisFiltered[0] : "",
      kelompok: kelompokFiltered.length === 1 ? kelompokFiltered[0] : "",
      kategori: "",
      tingkat_prestasi: "",
    }));
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

    const required = [
      "nama_id", "nama_en", "kategori_skpi", "jenis_aktivitas",
      "kelompok", "kategori", "level", "periode", "lokasi", "penyelenggara", "tanggal",
    ];
    if (required.some(k => !form[k])) {
      setError("Lengkapi semua field yang wajib diisi."); return;
    }
    if (!file) { setError("Upload bukti kegiatan wajib dilampirkan."); return; }

    setLoading(true);
    try {
      const payload = {
        ...form,
        tanggal_kegiatan: form.tanggal,
        bukti_deskripsi: buktiDeskripsi.trim() || null,
      };
      const res = await submitKegiatan(payload);
      if (!res.ok) {
        setError(res.data?.error || "Gagal menyimpan kegiatan.");
        setLoading(false);
        return;
      }

      const kegId = res.data?.id_kegiatan || res.data?.id;
      if (kegId && file) {
        const fd = new FormData();
        fd.append("bukti", file, file.name);
        await uploadBuktiKegiatan(kegId, fd);
      }

      setSuccess(true);
      showToast("✓ Kegiatan berhasil disimpan! Menunggu verifikasi admin.", "success");
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
          <div className={styles.row2}>
            <div className={styles.fg}>
              <label className={styles.lbl}>Nama (Bahasa Indonesia) <span className={styles.req}>*</span></label>
              <input className={styles.input} value={form.nama_id}
                onChange={e => set("nama_id", e.target.value)}
                placeholder="Contoh: Workshop React.js Tingkat Nasional" />
            </div>
            <div className={styles.fg}>
              <label className={styles.lbl}>Nama (English) <span className={styles.req}>*</span></label>
              <input className={styles.input} value={form.nama_en}
                onChange={e => set("nama_en", e.target.value)}
                placeholder="Example: National React.js Workshop" />
            </div>
          </div>
        </div>

        {/* STEP 2 — KATEGORI SKPI */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>Kategori SKPI <span className={styles.req}>*</span></p>
          <p className={styles.cardHint}>Pilih kategori utama pencapaian ini — pilihan di bawah akan menyesuaikan</p>
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
                    {id !== "praktik" ? id.charAt(0).toUpperCase() : "5"}
                  </span>
                  <span className={styles.katLabel}>{m.label}</span>
                  {isActive && <CheckCircle2 size={15} className={styles.katCheck} style={{ color: pc }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* HANYA MUNCUL SETELAH KATEGORI SKPI DIPILIH */}
        {activeMap && (
          <>
            {/* STEP 3 — KLASIFIKASI */}
            <div className={styles.card}>
              <p className={styles.cardTitle}>Klasifikasi Kegiatan</p>
              <div className={styles.row2}>
                {/* Jenis Aktivitas */}
                <div className={styles.fg}>
                  <label className={styles.lbl}>Jenis Aktivitas <span className={styles.req}>*</span></label>
                  {filteredJenis.length === 1 ? (
                    <div className={styles.autoFill} style={{ borderColor: `${pc}40`, color: pc, background: `${pc}08` }}>
                      <CheckCircle2 size={13} /> {filteredJenis[0]}
                    </div>
                  ) : (
                    <select className={styles.input} value={form.jenis_aktivitas}
                      onChange={e => set("jenis_aktivitas", e.target.value)}>
                      <option value="">-- Pilih Jenis --</option>
                      {filteredJenis.map(j => <option key={j}>{j}</option>)}
                    </select>
                  )}
                </div>

                {/* Kelompok Aktivitas */}
                <div className={styles.fg}>
                  <label className={styles.lbl}>Kelompok Aktivitas <span className={styles.req}>*</span></label>
                  {filteredKelompok.length === 1 ? (
                    <div className={styles.autoFill} style={{ borderColor: `${pc}40`, color: pc, background: `${pc}08` }}>
                      <CheckCircle2 size={13} /> {filteredKelompok[0]}
                    </div>
                  ) : (
                    <select className={styles.input} value={form.kelompok}
                      onChange={e => set("kelompok", e.target.value)}>
                      <option value="">-- Pilih Kelompok --</option>
                      {filteredKelompok.map(k => <option key={k}>{k}</option>)}
                    </select>
                  )}
                </div>

                {/* Kategori Kegiatan */}
                <div className={styles.fg}>
                  <label className={styles.lbl}>Kategori Kegiatan <span className={styles.req}>*</span></label>
                  <select className={styles.input} value={form.kategori}
                    onChange={e => set("kategori", e.target.value)}>
                    <option value="">-- Pilih Kategori --</option>
                    {filteredKategori.map(k => <option key={k}>{k}</option>)}
                  </select>
                </div>

                {/* Level */}
                <div className={styles.fg}>
                  <label className={styles.lbl}>Tingkat / Level <span className={styles.req}>*</span></label>
                  <select className={styles.input} value={form.level}
                    onChange={e => set("level", e.target.value)}>
                    <option value="">-- Pilih Level --</option>
                    {LEVEL_OPTIONS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>

                {/* Tingkat Prestasi (hanya jika relevan) */}
                {showTingkatPrestasi && (
                  <div className={`${styles.fg} ${styles.fullSpan}`}>
                    <label className={styles.lbl}>Prestasi yang Diraih <span className={styles.optBadge}>opsional</span></label>
                    <select className={styles.input} value={form.tingkat_prestasi}
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
                  <label className={styles.lbl}>Periode Semester <span className={styles.req}>*</span></label>
                  <select className={styles.input} value={form.periode}
                    onChange={e => set("periode", e.target.value)}>
                    <option value="">-- Pilih Periode --</option>
                    {PERIODE_OPTIONS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className={styles.fg}>
                  <label className={styles.lbl}>Tanggal Pelaksanaan <span className={styles.req}>*</span></label>
                  <input type="date" className={styles.input} value={form.tanggal}
                    onChange={e => set("tanggal", e.target.value)} />
                </div>
                <div className={styles.fg}>
                  <label className={styles.lbl}>Lokasi / Kota <span className={styles.req}>*</span></label>
                  <input className={styles.input} placeholder="Contoh: Bengkayang / Online"
                    value={form.lokasi} onChange={e => set("lokasi", e.target.value)} />
                </div>
                <div className={styles.fg}>
                  <label className={styles.lbl}>Penyelenggara <span className={styles.req}>*</span></label>
                  <input className={styles.input}
                    placeholder="Contoh: KOMINFO / Himpunan Mahasiswa TI"
                    value={form.penyelenggara} onChange={e => set("penyelenggara", e.target.value)} />
                </div>
              </div>
            </div>

            {/* STEP 5 — BUKTI KEGIATAN */}
            <div className={styles.card}>
              <p className={styles.cardTitle}>Bukti Kegiatan <span className={styles.req}>*</span></p>
              <p className={styles.cardHint}>
                Upload sertifikat, SK, atau foto kegiatan.
                <strong style={{ display: "block", marginTop: 6 }}>
                  📌 Tidak punya sertifikat? Kamu dapat mengupload: SK, surat keterangan, foto dokumentasi, atau bukti kehadiran.
                </strong>
              </p>

              <div
                className={`${styles.dropZone} ${dragOver ? styles.dropActive : ""}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) processFile(f); }}
                onClick={() => fileRef.current?.click()}
                role="button" tabIndex={0}
                onKeyDown={e => e.key === "Enter" && fileRef.current?.click()}
                style={file ? { borderColor: pc, background: `${pc}06` } : dragOver ? { borderColor: pc } : {}}
              >
                <input type="file" ref={fileRef} hidden accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }} />

                {file ? (
                  <div className={styles.fileRow}>
                    {previewUrl
                      ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={previewUrl} alt="preview" className={styles.previewImg} />
                      )
                      : <div className={styles.pdfIcon} style={{ background: `${pc}14` }}>
                          <FileText size={24} color={pc} />
                        </div>
                    }
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

              {uploadError && (
                <div className={styles.uploadErr}><AlertCircle size={13} /> {uploadError}</div>
              )}

              <div className={styles.fg} style={{ marginTop: 16 }}>
                <label className={styles.lbl}>
                  Deskripsi Pendukung <span className={styles.optBadge}>opsional</span>
                </label>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  placeholder="Contoh: Foto ini diambil saat kegiatan mentoring, surat keterangan dari ketua panitia, dll."
                  value={buktiDeskripsi}
                  onChange={e => setBuktiDeskripsi(e.target.value)}
                />
                <small className={styles.fieldNote}>
                  Informasi tambahan yang dapat membantu admin memahami konteks bukti (opsional).
                </small>
              </div>
            </div>

            {/* INFORMASI VERIFIKASI ADMIN */}
            <div className={styles.infoNote}>
              <AlertCircle size={14} />
              <span>
                <strong>Perhatian:</strong> Setelah disimpan, kegiatan akan masuk ke antrian verifikasi admin.
                Pastikan data dan bukti sudah benar. Status kegiatan dapat dilihat di halaman &quot;Kegiatan Saya&quot;.
              </span>
            </div>

            {/* TOMBOL */}
            <div className={styles.actions}>
              <button type="button" className={styles.cancelBtn} onClick={() => router.back()}>
                Batal
              </button>
              <button type="submit" className={styles.saveBtn} style={{ background: pc }}
                disabled={loading || success}>
                {loading
                  ? <><span className={styles.spin} /> Menyimpan…</>
                  : success
                    ? <><CheckCircle2 size={14} /> Tersimpan!</>
                    : <><Save size={14} /> Simpan Kegiatan</>}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}