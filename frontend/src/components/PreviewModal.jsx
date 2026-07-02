"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  X, Download, Loader2, ZoomIn, ZoomOut,
  FileText, AlertCircle, Printer, RotateCcw,
  ChevronLeft, ChevronRight, FileWarning,
} from "lucide-react";
import { getProdiConfig } from "@/lib/prodi-config";

/* ─────────────────────────────────────────
   KONFIGURASI WARNA PRODI
───────────────────────────────────────── */
const getPC = (nama) => getProdiConfig(nama);
const toSlug = (s) => s.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");

/* ─────────────────────────────────────────
   PREVIEW MODAL — WORD PRINT LAYOUT
───────────────────────────────────────── */
export default function PreviewModal({ prodi, onClose }) {
  const slug = toSlug(prodi);
  const cfg = getPC(prodi);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [zoom, setZoom] = useState(100);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const containerRef = useRef(null);
  const scrollRef = useRef(null);
  const pagesRef = useRef([]);

  /* ── ESC close ── */
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  /* ── Prevent body scroll ── */
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, []);

  /* ── Ambil blob dari localStorage ── */
  const getBlobFromStorage = useCallback(() => {
    const b64 = localStorage.getItem(`template_${slug}`);
    if (!b64) throw new Error("Belum ada file .docx untuk prodi ini.");

    // Handle both dataURL format and plain base64
    let base64Data = b64;
    if (b64.includes(",")) {
      base64Data = b64.split(",")[1];
    }

    try {
      const bytes = atob(base64Data);
      const ab = new ArrayBuffer(bytes.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < bytes.length; i++) ia[i] = bytes.charCodeAt(i);
      return new Blob([ab], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    } catch (e) {
      throw new Error("Format file tidak valid atau data corrupt.");
    }
  }, [slug]);

  /* ── Render DOCX dengan docx-preview ── */
  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      try {
        setLoading(true);
        setError("");

        const blob = getBlobFromStorage();

        // Dynamic import docx-preview
        let renderAsync;
        try {
          const mod = await import("docx-preview");
          renderAsync = mod.renderAsync;
        } catch (e) {
          throw new Error("Library docx-preview tidak tersedia. Pastikan sudah di-install (npm install docx-preview).");
        }

        if (!containerRef.current || cancelled) return;
        containerRef.current.innerHTML = "";

        await renderAsync(blob, containerRef.current, null, {
          className: "docx-page",
          inWrapper: true,
          breakPages: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
          useBase64URL: true,
          ignoreLastRenderedPageBreak: false,
        });

        if (cancelled) return;

        // Hitung halaman setelah render
        setTimeout(() => {
          if (cancelled) return;
          const pages = containerRef.current?.querySelectorAll("section.docx-page, .docx-page");
          if (pages && pages.length > 0) {
            setPageCount(pages.length);
            pagesRef.current = Array.from(pages);
          } else {
            // Fallback: kalau tidak ada section, anggap 1 halaman
            setPageCount(1);
          }
          setLoading(false);
        }, 400);

      } catch (e) {
        if (!cancelled) {
          setError(e.message || "Gagal merender dokumen Word.");
          setLoading(false);
        }
      }
    };

    render();
    return () => { cancelled = true; };
  }, [getBlobFromStorage]);

  /* ── Zoom controls ── */
  const zoomIn = () => setZoom(z => Math.min(z + 10, 200));
  const zoomOut = () => setZoom(z => Math.max(z - 10, 40));
  const zoomReset = () => setZoom(100);

  /* ── Ctrl+Scroll zoom ── */
  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom(z => Math.min(Math.max(z - Math.sign(e.deltaY) * 5, 40), 200));
    }
  }, []);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  /* ── Navigation ── */
  const goToPage = (page) => {
    if (page < 1 || page > pageCount) return;
    setCurrentPage(page);
    const target = pagesRef.current[page - 1];
    if (target && scrollRef.current) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  /* ── Download ── */
  const download = () => {
    const b64 = localStorage.getItem(`template_${slug}`);
    if (!b64) return;
    const a = document.createElement("a");
    a.href = b64;
    a.download = localStorage.getItem(`template_${slug}_name`) || `Template_SKPI_${prodi}.docx`;
    a.click();
  };

  /* ── Retry ── */
  const handleRetry = () => {
    setError("");
    setLoading(true);
    window.location.reload();
  };

  return (
    <>
      {/* ════════════════════════════════════════════════
          GLOBAL STYLES — Word Print Layout
      ════════════════════════════════════════════════ */}
      <style>{`
        /* ── Root overlay ── */
        #word-preview-root {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
          background: #525252;
        }

        /* ── Toolbar ── */
        #wp-toolbar {
          height: 48px;
          background: #1e1e1e;
          border-bottom: 1px solid #333;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          gap: 12px;
          flex-shrink: 0;
          user-select: none;
        }
        .wp-left   { display:flex; align-items:center; gap:10px; flex:1; min-width:0; }
        .wp-center  { display:flex; align-items:center; gap:8px; flex-shrink:0; }
        .wp-right   { display:flex; align-items:center; gap:8px; flex:1; justify-content:flex-end; }

        .wp-prodi {
          font-size: 13px; font-weight: 600; color: #f0dfc0;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .wp-pages {
          font-size: 11px; color: rgba(255,255,255,.45);
          background: rgba(255,255,255,.08);
          padding: 2px 10px; border-radius: 10px; white-space: nowrap;
        }
        .wp-icon-btn {
          width: 32px; height: 32px; border-radius: 6px;
          border: 1px solid rgba(255,255,255,.15);
          background: rgba(255,255,255,.07); color: #ddd;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all .15s; flex-shrink: 0;
        }
        .wp-icon-btn:hover:not(:disabled) { background: rgba(255,255,255,.15); color: #fff; }
        .wp-icon-btn:disabled { opacity: .3; cursor: not-allowed; }

        .wp-zoom-pct {
          min-width: 52px; text-align: center; font-size: 12px; color: #ddd;
          background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.14);
          border-radius: 6px; padding: 5px 8px; cursor: pointer;
          font-variant-numeric: tabular-nums; font-weight: 600;
        }
        .wp-zoom-pct:hover { background: rgba(255,255,255,.14); }

        .wp-slider {
          width: 100px; height: 4px; cursor: pointer; accent-color: ${cfg.primary};
        }

        .wp-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 7px; font-size: 12px; font-weight: 600;
          background: rgba(255,255,255,.09); border: 1px solid rgba(255,255,255,.18);
          color: #e0e0e0; cursor: pointer; transition: all .15s;
        }
        .wp-btn:hover { background: rgba(255,255,255,.16); color: #fff; }

        .wp-btn-primary {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 7px; font-size: 12px; font-weight: 700;
          background: ${cfg.primary}; border: none; color: #fff; cursor: pointer;
          transition: opacity .15s;
        }
        .wp-btn-primary:hover { opacity: .85; }

        /* ── Ruler ── */
        #wp-ruler {
          height: 24px;
          background: #e8e8e8;
          border-bottom: 1px solid #bbb;
          flex-shrink: 0;
          overflow: hidden;
          position: relative;
        }
        .wp-ruler-track {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: 210mm;
          height: 100%;
          display: flex;
        }
        .wp-ruler-mark {
          flex: 1; position: relative;
          border-left: 1px solid #bbb;
        }
        .wp-ruler-mark:first-child { border-left: none; }
        .wp-ruler-num {
          position: absolute; top: 10px; left: 2px;
          font-size: 9px; color: #666; user-select: none;
        }

        /* ── Canvas (scroll area) ── */
        #wp-canvas {
          flex: 1;
          overflow-y: auto;
          overflow-x: auto;
          background: #525252;
          padding: 32px 24px 80px;
          scroll-behavior: smooth;
        }

        /* ── Pages wrapper ── */
        #wp-pages {
          display: flex;
          flex-direction: column;
          align-items: center;
          transform-origin: top center;
          transition: transform .2s ease;
        }

        /* ════════════════════════════════════════════════
           A4 PAGE — EXACT WORD PRINT LAYOUT
        ════════════════════════════════════════════════ */
        section.docx-page,
        .docx-page {
          background: #fff !important;
          box-shadow:
            0 1px 3px rgba(0,0,0,.25),
            0 6px 28px rgba(0,0,0,.5) !important;
          border-radius: 1px !important;
          margin: 0 auto 28px auto !important;
          width: 210mm !important;
          min-height: 297mm !important;
          padding: 2.54cm 3.17cm !important;
          box-sizing: border-box !important;
          overflow-wrap: break-word !important;
          position: relative !important;
        }

        /* Typography override untuk fidelity */
        section.docx-page,
        section.docx-page p,
        section.docx-page span,
        section.docx-page div,
        section.docx-page li,
        section.docx-page td,
        section.docx-page th,
        .docx-page,
        .docx-page p,
        .docx-page span,
        .docx-page div {
          font-family: "Times New Roman", Times, serif !important;
        }

        /* Tables */
        section.docx-page table,
        .docx-page table {
          width: 100% !important;
          border-collapse: collapse !important;
          table-layout: fixed !important;
        }
        section.docx-page td,
        section.docx-page th,
        .docx-page td,
        .docx-page th {
          vertical-align: top;
          word-break: break-word !important;
        }

        /* Images */
        section.docx-page img,
        .docx-page img {
          max-width: 100% !important;
          height: auto !important;
        }

        /* Headers & footers */
        header.docx-header,
        footer.docx-footer {
          padding: 0 !important;
        }

        /* ── Status bar ── */
        #wp-status {
          height: 26px;
          background: #1e1e1e;
          border-top: 1px solid #333;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          font-size: 11px;
          color: rgba(255,255,255,.4);
          flex-shrink: 0;
        }

        /* ── Loading / Error states ── */
        .wp-state {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding-top: 100px; text-align: center;
        }
        @keyframes wp-spin { to { transform: rotate(360deg); } }
        .wp-spin { animation: wp-spin 1s linear infinite; }

        /* ── Page navigation indicator ── */
        .wp-page-nav {
          display: flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,.08);
          border-radius: 6px; padding: 4px 8px;
        }
        .wp-page-nav input {
          width: 36px; text-align: center; background: rgba(255,255,255,.1);
          border: 1px solid rgba(255,255,255,.2); border-radius: 4px;
          color: #fff; font-size: 12px; padding: 2px;
        }

        /* ════════════════════════════════════════════════
           PRINT STYLES
        ════════════════════════════════════════════════ */
        @media print {
          #wp-toolbar,
          #wp-ruler,
          #wp-status { display: none !important; }

          #word-preview-root {
            position: static !important;
            background: #fff !important;
          }
          #wp-canvas {
            overflow: visible !important;
            height: auto !important;
            background: #fff !important;
            padding: 0 !important;
          }
          #wp-pages {
            transform: none !important;
          }
          section.docx-page,
          .docx-page {
            box-shadow: none !important;
            margin: 0 !important;
            width: 100% !important;
            page-break-after: always;
            page-break-inside: avoid;
          }
        }

        /* Scrollbar styling */
        #wp-canvas::-webkit-scrollbar { width: 10px; height: 10px; }
        #wp-canvas::-webkit-scrollbar-track { background: #3a3a3a; }
        #wp-canvas::-webkit-scrollbar-thumb { background: #666; border-radius: 5px; }
        #wp-canvas::-webkit-scrollbar-thumb:hover { background: #888; }
      `}</style>

      {/* ════ MARKUP ════ */}
      <div id="word-preview-root">

        {/* ── Toolbar ── */}
        <div id="wp-toolbar">
          {/* Left */}
          <div className="wp-left">
            <FileText size={16} color={cfg.primary} />
            <span className="wp-prodi">Print Layout — {prodi}</span>
            {!loading && !error && pageCount > 0 && (
              <span className="wp-pages">{pageCount} Halaman</span>
            )}
          </div>

          {/* Center — Zoom & Nav */}
          <div className="wp-center">
            <button className="wp-icon-btn" onClick={zoomOut} title="Perkecil">
              <ZoomOut size={14} />
            </button>
            <button className="wp-zoom-pct" onClick={zoomReset} title="Reset zoom">
              {zoom}%
            </button>
            <button className="wp-icon-btn" onClick={zoomIn} title="Perbesar">
              <ZoomIn size={14} />
            </button>
            <input
              className="wp-slider"
              type="range"
              min={40}
              max={200}
              step={5}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              title="Geser untuk zoom"
            />

            {pageCount > 1 && (
              <div className="wp-page-nav">
                <button
                  className="wp-icon-btn"
                  style={{ width: 24, height: 24 }}
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft size={14} />
                </button>
                <span style={{ color: "#ddd", fontSize: 12 }}>
                  <input
                    type="text"
                    value={currentPage}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) goToPage(val);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val)) goToPage(val);
                      }
                    }}
                  />{" "}
                  / {pageCount}
                </span>
                <button
                  className="wp-icon-btn"
                  style={{ width: 24, height: 24 }}
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= pageCount}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Right */}
          <div className="wp-right">
            <button className="wp-btn" onClick={() => window.print()} title="Cetak / Save as PDF">
              <Printer size={14} /> Cetak PDF
            </button>
            <button className="wp-btn-primary" onClick={download}>
              <Download size={14} /> Download .docx
            </button>
            <button className="wp-icon-btn" onClick={onClose} title="Tutup (Esc)" style={{ marginLeft: 4 }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Ruler ── */}
        {!loading && !error && (
          <div id="wp-ruler">
            <div className="wp-ruler-track">
              {Array.from({ length: 21 }, (_, i) => (
                <div key={i} className="wp-ruler-mark">
                  {i % 2 === 0 && i > 0 && (
                    <span className="wp-ruler-num">{i}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Canvas (scroll area) ── */}
        <div id="wp-canvas" ref={scrollRef}>
          {/* Loading */}
          {loading && (
            <div className="wp-state">
              <Loader2 size={40} className="wp-spin" color={cfg.primary} />
              <p style={{ color: "#e8c99a", marginTop: 18, fontSize: 15, fontWeight: 500 }}>
                Memuat dokumen Word...
              </p>
              <p style={{ color: "rgba(232,201,154,.5)", fontSize: 13, marginTop: 6 }}>
                Merender template {prodi}
              </p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="wp-state">
              <FileWarning size={44} color="#fca5a5" />
              <p style={{ color: "#fca5a5", fontWeight: 700, marginTop: 16, fontSize: 16 }}>
                Gagal memuat template
              </p>
              <p
                style={{
                  color: "rgba(252,165,165,.7)",
                  fontSize: 13,
                  marginTop: 10,
                  maxWidth: 400,
                  textAlign: "center",
                  lineHeight: 1.5,
                }}
              >
                {error}
              </p>
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button className="wp-btn" onClick={handleRetry}>
                  <RotateCcw size={14} /> Coba Lagi
                </button>
                <button className="wp-btn-primary" onClick={download}>
                  <Download size={14} /> Download .docx
                </button>
              </div>
            </div>
          )}

          {/* Pages */}
          {!loading && !error && (
            <div id="wp-pages" style={{ transform: `scale(${zoom / 100})` }}>
              <div ref={containerRef} />
            </div>
          )}
        </div>

        {/* ── Status bar ── */}
        {!loading && !error && (
          <div id="wp-status">
            <span>{prodi}</span>
            <span>
              Zoom {zoom}% &nbsp;·&nbsp; {pageCount} halaman &nbsp;·&nbsp; Ctrl + Scroll untuk zoom
            </span>
          </div>
        )}
      </div>
    </>
  );
}