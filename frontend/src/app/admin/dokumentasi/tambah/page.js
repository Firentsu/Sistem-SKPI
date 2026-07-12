"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, X, AlertCircle, CheckCircle2, Info, Link2, DownloadCloud, Loader2 } from "lucide-react";
import styles from "../dokumentasi.module.css";
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

const looksLikeDiagramLink = (url = "") =>
  /diagrams\.net|drive\.google\.com|docs\.google\.com|draw\.io/i.test(url);

export default function TambahDokumenPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDiagramChange = useCallback((xml) => {
    setForm((prev) => (prev.diagram_xml === xml ? prev : { ...prev, diagram_xml: xml }));
  }, []);

  const importFromUrl = async (url) => {
    if (!url || !looksLikeDiagramLink(url)) {
      showToast("Tempel tautan draw.io / Google Drive yang valid.", "error");
      return;
    }
    setImporting(true);
    try {
      const res = await apiFetch(`/api/dokumentasi/import?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Gagal memuat diagram dari URL.", "error");
        return;
      }
      setField("diagram_xml", data.xml);
      editorRef.current?.load(data.xml);
      showToast("Diagram berhasil dimuat dari URL!", "success");
    } catch {
      showToast("Terjadi kesalahan saat memuat diagram.", "error");
    } finally {
      setImporting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.judul.trim() || !form.kategori) {
      showToast("Judul dan kategori wajib diisi.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch("/api/dokumentasi", {
        method: "POST",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Dokumen berhasil ditambahkan!");
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
        <div className={styles.formRow}>
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

        {/* IMPORT DARI URL — untuk kategori diagram */}
        {isDiagram && (
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <Link2 size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />
              Link Diagram (draw.io / Google Drive) <span className={styles.optional}>— opsional</span>
            </label>
            <div className={styles.inputWithBtn}>
              <input
                className={styles.input}
                placeholder="Tempel tautan untuk memuat diagram yang sudah ada…"
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
              Punya diagram di Google Drive/draw.io? Tempel tautannya untuk memuat otomatis. File Drive harus dibagikan “Anyone with the link”.
            </p>
          </div>
        )}

        {/* DRAW.IO EDITOR — langsung tersedia untuk kategori diagram */}
        {isDiagram && (
          <div className={styles.formGroup}>
            <label className={styles.label}>Buat Diagram</label>
            <DrawioEditor
              ref={editorRef}
              value={form.diagram_xml}
              onChange={handleDiagramChange}
              onSaved={() => showToast("Diagram tersimpan di editor", "success")}
            />
            <p className={styles.hintTip}>
              <Info size={13} />
              Gambar diagram langsung di sini atau muat dari URL di atas. Perubahan tersimpan otomatis, lalu klik <strong>Simpan Dokumen</strong>.
            </p>
          </div>
        )}

        <div className={styles.formGroup}>
          <label className={styles.label}>Konten (HTML / Markdown)</label>
          <textarea
            className={styles.textarea}
            rows={5}
            placeholder="Tulis konten dokumen di sini. Bisa berupa HTML atau Markdown."
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
              Opsional — bila sudah memiliki gambar diagram atau berkas, masukkan URL-nya di sini.
            </p>
          </div>
        )}

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
