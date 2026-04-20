"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMahasiswa } from "@/context/MahasiswaContext";
import {
  ArrowLeft, Save, Upload, FileImage, X, AlertCircle, CheckCircle2
} from "lucide-react";
import styles from "./tambah.module.css";

// Import master data
import {
  getJenisAktivitas,
  getKategoriAktivitas,
  getKelompokAktivitas,
  getLevelKegiatan,
  getTingkatPrestasi
} from "@/lib/masterData";

const JENIS_AKTIVITAS = getJenisAktivitas();
const KATEGORI_OPTIONS = getKategoriAktivitas();
const KELOMPOK_OPTIONS = getKelompokAktivitas();
const LEVEL_OPTIONS = getLevelKegiatan();
const TINGKAT_PRESTASI = getTingkatPrestasi();

export default function TambahKegiatanPage() {
  const router = useRouter();
  const { prodiConfig } = useMahasiswa();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    nama_id: "",
    nama_en: "",
    jenis_aktivitas: "",
    kategori: "",
    kelompok: "",
    level: "",
    periode: "",
    tingkat_prestasi: "",
    lokasi: "",
    penyelenggara: "",
    tanggal: "",
  });

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef();
  const MAX_SIZE = 2 * 1024 * 1024;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setUploadError("");
    if (!["application/pdf", "image/jpeg", "image/png"].includes(selected.type)) {
      setUploadError("Format harus PDF, JPG, atau PNG");
      return;
    }
    if (selected.size > MAX_SIZE) {
      setUploadError("Ukuran file maksimal 2 MB");
      return;
    }
    setFile(selected);
    if (selected.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(selected);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama_id || !form.nama_en || !form.jenis_aktivitas || !form.kategori ||
        !form.kelompok || !form.level || !form.periode || !form.lokasi ||
        !form.penyelenggara || !form.tanggal) {
      setError("Lengkapi semua field yang bertanda *");
      return;
    }
    if (!file) {
      setError("Upload bukti kegiatan (wajib)");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Data kegiatan:", { ...form, bukti: file.name });
      setSuccess(true);
      setTimeout(() => {
        router.push("/mahasiswa/kegiatan");
      }, 1500);
    } catch (err) {
      setError("Gagal menyimpan kegiatan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <ArrowLeft size={16} /> Kembali
        </button>
        <h1 className={styles.title}>Tambah Kegiatan Baru</h1>
      </div>

      {error && (
        <div className={styles.errorBox}>
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => setError("")}><X size={14} /></button>
        </div>
      )}

      {success && (
        <div className={styles.successBox}>
          <CheckCircle2 size={16} />
          <span>Kegiatan berhasil ditambahkan! Mengalihkan...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          {/* Nama Indonesia & Inggris */}
          <div className={styles.formGroup}>
            <label>Nama Kegiatan (Indonesia) <span className={styles.required}>*</span></label>
            <input type="text" name="nama_id" value={form.nama_id} onChange={handleChange} placeholder="Contoh: Workshop React" className={styles.input} />
          </div>
          <div className={styles.formGroup}>
            <label>Nama Kegiatan (English) <span className={styles.required}>*</span></label>
            <input type="text" name="nama_en" value={form.nama_en} onChange={handleChange} placeholder="Example: React Workshop" className={styles.input} />
          </div>

          {/* Jenis Aktivitas & Kategori */}
          <div className={styles.formGroup}>
            <label>Jenis Aktivitas <span className={styles.required}>*</span></label>
            <select name="jenis_aktivitas" value={form.jenis_aktivitas} onChange={handleChange} className={styles.input}>
              <option value="">-- Pilih Jenis Aktivitas --</option>
              {JENIS_AKTIVITAS.map(j => <option key={j}>{j}</option>)}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Kategori <span className={styles.required}>*</span></label>
            <select name="kategori" value={form.kategori} onChange={handleChange} className={styles.input}>
              <option value="">-- Pilih Kategori --</option>
              {KATEGORI_OPTIONS.map(k => <option key={k}>{k}</option>)}
            </select>
          </div>

          {/* Kelompok & Level */}
          <div className={styles.formGroup}>
            <label>Kelompok Aktivitas <span className={styles.required}>*</span></label>
            <select name="kelompok" value={form.kelompok} onChange={handleChange} className={styles.input}>
              <option value="">-- Pilih Kelompok --</option>
              {KELOMPOK_OPTIONS.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Level <span className={styles.required}>*</span></label>
            <select name="level" value={form.level} onChange={handleChange} className={styles.input}>
              <option value="">-- Pilih Level --</option>
              {LEVEL_OPTIONS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>

          {/* Periode & Tingkat Prestasi */}
          <div className={styles.formGroup}>
            <label>Periode <span className={styles.required}>*</span></label>
            <input type="text" name="periode" value={form.periode} onChange={handleChange} placeholder="Contoh: Semester Ganjil 2025" className={styles.input} />
          </div>
          <div className={styles.formGroup}>
            <label>Tingkat Prestasi (Opsional)</label>
            <select name="tingkat_prestasi" value={form.tingkat_prestasi} onChange={handleChange} className={styles.input}>
              <option value="">-- Pilih Tingkat Prestasi --</option>
              {TINGKAT_PRESTASI.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {/* Lokasi & Penyelenggara */}
          <div className={styles.formGroup}>
            <label>Lokasi <span className={styles.required}>*</span></label>
            <input type="text" name="lokasi" value={form.lokasi} onChange={handleChange} placeholder="Contoh: Kampus TI, Online" className={styles.input} />
          </div>
          <div className={styles.formGroup}>
            <label>Penyelenggara <span className={styles.required}>*</span></label>
            <input type="text" name="penyelenggara" value={form.penyelenggara} onChange={handleChange} placeholder="Contoh: Himpunan Mahasiswa" className={styles.input} />
          </div>

          {/* Tanggal */}
          <div className={styles.formGroup}>
            <label>Tanggal Pelaksanaan <span className={styles.required}>*</span></label>
            <input type="date" name="tanggal" value={form.tanggal} onChange={handleChange} className={styles.input} />
          </div>

          {/* Upload Bukti (full width) */}
          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label>Upload Bukti Kegiatan <span className={styles.required}>*</span></label>
            <div className={styles.uploadArea} style={{ borderColor: prodiConfig.primary }} onClick={() => fileRef.current.click()}>
              <input type="file" ref={fileRef} hidden accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
              {file ? (
                <div className={styles.uploadPreview}>
                  {previewUrl ? <img src={previewUrl} alt="preview" className={styles.previewImg} /> : <FileImage size={24} />}
                  <span className={styles.fileName}>{file.name}</span>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); setPreviewUrl(null); }}><X size={14} /></button>
                </div>
              ) : (
                <div className={styles.uploadPlaceholder}>
                  <Upload size={24} />
                  <span>Klik atau seret file ke sini</span>
                  <small>PDF, JPG, PNG (maks 2MB)</small>
                </div>
              )}
            </div>
            {uploadError && <p className={styles.errorText}>{uploadError}</p>}
          </div>
        </div>

        <div className={styles.formActions}>
          <button type="button" className={styles.cancelBtn} onClick={() => router.back()}>Batal</button>
          <button type="submit" className={styles.saveBtn} style={{ background: prodiConfig.primary }} disabled={loading}>
            {loading ? "Menyimpan..." : <><Save size={16} /> Simpan</>}
          </button>
        </div>
      </form>
    </div>
  );
}