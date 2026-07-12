"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, X, AlertCircle, CheckCircle2, RefreshCw, Info, Link2, DownloadCloud, Loader2 } from "lucide-react";
import styles from "../../dokumentasi.module.css";
import { apiFetch } from "@/lib/api";
import DrawioEditor from "@/components/DrawioEditor";

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

const DIAGRAM_KATEGORI = ["usecase", "activity", "class", "flowchart", "sequence"];

// Deteksi tautan diagram yang bisa di-import otomatis (draw.io / Google Drive).
const looksLikeDiagramLink = (url = "") =>
  /diagrams\.net|drive\.google\.com|docs\.google\.com|draw\.io/i.test(url);

export default function EditDokumenPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState(null);
  const editorRef = useRef(null);

  const [form, setForm] = useState({
    judul: "",
    kategori: "usecase",
    deskripsi: "",
    konten: "",
    file_url: "",
    diagram_xml: "",
  });

  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const isDiagram = DIAGRAM_KATEGORI.includes(form.kategori);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Tarik diagram dari URL (draw.io/Drive) lewat proxy backend, lalu muat ke editor.
  const importFromUrl = useCallback(async (url, { silent = false } = {}) => {
    if (!url || !looksLikeDiagramLink(url)) {
      if (!silent) showToast("Tempel tautan draw.io / Google Drive yang valid.", "error");
      return false;
    }
    setImporting(true);
    try {
      const res = await apiFetch(`/api/dokumentasi/import?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (!res.ok) {
        if (!silent) showToast(data.error || "Gagal memuat diagram dari URL.", "error");
        return false;
      }
      setField("diagram_xml", data.xml);
      editorRef.current?.load(data.xml);
      if (!silent) showToast("Diagram berhasil dimuat dari URL!", "success");
      return true;
    } catch {
      if (!silent) showToast("Terjadi kesalahan saat memuat diagram.", "error");
      return false;
    } finally {
      setImporting(false);
    }
  }, [showToast]);

  // Load data dari API
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await apiFetch(`/api/dokumentasi/${id}`);
        if (!res.ok) throw new Error("Dokumen tidak ditemukan");
        const data = await res.json();
        setForm({
          judul: data.judul || "",
          kategori: data.kategori || "usecase",
          deskripsi: data.deskripsi || "",
          konten: data.konten || "",
          file_url: data.file_url || "",
          diagram_xml: data.diagram_xml || "",
        });
        // Auto-load: diagram belum tersimpan tapi ada tautannya → tarik otomatis.
        const isDiag = DIAGRAM_KATEGORI.includes(data.kategori);
        if (isDiag && !data.diagram_xml && looksLikeDiagramLink(data.file_url)) {
          importFromUrl(data.file_url, { silent: true });
        }
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setFetching(false);
      }
    };
    loadData();
  }, [id, showToast, importFromUrl]);

  // draw.io autosave → sinkronkan ke form (dibungkus useCallback agar stabil)
  const handleDiagramChange = useCallback((xml) => {
    setForm((prev) => (prev.diagram_xml === xml ? prev : { ...prev, diagram_xml: xml }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.judul.trim() || !form.kategori) {
      showToast("Judul dan kategori wajib diisi.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch(`/api/dokumentasi/${id}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Dokumen berhasil diperbarui!");
        setTimeout(() => router.push("/admin/dokumentasi"), 1200);
      } else {
        showToast(data.error || "Gagal menyimpan.", "error");
      }
    } catch (err) {
      showToast("Terjadi kesalahan.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className={styles.loadingRow}>
        <RefreshCw size={24} className={styles.spin} />
        <span>Memuat data...</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {toast && (
        <div className={`${styles.toast} ${styles[`toast_${toast.type}`]}`}>
          {toast.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
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
          <h1 className={styles.title}>Edit Dokumen</h1>
          <p className={styles.subtitle}>
            Perbarui data dokumen {isDiagram ? "dan diagram" : ""}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.formCard}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Judul <span className={styles.req}>*</span></label>
            <input
              className={styles.input}
              placeholder="Masukkan judul dokumen"
              value={form.judul}
              onChange={(e) => setField("judul", e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Kategori <span className={styles.req}>*</span></label>
            <select
              className={styles.input}
              value={form.kategori}
              onChange={(e) => setField("kategori", e.target.value)}
            >
              {KATEGORI_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Deskripsi</label>
          <textarea
            className={styles.textarea}
            rows={2}
            placeholder="Deskripsi singkat"
            value={form.deskripsi}
            onChange={(e) => setField("deskripsi", e.target.value)}
          />
        </div>

        {/* IMPORT DARI URL — untuk kategori diagram */}
        {isDiagram && (
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <Link2 size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />
              Link Diagram (draw.io / Google Drive)
            </label>
            <div className={styles.inputWithBtn}>
              <input
                className={styles.input}
                placeholder="Tempel tautan draw.io atau Google Drive…"
                value={form.file_url}
                onChange={(e) => setField("file_url", e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); importFromUrl(form.file_url); } }}
              />
              <button
                type="button"
                className={styles.loadUrlBtn}
                onClick={() => importFromUrl(form.file_url)}
                disabled={importing || !form.file_url}
              >
                {importing ? <Loader2 size={15} className={styles.spin} /> : <DownloadCloud size={15} />}
                {importing ? "Memuat…" : "Muat dari URL"}
              </button>
            </div>
            <p className={styles.hint}>
              Diagram akan ditarik otomatis dan tampil di editor. Syarat: file Google Drive dibagikan “Anyone with the link”.
            </p>
          </div>
        )}

        {/* DRAW.IO EDITOR — hanya untuk kategori diagram */}
        {isDiagram && (
          <div className={styles.formGroup}>
            <label className={styles.label}>Edit Diagram</label>
            <DrawioEditor
              ref={editorRef}
              value={form.diagram_xml}
              onChange={handleDiagramChange}
              onSaved={() => showToast("Diagram tersimpan di editor", "success")}
            />
            <p className={styles.hintTip}>
              <Info size={13} />
              Perubahan diagram tersimpan otomatis. Klik <strong>Perbarui Dokumen</strong> di bawah untuk menyimpan ke database.
            </p>
          </div>
        )}

        <div className={styles.formGroup}>
          <label className={styles.label}>Konten (HTML / Markdown)</label>
          <textarea
            className={styles.textarea}
            rows={4}
            placeholder="Konten dokumen"
            value={form.konten}
            onChange={(e) => setField("konten", e.target.value)}
          />
        </div>

        {!isDiagram && (
          <div className={styles.formGroup}>
            <label className={styles.label}>URL File / Gambar</label>
            <input
              className={styles.input}
              placeholder="https://... atau /uploads/..."
              value={form.file_url}
              onChange={(e) => setField("file_url", e.target.value)}
            />
            <p className={styles.hint}>
              Opsional — gunakan bila ingin melampirkan gambar/berkas ekspor tambahan.
            </p>
          </div>
        )}

        <div className={styles.formActions}>
          <button type="button" className={styles.cancelBtn} onClick={() => router.back()}>
            Batal
          </button>
          <button type="submit" className={styles.saveBtn} disabled={loading}>
            {loading ? <span className={styles.spin} /> : <Save size={15} />}
            {loading ? "Menyimpan..." : "Perbarui Dokumen"}
          </button>
        </div>
      </form>
    </div>
  );
}
