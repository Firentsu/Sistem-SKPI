"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, Download, Edit2, Tag, Clock, AlertCircle } from "lucide-react";
import styles from "../../dokumentasi.module.css";
import { apiFetch, getUploadUrl } from "@/lib/api";
import DrawioEditor from "@/components/DrawioEditor";

const KATEGORI_LABEL = {
  usecase: "Use Case Diagram",
  activity: "Activity Diagram",
  class: "Class Diagram",
  flowchart: "Flowchart",
  sequence: "Sequence Diagram",
  laporan: "Laporan",
  panduan: "Panduan",
  lainnya: "Lainnya",
};

const DIAGRAM_KATEGORI = ["usecase", "activity", "class", "flowchart", "sequence"];

export default function ViewDokumenPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await apiFetch(`/api/dokumentasi/${id}`);
        if (!res.ok) throw new Error("Dokumen tidak ditemukan");
        const data = await res.json();
        setDoc(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.loadingRow}>
        <RefreshCw size={24} className={styles.spin} />
        <p>Memuat dokumen...</p>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className={styles.emptyState}>
        <AlertCircle size={44} />
        <p>{error || "Dokumen tidak ditemukan"}</p>
        <button className={styles.backBtn} onClick={() => router.push("/admin/dokumentasi")}>
          <ArrowLeft size={15} /> Kembali ke daftar
        </button>
      </div>
    );
  }

  const isDiagram = DIAGRAM_KATEGORI.includes(doc.kategori);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <button className={styles.backBtn} onClick={() => router.back()}>
            <ArrowLeft size={15} /> Kembali
          </button>
          <h1 className={styles.title}>{doc.judul}</h1>
          <div className={styles.metaRow}>
            <span className={styles.metaItem}>
              <Tag size={13} /> {KATEGORI_LABEL[doc.kategori] || doc.kategori}
            </span>
            <span className={styles.metaItem}>
              <Clock size={13} /> Diperbarui {new Date(doc.updated_at).toLocaleString("id-ID", {
                day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </span>
          </div>
        </div>
        <div className={styles.viewActions}>
          {doc.file_url && (
            <a href={getUploadUrl(doc.file_url)} download className={styles.downloadBtn}>
              <Download size={14} /> Download File
            </a>
          )}
          <a href={`/admin/dokumentasi/${doc.id}/edit`} className={styles.editBtn}>
            <Edit2 size={14} /> Edit
          </a>
        </div>
      </div>

      {doc.deskripsi && (
        <div className={styles.descBox}>
          <strong>Deskripsi</strong>
          <p>{doc.deskripsi}</p>
        </div>
      )}

      {isDiagram && doc.diagram_xml && (
        <div className={styles.viewerBlock}>
          <DrawioEditor value={doc.diagram_xml} readOnly height={600} />
        </div>
      )}

      {isDiagram && !doc.diagram_xml && !doc.file_url && (
        <div className={styles.emptyState}>
          <p>Belum ada diagram tersimpan</p>
          <span>Buka Edit untuk mulai menggambar diagram.</span>
        </div>
      )}

      {doc.file_url && (
        <div className={styles.viewerImageWrap}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getUploadUrl(doc.file_url)}
            alt={doc.judul}
            className={styles.viewerImage}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        </div>
      )}

      {doc.konten && (
        <div className={styles.contentPreview}>
          <h3>Konten</h3>
          <div dangerouslySetInnerHTML={{ __html: doc.konten }} />
        </div>
      )}
    </div>
  );
}
