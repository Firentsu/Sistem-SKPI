"use client";

import { useState, useRef, useEffect } from "react"; // tambah useEffect
import { useRouter } from "next/navigation";
import { useMahasiswa } from "@/context/MahasiswaContext";
import {
  ArrowLeft, Save, Upload, FileText, X,
  AlertCircle, CheckCircle2,
} from "lucide-react";
import styles from "./tambah.module.css";
import { submitKegiatan, uploadBuktiKegiatan } from "@/lib/api";
import { getLevelKegiatan, getTingkatPrestasi } from "@/lib/masterData";

/* ─────────────────────────────────────────
   MAPPING KATEGORI SKPI → opsi dropdown
   Tiap kategori punya jenis, kelompok, dan
   kategori kegiatan sendiri sesuai template.
───────────────────────────────────────── */
const SKPI_MAP = {
  prestasi: {
    label: "1. Prestasi dan Penghargaan",
    color: "#7c3aed",
    jenis:    ["Prestasi dan Kegiatan"],
    kelompok: ["Akademik", "Non-Akademik"],
    kategori: ["Lomba / Kompetisi", "Olimpiade", "Penghargaan / Award", "Beasiswa Prestasi"],
    hasPrestasi: true,
  },
  keterampilan: {
    label: "2. Peningkatan Keterampilan Profesional",
    color: "#0369a1",
    jenis:    ["Peningkatan Keterampilan Profesional"],
    kelompok: ["Akademik", "Profesional"],
    kategori: ["Workshop / Pelatihan", "Seminar / Webinar", "Sertifikasi Profesi", "Kursus", "Kuliah Umum / Studium Generale"],
    hasPrestasi: false,
  },
  organisasi: {
    label: "3. Pengalaman Berorganisasi & Kepemimpinan",
    color: "#065f46",
    jenis:    ["Pengalaman Berorganisasi dan Kepemimpinan"],
    kelompok: ["Organisasi", "Kepemimpinan"],
    kategori: ["Pengurus Organisasi", "Kepanitiaan Kegiatan", "Komunitas / UKM", "Relawan / Sukarelawan", "Mentoring / Pembimbing"],
    hasPrestasi: false,
  },
  intelektual: {
    label: "4. Pengembangan Intelektual",
    color: "#92400e",
    jenis:    ["Pengembangan Intelektual"],
    kelompok: ["Akademik", "Penelitian"],
    kategori: ["Penelitian / Riset", "Publikasi Ilmiah", "Konferensi Ilmiah", "Pertukaran Pelajar / Exchange"],
    hasPrestasi: false,
  },
  praktik: {
    label: "5. Praktik Kerja",
    color: "#b91c1c",
    jenis:    ["Praktik Kerja"],
    kelompok: ["Profesional"],
    kategori: ["Magang / PKL", "Praktik Kerja Lapangan", "Kewirausahaan / Startup"],
    hasPrestasi: false,
  },
};

const LEVEL_OPTIONS    = getLevelKegiatan();
const TINGKAT_PRESTASI = getTingkatPrestasi();

const PERIODE_OPTIONS = [
  "Semester Ganjil 2022/2023", "Semester Genap 2022/2023",
  "Semester Ganjil 2023/2024", "Semester Genap 2023/2024",
  "Semester Ganjil 2024/2025", "Semester Genap 2024/2025",
  "Semester Ganjil 2025/2026", "Semester Genap 2025/2026",
  "Liburan Semester Genap 2024/2025", "Liburan Semester Genap 2025/2026",
];

const EMPTY_FORM = {
  nama_id: "", nama_en: "",
  kategori_skpi: "",
  jenis_aktivitas: "", kelompok: "", kategori: "",
  level: "", tingkat_prestasi: "",
  periode: "", lokasi: "", penyelenggara: "",
  tanggal_mulai: "", tanggal_selesai: "",
};

