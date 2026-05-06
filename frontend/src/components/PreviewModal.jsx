"use client";

import { useEffect, useRef, useState } from "react";
import { X, Download, Loader2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function toSlug(s) {
  return s.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
}

export default function PreviewModal({ prodi, onClose }) {
  const slug = toSlug(prodi);
  const downloadUrl = `${API}/uploads/templates/${slug}.docx`;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const containerRef = useRef(null);

  /* ESC close */
  useEffect(() => {
    const fn = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  /* RENDER DOCX */
  useEffect(() => {
    const renderDoc = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(downloadUrl, { credentials: "include" });

        if (!res.ok) {
          throw new Error(
            res.status === 404
              ? "Template belum diupload"
              : `Server error (${res.status})`
          );
        }

        const blob = await res.blob();

        const { renderAsync } = await import("docx-preview");

        if (!containerRef.current) return;
        containerRef.current.innerHTML = "";

        await renderAsync(blob, containerRef.current, null, {
          className: "docx",
          inWrapper: true,
          breakPages: true,

          /* 🔥 PENTING UNTUK AKURASI */
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,

          renderHeaders: true,
          renderFooters: true,

          useBase64URL: true, // gambar & watermark
        });

        setLoading(false);
      } catch (e) {
        setError(e.message);
        setLoading(false);
      }
    };

    renderDoc();
  }, [downloadUrl]);

  return (
    <div className="overlay">
      <div className="header">
        <span>Preview Template — {prodi}</span>

        <div className="actions">
          <a href={downloadUrl} download>
            <Download size={14} /> Download
          </a>
          <button onClick={onClose}>
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="body">
        {loading && (
          <div className="loading">
            <Loader2 className="spin" size={20} />
            Memuat dokumen Word...
          </div>
        )}

        {error && <div className="error">{error}</div>}

        <div ref={containerRef} className="docx-container" />
      </div>

      <style jsx>{`
        .overlay {
          position: fixed;
          inset: 0;
          background: #2a1a0e;
          z-index: 9999;
          display: flex;
          flex-direction: column;
        }

        .header {
          background: #1e0f05;
          color: #f5dfc0;
          padding: 12px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .actions {
          display: flex;
          gap: 10px;
        }

        .actions a {
          background: #2563eb;
          color: white;
          padding: 6px 12px;
          border-radius: 8px;
          display: flex;
          gap: 5px;
          text-decoration: none;
          font-size: 13px;
        }

        .actions button {
          background: rgba(255,255,255,0.15);
          border: none;
          color: white;
          padding: 6px;
          border-radius: 6px;
          cursor: pointer;
        }

        .body {
          flex: 1;
          overflow: auto;
          padding: 30px 20px;
          display: flex;
          justify-content: center;
        }

        /* 🔥 FIX UTAMA AGAR MIRIP WORD */
        .docx-container {
          width: 100%;
          max-width: 900px;
        }

        section.docx {
          background: #fff !important;
          margin: 0 auto 24px !important;

          /* A4 EXACT */
          width: 210mm !important;
          min-height: 297mm !important;

          /* Margin Word */
          padding: 2.54cm 3.17cm !important;

          box-shadow:
            0 4px 6px rgba(0,0,0,0.25),
            0 12px 40px rgba(0,0,0,0.45);

          border-radius: 2px;
        }

        /* 🔥 TABLE FIX (penting dari file kamu) */
        .docx table {
          width: 100% !important;
          border-collapse: collapse !important;
        }

        .docx td,
        .docx th {
          border: 1px solid #000 !important;
          padding: 4px !important;
          vertical-align: top;
        }

        /* 🔥 WATERMARK */
        .docx img {
          max-width: 100% !important;
        }

        /* 🔥 TEXT */
        .docx {
          font-family: "Times New Roman", Times, serif !important;
          font-size: 11pt !important;
          line-height: 1.5 !important;
        }

        .loading {
          color: #f5dfc0;
          display: flex;
          gap: 10px;
          margin-top: 60px;
        }

        .error {
          color: #fca5a5;
          margin-top: 40px;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}