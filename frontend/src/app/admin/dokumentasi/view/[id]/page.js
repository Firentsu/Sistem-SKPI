"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, Download } from "lucide-react";
import styles from "../../dokumentasi.module.css";
import { apiFetch, getUploadUrl } from "@/lib/api";

export default function ViewDokumenPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await apiFetch(`/api/dokumentasi/${id}`);
        if (!res.ok) throw new Error("Dokumen tidak ditemukan");
        const data = await res.json();
        setDoc(data);
      } catch (err) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [id]);

  if (loading) {
    return <div className={styles.loadingRow}><RefreshCw size={24} className={styles.spin} /> Memuat...</div>;
  }

  if (!doc) return <div>Dokumen tidak ditemukan</div>;

  const isDiagram = ["usecase", "activity", "class", "flowchart", "sequence"].includes(doc.kategori);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <button className={styles.backBtn} onClick={() => router.back()}>
            <ArrowLeft size={15} /> Kembali
          </button>
          <h1 className={styles.title}>{doc.judul}</h1>
          <p className={styles.sub}>Kategori: {doc.kategori} · Diperbarui: {new Date(doc.updated_at).toLocaleString()}</p>
        </div>
        <div className={styles.viewActions}>
          {doc.file_url && (
            <a href={getUploadUrl(doc.file_url)} download className={styles.downloadBtn}>
              <Download size={14} /> Download File
            </a>
          )}
          <a href={`/admin/dokumentasi/${doc.id}/edit`} className={styles.editBtn}>
            Edit
          </a>
        </div>
      </div>

      {isDiagram && doc.diagram_xml && (
        <div className={styles.viewerContainer}>
          <iframe
            src={`https://app.diagrams.net/?embed=1&ui=min&spin=1&proto=json&p=view`}
            className={styles.viewerIframe}
            onLoad={(e) => {
              // Kirim XML untuk di-load dalam mode view
              const iframe = e.target;
              setTimeout(() => {
                iframe.contentWindow.postMessage({
                  action: 'load',
                  xml: doc.diagram_xml,
                }, '*');
              }, 1000);
            }}
          />
        </div>
      )}

      {!isDiagram && doc.konten && (
        <div className={styles.contentPreview}>
          <h3>Konten</h3>
          <div dangerouslySetInnerHTML={{ __html: doc.konten }} />
        </div>
      )}

      {doc.deskripsi && (
        <div className={styles.descBox}>
          <strong>Deskripsi:</strong> {doc.deskripsi}
        </div>
      )}
    </div>
  );
}