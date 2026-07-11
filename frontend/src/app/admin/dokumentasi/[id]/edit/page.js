"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, X, AlertCircle, CheckCircle2, RefreshCw, ExternalLink } from "lucide-react";
import styles from "../../dokumentasi.module.css";
import { apiFetch } from "@/lib/api";

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

export default function EditDokumenPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [toast, setToast] = useState(null);
  const [diagramXml, setDiagramXml] = useState("");
  const [iframeError, setIframeError] = useState(false);
  const iframeRef = useRef(null);

  const [form, setForm] = useState({
    judul: "",
    kategori: "usecase",
    deskripsi: "",
    konten: "",
    file_url: "",
    diagram_xml: "",
  });

  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const isDiagram = ["usecase", "activity", "class", "flowchart", "sequence"].includes(form.kategori);

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
        if (data.diagram_xml) {
          setDiagramXml(data.diagram_xml);
        }
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setFetching(false);
      }
    };
    loadData();
  }, [id]);

  // Listener untuk menerima XML dari draw.io
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.action === "save" && event.data.xml) {
        setDiagramXml(event.data.xml);
        setField("diagram_xml", event.data.xml);
        showToast("Diagram berhasil disimpan!", "success");
      }
      if (event.data && event.data.action === "init") {
        // Kirim XML yang sudah ada ke draw.io
        if (iframeRef.current && !iframeError) {
          try {
            iframeRef.current.contentWindow.postMessage(
              {
                action: "load",
                xml: diagramXml || '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></mxGraphModel></root>',
                autosave: 1,
              },
              "*"
            );
          } catch (e) {
            setIframeError(true);
          }
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [diagramXml, iframeError]);

  const loadDiagramToDrawio = () => {
    if (iframeRef.current && !iframeError) {
      try {
        iframeRef.current.contentWindow.postMessage(
          {
            action: "load",
            xml: diagramXml || '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></mxGraphModel></root>',
            autosave: 1,
          },
          "*"
        );
        showToast("Memuat diagram...", "success");
      } catch (e) {
        setIframeError(true);
        showToast("Gagal memuat diagram. Buka di tab baru.", "error");
      }
    }
  };

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
      const res = await apiFetch(`/api/dokumentasi/${id}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Dokumen berhasil diperbarui!");
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

        {/* 🔥 DRAW.IO EDITOR - Hanya untuk diagram */}
        {isDiagram && (
          <div className={styles.formGroup}>
            <label className={styles.label}>Edit Diagram (draw.io)</label>

            {iframeError ? (
              <div className={styles.drawioErrorBox}>
                <AlertCircle size={24} />
                <p>Gagal memuat draw.io di dalam halaman.</p>
                <div className={styles.drawioFallbackActions}>
                  <a
                    href="https://app.diagrams.net/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.drawioFallbackBtn}
                  >
                    <ExternalLink size={16} /> Buka draw.io di tab baru
                  </a>
                  <p className={styles.hint}>
                    Buat diagram di draw.io, export sebagai PNG, lalu upload ke server dan masukkan URL-nya di bawah.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.drawioContainer}>
                  <iframe
                    ref={iframeRef}
                    src="https://embed.diagrams.net/?embed=1&ui=min&spin=1&proto=json&noSaveBtn=1"
                    className={styles.drawioIframe}
                    onLoad={() => {
                      // Tunggu sebentar agar draw.io siap, lalu load diagram
                      setTimeout(loadDiagramToDrawio, 2000);
                    }}
                    onError={() => setIframeError(true)}
                    allow="clipboard-read; clipboard-write"
                  />
                </div>
                <div className={styles.drawioToolbar}>
                  <button
                    type="button"
                    className={styles.drawioLoadBtn}
                    onClick={loadDiagramToDrawio}
                  >
                    <RefreshCw size={14} /> Muat Ulang Diagram
                  </button>
                  <span className={styles.drawioStatus}>
                    {diagramXml ? "✅ Diagram tersedia" : "🔄 Buat diagram baru"}
                  </span>
                  <a
                    href="https://app.diagrams.net/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.drawioExternalLink}
                  >
                    <ExternalLink size={14} /> Buka di tab baru
                  </a>
                  <p className={styles.hint}>
                    💡 Edit diagram di atas, lalu klik <strong>Save</strong> di draw.io untuk menyimpan perubahan.
                  </p>
                </div>
              </>
            )}
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

        <div className={styles.formGroup}>
          <label className={styles.label}>URL File / Gambar</label>
          <input
            className={styles.input}
            placeholder="https://... atau /uploads/..."
            value={form.file_url}
            onChange={(e) => setField("file_url", e.target.value)}
          />
          <p className={styles.hint}>
            Jika sudah menggunakan draw.io di atas, URL ini opsional untuk export gambar tambahan.
            Jika draw.io tidak bisa dimuat, upload gambar diagram di sini.
          </p>
        </div>

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