export default function TambahKegiatanPage() {
  const router = useRouter();
  const { prodiConfig } = useMahasiswa();

  const [form, setForm]           = useState(EMPTY_FORM);
  const [file, setFile]           = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragOver, setDragOver]   = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState(false);
  // STATE BARU UNTUK PERAN MENTOR
  const [peranMentor, setPeranMentor] = useState("");
  const fileRef = useRef();

  // Mapping aktif berdasarkan kategori SKPI yang dipilih
  const activeMap = form.kategori_skpi ? SKPI_MAP[form.kategori_skpi] : null;

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Reset peran mentor jika kategori kegiatan bukan "Mentoring / Pembimbing" atau bukan kategori organisasi
  useEffect(() => {
    if (form.kategori !== "Mentoring / Pembimbing" || form.kategori_skpi !== "organisasi") {
      setPeranMentor("");
    }
  }, [form.kategori, form.kategori_skpi]);

  // Saat kategori SKPI dipilih, otomatis isi field yang sudah pasti
  const handleKategoriSKPI = (id) => {
    const map = SKPI_MAP[id];
    setForm(p => ({
      ...p,
      kategori_skpi:   id,
      jenis_aktivitas: map.jenis.length === 1   ? map.jenis[0]    : "",
      kelompok:        map.kelompok.length === 1 ? map.kelompok[0] : "",
      kategori:        "",
      tingkat_prestasi: "",
    }));
    // Reset peran mentor saat ganti kategori utama
    setPeranMentor("");
  };

  /* ── File upload ── */
  function processFile(f) {
    setUploadError("");
    if (!["application/pdf","image/jpeg","image/png","image/webp"].includes(f.type)) {
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

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const required = ["nama_id","nama_en","kategori_skpi","jenis_aktivitas","kelompok","kategori","level","periode","lokasi","penyelenggara","tanggal_mulai"];
    if (required.some(k => !form[k])) {
      setError("Lengkapi semua field yang wajib diisi."); return;
    }
    if (!file) { setError("Upload bukti kegiatan wajib dilampirkan."); return; }

    // Validasi peran mentor jika kondisi terpenuhi
    if (form.kategori_skpi === "organisasi" && form.kategori === "Mentoring / Pembimbing" && !peranMentor) {
      setError("Pilih peran mentor terlebih dahulu."); return;
    }

    setLoading(true);
    try {
      // Siapkan data, tambahkan peran_mentor
      const payload = {
        ...form,
        tanggal_kegiatan: form.tanggal_mulai,
        peran_mentor: peranMentor || null, // kirim null jika tidak diisi
      };
      const res = await submitKegiatan(payload);
      if (!res.ok) { setError(res.data?.error || "Gagal menyimpan kegiatan."); return; }

      const kegId = res.data?.id_kegiatan || res.data?.id;
      if (kegId && file) {
        const fd = new FormData();
        fd.append("bukti", file, file.name);
        await uploadBuktiKegiatan(kegId, fd);
      }

      setSuccess(true);
      setTimeout(() => router.push("/mahasiswa/kegiatan"), 1800);
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const primaryColor = prodiConfig.primary;

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <ArrowLeft size={15} />
        </button>
        <div>
          <h1 className={styles.title}>Tambah Kegiatan</h1>
          <p className={styles.sub}>Isi data kegiatan sesuai sertifikat yang kamu miliki</p>
        </div>
      </div>

      {/* ── Alert ── */}
      {error && (
        <div className={styles.alertErr}>
          <AlertCircle size={14} /> <span>{error}</span>
          <button onClick={() => setError("")}><X size={12}/></button>
        </div>
      )}
      {success && (
        <div className={styles.alertOk}>
          <CheckCircle2 size={14} /> <span>Kegiatan berhasil ditambahkan! Mengalihkan…</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>

        {/* ══ STEP 1 — NAMA KEGIATAN ══════════════════ */}
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

        {/* ══ STEP 2 — KATEGORI SKPI ══════════════════ */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>Kategori Kegiatan <span className={styles.req}>*</span></p>
          <p className={styles.cardHint}>Pilih kategori yang sesuai — data lainnya akan menyesuaikan otomatis</p>
          <div className={styles.katGrid}>
            {Object.entries(SKPI_MAP).map(([id, m]) => {
              const isActive = form.kategori_skpi === id;
              return (
                <button key={id} type="button"
                  className={`${styles.katBtn} ${isActive ? styles.katBtnActive : ""}`}
                  onClick={() => handleKategoriSKPI(id)}
                  style={isActive ? { borderColor: m.color, background: `${m.color}0d`, color: m.color } : {}}
                >
                  <span className={styles.katNo}
                    style={{ background: isActive ? m.color : "#f5ece4", color: isActive ? "#fff" : "#9e7b5e" }}>
                    {id === "prestasi" ? "1" : id === "keterampilan" ? "2" : id === "organisasi" ? "3" : id === "intelektual" ? "4" : "5"}
                  </span>
                  <span className={styles.katLabel}>{m.label.replace(/^\d+\.\s*/, "")}</span>
                  {isActive && <CheckCircle2 size={15} className={styles.katCheck} style={{ color: m.color }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ══ STEP 3 — KLASIFIKASI (muncul setelah pilih kategori) ══ */}
        {activeMap && (
          <div className={styles.card}>
            <p className={styles.cardTitle}>Klasifikasi Kegiatan</p>
            <div className={styles.row2}>

              {/* Jenis Aktivitas — otomatis jika 1 pilihan, dropdown jika >1 */}
              <div className={styles.fg}>
                <label className={styles.lbl}>Jenis Aktivitas <span className={styles.req}>*</span></label>
                {activeMap.jenis.length === 1 ? (
                  <div className={styles.autoFill} style={{ borderColor: `${primaryColor}40`, color: primaryColor }}>
                    <CheckCircle2 size={13} /> {activeMap.jenis[0]}
                  </div>
                ) : (
                  <select className={styles.input} value={form.jenis_aktivitas}
                    onChange={e => set("jenis_aktivitas", e.target.value)}>
                    <option value="">-- Pilih --</option>
                    {activeMap.jenis.map(j => <option key={j}>{j}</option>)}
                  </select>
                )}
              </div>

              {/* Kelompok Aktivitas */}
              <div className={styles.fg}>
                <label className={styles.lbl}>Kelompok Aktivitas <span className={styles.req}>*</span></label>
                {activeMap.kelompok.length === 1 ? (
                  <div className={styles.autoFill} style={{ borderColor: `${primaryColor}40`, color: primaryColor }}>
                    <CheckCircle2 size={13} /> {activeMap.kelompok[0]}
                  </div>
                ) : (
                  <select className={styles.input} value={form.kelompok}
                    onChange={e => set("kelompok", e.target.value)}>
                    <option value="">-- Pilih --</option>
                    {activeMap.kelompok.map(g => <option key={g}>{g}</option>)}
                  </select>
                )}
              </div>

              {/* Kategori Kegiatan */}
              <div className={styles.fg}>
                <label className={styles.lbl}>Kategori Kegiatan <span className={styles.req}>*</span></label>
                <select className={styles.input} value={form.kategori}
                  onChange={e => set("kategori", e.target.value)}>
                  <option value="">-- Pilih Kategori --</option>
                  {activeMap.kategori.map(k => <option key={k}>{k}</option>)}
                </select>
              </div>

              {/* Tingkat / Level */}
              <div className={styles.fg}>
                <label className={styles.lbl}>Tingkat / Level <span className={styles.req}>*</span></label>
                <select className={styles.input} value={form.level}
                  onChange={e => set("level", e.target.value)}>
                  <option value="">-- Pilih Level --</option>
                  {LEVEL_OPTIONS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>

              {/* Prestasi — hanya tampil untuk kategori prestasi */}
              {activeMap.hasPrestasi && (
                <div className={`${styles.fg} ${styles.fullSpan}`}>
                  <label className={styles.lbl}>
                    Prestasi yang Diraih
                    <span className={styles.optBadge}>opsional</span>
                  </label>
                  <select className={styles.input} value={form.tingkat_prestasi}
                    onChange={e => set("tingkat_prestasi", e.target.value)}>
                    <option value="">-- Pilih jika ada --</option>
                    {TINGKAT_PRESTASI.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              )}

              {/* ⭐ FIELD PERAN MENTOR - KHUSUS UNTUK KATEGORI ORGANISASI & "Mentoring / Pembimbing" ⭐ */}
              {form.kategori_skpi === "organisasi" && form.kategori === "Mentoring / Pembimbing" && (
                <div className={`${styles.fg} ${styles.fullSpan}`}>
                  <label className={styles.lbl}>
                    Peran / Bidang Mentoring <span className={styles.req}>*</span>
                  </label>
                  <select 
                    className={styles.input} 
                    value={peranMentor}
                    onChange={e => setPeranMentor(e.target.value)}
                  >
                    <option value="">-- Pilih Peran --</option>
                    <option value="Mentor Asrama">Mentor Integritas</option>
                    <option value="Mentor Akademik">Mentor Akademik </option>
                  </select>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ══ STEP 4 — WAKTU & TEMPAT ══════════════════ */}
        {activeMap && (
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
                <label className={styles.lbl}>Tanggal Mulai <span className={styles.req}>*</span></label>
                <input type="date" className={styles.input} value={form.tanggal_mulai}
                  onChange={e => set("tanggal_mulai", e.target.value)} />
              </div>
              <div className={styles.fg}>
                <label className={styles.lbl}>
                  Tanggal Selesai <span className={styles.optBadge}>opsional</span>
                </label>
                <input type="date" className={styles.input} value={form.tanggal_selesai}
                  min={form.tanggal_mulai}
                  onChange={e => set("tanggal_selesai", e.target.value)} />
              </div>
              <div className={styles.fg}>
                <label className={styles.lbl}>Lokasi / Kota <span className={styles.req}>*</span></label>
                <input className={styles.input} placeholder="Contoh: Bengkayang / Online"
                  value={form.lokasi} onChange={e => set("lokasi", e.target.value)} />
              </div>
              <div className={`${styles.fg} ${styles.fullSpan}`}>
                <label className={styles.lbl}>Penyelenggara <span className={styles.req}>*</span></label>
                <input className={styles.input}
                  placeholder="Contoh: Universitas Indonesia / KOMINFO / Himpunan Mahasiswa TI"
                  value={form.penyelenggara} onChange={e => set("penyelenggara", e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* ══ STEP 5 — BUKTI ══════════════════════════ */}
        {activeMap && (
          <div className={styles.card}>
            <p className={styles.cardTitle}>Bukti Kegiatan <span className={styles.req}>*</span></p>
            <p className={styles.cardHint}>Upload sertifikat, SK, atau foto kegiatan</p>

            <div
              className={`${styles.dropZone} ${dragOver ? styles.dropActive : ""}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) processFile(f); }}
              onClick={() => fileRef.current?.click()}
              role="button" tabIndex={0}
              onKeyDown={e => e.key === "Enter" && fileRef.current?.click()}
              style={file ? { borderColor: primaryColor, background: `${primaryColor}06` } : dragOver ? { borderColor: primaryColor } : {}}
            >
              <input type="file" ref={fileRef} hidden accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }} />

              {file ? (
                <div className={styles.fileRow}>
                  {previewUrl
                    ? <img src={previewUrl} alt="preview" className={styles.previewImg} />
                    : <div className={styles.pdfIcon} style={{ background: `${primaryColor}14` }}><FileText size={24} color={primaryColor} /></div>
                  }
                  <div className={styles.fileInfo}>
                    <p className={styles.fileName}>{file.name}</p>
                    <p className={styles.fileSize}>{(file.size / 1024).toFixed(0)} KB · {file.type.split("/")[1]?.toUpperCase()}</p>
                    <p className={styles.fileOk} style={{ color: primaryColor }}><CheckCircle2 size={12} /> Siap diupload</p>
                  </div>
                  <button type="button" className={styles.fileRemove}
                    onClick={e => { e.stopPropagation(); setFile(null); setPreviewUrl(null); }}>
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <div className={styles.dropContent}>
                  <div className={styles.dropIcon} style={{ background: `${primaryColor}14` }}>
                    <Upload size={22} color={primaryColor} />
                  </div>
                  <p className={styles.dropText}>{dragOver ? "Lepaskan di sini…" : "Klik atau seret file ke sini"}</p>
                  <p className={styles.dropHint}>PDF, JPG, PNG, WebP · maks. 2 MB</p>
                </div>
              )}
            </div>

            {uploadError && (
              <div className={styles.uploadErr}><AlertCircle size={13} /> {uploadError}</div>
            )}
          </div>
        )}

        {/* ── Tombol ── */}
        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={() => router.back()}>
            Batal
          </button>
          <button type="submit" className={styles.saveBtn}
            style={{ background: primaryColor }}
            disabled={loading || success || !activeMap}>
            {loading
              ? <><span className={styles.spin} /> Menyimpan…</>
              : success
              ? <><CheckCircle2 size={14} /> Tersimpan!</>
              : <><Save size={14} /> Simpan Kegiatan</>}
          </button>
        </div>

      </form>
    </div>
  );
}