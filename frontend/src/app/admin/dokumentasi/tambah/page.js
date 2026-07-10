"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, X, AlertCircle, CheckCircle2 } from "lucide-react";
import styles from "../dokumentasi.module.css";

const KATEGORI_OPTIONS = [
  { value: "usecase", label: "Use Case Diagram" },
  { value: "activity", label: "Activity Diagram" },
  { value: "class", label: "Class Diagram" },
  { value: "flowchart", label: "Flowchart" },
  { value: "sequence", label: "Sequence Diagram" },
  { value: "laporan", label: "Laporan" },
  { value: "panduan", label: "Panduan" },
  { value: "lainnya", label: "Lainnya" },
];

export default function TambahDokumenPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    judul: "",
    kategori: "usecase",
    deskripsi: "",
    konten: "",
    file_url: "",
    diagram_xml: "",
  });

  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.judul.trim() || !form.kategori) {
      showToast("Judul dan kategori wajib diisi.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/dokumentasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Dokumen berhasil ditambahkan!");
        setTimeout(() => router.push("/admin/dokumentasi"), 1500);
      } else {
        showToast(data.error || "Gagal menyimpan.", "error");
      }
    } catch (err) {
      showToast("Terjadi kesalahan.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {toast && (
        <div className={`${styles.toast} ${styles[`toast_${toast.type}`]}`}>
          {toast.type === "success" ? (
            <CheckCircle2 size={15} />
          ) : (
            <AlertCircle size={15} />
          )}
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className={styles.toastClose}>
            <X size={13} />
          </button>
        </div>
      )}

      <div className={styles.header}>
        <div>
          <button className={styles.backBtn} onClick={() => router.back()}>
            <ArrowLeft size={15} /> Kembali
          </button>
          <h1 className={styles.title}>Tambah Dokumen</h1>
          <p className={styles.subtitle}>
            Isi data dokumen untuk dokumentasi sistem SKPI
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.formCard}>
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Judul <span className={styles.req}>*</span>
          </label>
          <input
            className={styles.input}
            placeholder="Masukkan judul dokumen"
            value={form.judul}
            onChange={(e) => setField("judul", e.target.value)}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            Kategori <span className={styles.req}>*</span>
          </label>
          <select
            className={styles.input}
            value={form.kategori}
            onChange={(e) => setField("kategori", e.target.value)}
          >
            {KATEGORI_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Deskripsi</label>
          <textarea
            className={styles.textarea}
            rows={2}
            placeholder="Deskripsi singkat tentang dokumen ini"
            value={form.deskripsi}
            onChange={(e) => setField("deskripsi", e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Konten (HTML / Markdown)</label>
          <textarea
            className={styles.textarea}
            rows={6}
            placeholder="Tulis konten dokumen di sini. Bisa berupa HTML atau Markdown."
            value={form.konten}
            onChange={(e) => setField("konten", e.target.value)}
          />
          <p className={styles.hint}>
            Gunakan <strong>draw.io</strong> untuk membuat diagram, lalu export
            sebagai PNG dan upload, atau simpan file .drawio.
          </p>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>URL File / Gambar</label>
          <input
            className={styles.input}
            placeholder="https://... atau /uploads/..."
            value={form.file_url}
            onChange={(e) => setField("file_url", e.target.value)}
          />
          <p className={styles.hint}>
            Jika Anda sudah memiliki gambar diagram atau file, masukkan URL-nya
            di sini.
          </p>
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => router.back()}
          >
            Batal
          </button>
          <button type="submit" className={styles.saveBtn} disabled={loading}>
            {loading ? <span className={styles.spin} /> : <Save size={15} />}
            {loading ? "Menyimpan..." : "Simpan Dokumen"}
          </button>
        </div>
      </form>
    </div>
  );
}