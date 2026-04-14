"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, X, AlertCircle } from "lucide-react";
import styles from "./tambah.module.css";

// Daftar Jenis Aktivitas (berdasarkan SKPI)
const JENIS_AKTIVITAS = [
  "Prestasi dan Kegiatan",
  "Peningkatan Keterampilan Profesional",
  "Pengalaman Berorganisasi dan Kepemimpinan",
  "Pengembangan Intelektual",
  "Praktik Kerja",
  "Pembinaan Spiritual",
  "Pembangunan Karakter dan Kepribadian",
  "Kursus - kursus",
  "Skripsi",
];

// Daftar Kategori Aktivitas (berdasarkan SKPI)
const KATEGORI_AKTIVITAS = [
  "Lomba/Kompetisi",
  "Seminar",
  "Workshop",
  "Pelatihan",
  "Organisasi",
  "Kepanitian",
  "Magang",
  "Penelitian",
  "Pengabdian Masyarakat",
  "Publikasi Ilmiah",
  "Kegiatan Kampus",
  "Sertifikasi Profesional",
];

const LEVEL_OPTIONS = ["Internal", "Nasional", "Internasional"];
const STATUS_OPTIONS = ["Aktif", "Selesai", "Ditunda", "Dibatalkan"];

export default function TambahAktivitasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nama: "",
    jenis: "",
    kategori: "",
    level: "",
    tanggal: "",
    peserta: "",
    status: "Aktif",
    deskripsi: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama || !form.jenis || !form.kategori || !form.level || !form.tanggal) {
      setError("Lengkapi semua field yang wajib diisi (*)");
      return;
    }
    setLoading(true);
    try {
      // Simulasi API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // TODO: panggil API untuk simpan data
      console.log("Data aktivitas:", form);
      router.push("/admin/aktivitas");
    } catch (err) {
      setError("Gagal menyimpan data. Coba lagi.");
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
        <h1 className={styles.title}>Tambah Aktivitas Baru</h1>
      </div>

      {error && (
        <div className={styles.errorBox}>
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => setError("")}><X size={14} /></button>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Nama Aktivitas <span className={styles.required}>*</span></label>
            <input
              type="text"
              name="nama"
              value={form.nama}
              onChange={handleChange}
              placeholder="Contoh: Workshop React Native"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Jenis Aktivitas <span className={styles.required}>*</span></label>
            <select name="jenis" value={form.jenis} onChange={handleChange} className={styles.input}>
              <option value="">Pilih Jenis Aktivitas</option>
              {JENIS_AKTIVITAS.map((j) => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Kategori <span className={styles.required}>*</span></label>
            <select name="kategori" value={form.kategori} onChange={handleChange} className={styles.input}>
              <option value="">Pilih Kategori</option>
              {KATEGORI_AKTIVITAS.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Level <span className={styles.required}>*</span></label>
            <select name="level" value={form.level} onChange={handleChange} className={styles.input}>
              <option value="">Pilih Level</option>
              {LEVEL_OPTIONS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Tanggal <span className={styles.required}>*</span></label>
            <input type="date" name="tanggal" value={form.tanggal} onChange={handleChange} className={styles.input} />
          </div>

          <div className={styles.formGroup}>
            <label>Jumlah Peserta</label>
            <input type="number" name="peserta" value={form.peserta} onChange={handleChange} placeholder="0" className={styles.input} />
          </div>

          <div className={styles.formGroup}>
            <label>Status</label>
            <select name="status" value={form.status} onChange={handleChange} className={styles.input}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label>Deskripsi</label>
            <textarea
              name="deskripsi"
              value={form.deskripsi}
              onChange={handleChange}
              rows="4"
              placeholder="Deskripsi kegiatan (opsional)"
              className={styles.textarea}
            />
          </div>
        </div>

        <div className={styles.formActions}>
          <button type="button" className={styles.cancelBtn} onClick={() => router.back()}>
            Batal
          </button>
          <button type="submit" className={styles.saveBtn} disabled={loading}>
            {loading ? "Menyimpan..." : <><Save size={16} /> Simpan</>}
          </button>
        </div>
      </form>
    </div>
  );
}