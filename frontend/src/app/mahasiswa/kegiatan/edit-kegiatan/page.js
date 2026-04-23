"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMahasiswa } from "@/context/MahasiswaContext";
import {
  ArrowLeft, Save, Upload, FileImage, X, AlertCircle, CheckCircle2
} from "lucide-react";
import styles from "./edit-kegiatan.module.css";

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

// Mock data kegiatan (sementara, nanti dari API)
const MOCK_KEGIATAN = [
  { id: 1, nama_id: "Workshop React.js", nama_en: "React.js Workshop", jenis_aktivitas: "Peningkatan Keterampilan Profesional", kategori: "Workshop", kelompok: "Akademik", level: "Nasional", periode: "Semester Genap 2025/2026", tingkat_prestasi: "Peserta", lokasi: "Kampus TI", penyelenggara: "Himpunan Mahasiswa TI", tanggal: "2026-03-20", status: "Disetujui", bukti: "bukti1.pdf", created_at: "2026-03-01" },
  { id: 2, nama_id: "Seminar AI", nama_en: "AI Seminar", jenis_aktivitas: "Prestasi dan Kegiatan", kategori: "Seminar", kelompok: "Non-Akademik", level: "Internasional", periode: "Semester Ganjil 2025/2026", tingkat_prestasi: "Peserta", lokasi: "Online", penyelenggara: "Tech Corp", tanggal: "2026-03-25", status: "Menunggu", bukti: null, created_at: "2026-03-10" },
  { id: 3, nama_id: "Magang Startup", nama_en: "Startup Internship", jenis_aktivitas: "Praktik Kerja", kategori: "Magang", kelompok: "Profesional", level: "Lokal", periode: "Liburan Semester", tingkat_prestasi: "", lokasi: "Jakarta", penyelenggara: "Startup.id", tanggal: "2026-03-10", status: "Ditolak", bukti: "bukti3.pdf", created_at: "2026-02-20" },
];

export default function EditKegiatanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { prodiConfig } = useMahasiswa();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
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

  // Ambil data kegiatan berdasarkan id
  useEffect(() => {
    if (!id) {
      setError("ID kegiatan tidak ditemukan");
      setFetching(false);
      return;
    }
    const kegiatan = MOCK_KEGIATAN.find(k => k.id === parseInt(id));
    if (kegiatan) {
      setForm({
        nama_id: kegiatan.nama_id,
        nama_en: kegiatan.nama_en,
        jenis_aktivitas: kegiatan.jenis_aktivitas,
        kategori: kegiatan.kategori,
        kelompok: kegiatan.kelompok,
        level: kegiatan.level,
        periode: kegiatan.periode,
        tingkat_prestasi: kegiatan.tingkat_prestasi || "",
        lokasi: kegiatan.lokasi,
        penyelenggara: kegiatan.penyelenggara,
        tanggal: kegiatan.tanggal,
      });
      if (kegiatan.bukti) {
        setFile({ name: kegiatan.bukti });
      }
    } else {
      setError("Data kegiatan tidak ditemukan");
    }
    setFetching(false);
  }, [id]);

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

    setLoading(true);
    setError("");
    try {
      // Simulasi API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Update data:", { ...form, bukti: file ? file.name : (id ? "existing" : null) });
      setSuccess(true);
      setTimeout(() => {
        router.push("/mahasiswa/kegiatan");
      }, 1500);
    } catch (err) {
      setError("Gagal menyimpan perubahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className={styles.loading}>Memuat data...</div>;
  }

  if (error && !form.nama_id) {
    return (
      <div className={styles.container}>
        <div className={styles.errorBox}>
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => router.push("/mahasiswa/kegiatan")}>Kembali</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <ArrowLeft size={16} /> Kembali
        </button>
        <h1 className={styles.title}>Edit Kegiatan</h1>
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
          <span>Kegiatan berhasil diupdate! Mengalihkan...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          {/* Baris 1: Nama Indonesia & Inggris */}
          <div className={styles.formGroup}>
            <label>Nama Kegiatan (Indonesia) <span className={styles.required}>*</span></label>
            <input type="text" name="nama_id" value={form.nama_id} onChange={handleChange} className={styles.input} />
          </div>
          <div className={styles.formGroup}>
            <label>Nama Kegiatan (English) <span className={styles.required}>*</span></label>
            <input type="text" name="nama_en" value={form.nama_en} onChange={handleChange} className={styles.input} />
          </div>

          {/* Baris 2: Jenis & Kategori */}
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

          {/* Baris 3: Kelompok & Level */}
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

          {/* Baris 4: Periode & Tingkat Prestasi */}
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

          {/* Baris 5: Lokasi & Penyelenggara */}
          <div className={styles.formGroup}>
            <label>Lokasi <span className={styles.required}>*</span></label>
            <input type="text" name="lokasi" value={form.lokasi} onChange={handleChange} className={styles.input} />
          </div>
          <div className={styles.formGroup}>
            <label>Penyelenggara <span className={styles.required}>*</span></label>
            <input type="text" name="penyelenggara" value={form.penyelenggara} onChange={handleChange} className={styles.input} />
          </div>

          {/* Baris 6: Tanggal */}
          <div className={styles.formGroup}>
            <label>Tanggal Pelaksanaan <span className={styles.required}>*</span></label>
            <input type="date" name="tanggal" value={form.tanggal} onChange={handleChange} className={styles.input} />
          </div>

          {/* Upload Bukti (full width) */}
          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label>Upload Bukti Kegiatan (opsional, kosongkan jika tidak diubah)</label>
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
            {loading ? "Menyimpan..." : <><Save size={16} /> Simpan Perubahan</>}
          </button>
        </div>
      </form>
    </div>
  );
}