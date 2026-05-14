"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  X, Download, Loader2, ZoomIn, ZoomOut,
  FileText, AlertCircle, Printer,
} from "lucide-react";

const PRODI_CFG = {
  "Teknologi Informasi":           { primary:"#ff7f00", gradient:"linear-gradient(135deg,#ff7f00,#e06000)" },
  "Sistem Informasi":              { primary:"#3d1111", gradient:"linear-gradient(135deg,#3d1111,#7a3333)" },
  "Manajemen":                     { primary:"#0077aa", gradient:"linear-gradient(135deg,#0077aa,#005588)" },
  "Kewirausahaan":                 { primary:"#cc2200", gradient:"linear-gradient(135deg,#cc2200,#992200)" },
  "Pendidikan Guru Sekolah Dasar": { primary:"#7a0087", gradient:"linear-gradient(135deg,#7a0087,#550066)" },
  "Agroekoteknologi":              { primary:"#008b80", gradient:"linear-gradient(135deg,#008b80,#006655)" },
};
const getPC  = (n) => PRODI_CFG[n] || { primary:"#765439", gradient:"linear-gradient(135deg,#765439,#3d200a)" };
const toSlug = (s) => s.trim().replace(/\s+/g,"_").replace(/[^a-zA-Z0-9_]/g,"");

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function PreviewModal({ prodi, onClose }) {
  const slug = toSlug(prodi);
  const cfg  = getPC(prodi);

  const [status,   setStatus]   = useState("loading"); // loading | ok | error
  const [errMsg,   setErrMsg]   = useState("");
  const [zoom,     setZoom]     = useState(100);
  const [blobUrl,  setBlobUrl]  = useState("");
  const iframeRef = useRef(null);
  const containerRef = useRef(null);

  // ESC close
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Fetch PDF dari backend
  useEffect(() => {
    setStatus("loading"); setErrMsg(""); setBlobUrl("");
    fetch(`${API}/api/template-skpi/preview/${slug}`, { credentials:"include" })
      .then(async res => {
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || `Error ${res.status}`);
        }
        const blob = await res.blob();
        setBlobUrl(URL.createObjectURL(blob));
        setStatus("ok");
      })
      .catch(e => { setErrMsg(e.message); setStatus("error"); });
  }, [slug]);

  useEffect(() => () => { if (blobUrl) URL.revokeObjectURL(blobUrl); }, [blobUrl]);

  // Zoom controls
  const zoomIn    = () => setZoom(z => Math.min(z+10, 200));
  const zoomOut   = () => setZoom(z => Math.max(z-10, 40));
  const zoomReset = () => setZoom(100);

  // Ctrl+Scroll untuk zoom
  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom(z => Math.min(Math.max(z - Math.sign(e.deltaY)*5, 40), 200));
    }
  }, []);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive:false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // Cetak PDF
  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
  };

  // Download file .docx asli
  const download = () => {
    const a = Object.assign(document.createElement("a"), {
      href: `${API}/uploads/templates/${slug}.docx`,
      download: `Template_SKPI_${prodi}.docx`,
    });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", flexDirection: "column",
      background: "#1e1e1e", fontFamily: "'Segoe UI', system-ui, sans-serif"
    }}>
      {/* Toolbar */}
      <div style={{
        height: 48, background: "#2d2d2d", borderBottom: "1px solid #3d3d3d",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", gap: 12, flexShrink: 0, userSelect: "none"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          <FileText size={16} color={cfg.primary}/>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#f0dfc0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Print Layout — {prodi}
          </span>
          {status === "ok" && (
            <span style={{ fontSize: 10, fontWeight: 700, background: "#dc2626", color: "#fff", padding: "2px 8px", borderRadius: 4 }}>
              PDF
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="wp-icon-btn" onClick={zoomOut} title="Perkecil"><ZoomOut size={14}/></button>
          <button className="wp-zoom-pct" onClick={zoomReset} title="Reset">{zoom}%</button>
          <button className="wp-icon-btn" onClick={zoomIn} title="Perbesar"><ZoomIn size={14}/></button>
          <input type="range" min={40} max={200} step={5} value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            style={{ width: 100, accentColor: cfg.primary }}/>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {status === "ok" && (
            <button className="wp-btn" onClick={handlePrint} title="Cetak PDF">
              <Printer size={14}/> Cetak
            </button>
          )}
          <button className="wp-btn" onClick={download}>
            <Download size={14}/> Download .docx
          </button>
          <button className="wp-icon-btn" onClick={onClose} title="Tutup (Esc)" style={{ marginLeft: 4 }}>
            <X size={16}/>
          </button>
        </div>
      </div>

      {/* Ruler (opsional, hanya muncul jika PDF berhasil) */}
      {status === "ok" && (
        <div style={{
          height: 24, background: "#e8e8e8", borderBottom: "1px solid #bbb",
          flexShrink: 0, overflow: "hidden", position: "relative"
        }}>
          <div style={{
            position: "absolute", left: "50%", transform: "translateX(-50%)",
            width: "210mm", height: "100%", display: "flex"
          }}>
            {Array.from({ length: 21 }, (_, i) => (
              <div key={i} style={{ flex: 1, position: "relative", borderLeft: i > 0 ? "1px solid #bbb" : "none" }}>
                {i % 2 === 0 && i > 0 && (
                  <span style={{ position: "absolute", top: 10, left: 2, fontSize: 9, color: "#666" }}>{i}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Canvas PDF */}
      <div ref={containerRef} style={{
        flex: 1, overflow: "auto", background: "#525252", display: "flex",
        justifyContent: "center", alignItems: "flex-start"
      }}>
        {status === "loading" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 100, textAlign: "center" }}>
            <Loader2 size={40} className="wp-spin" color={cfg.primary}/>
            <p style={{ color: "#e8c99a", marginTop: 18, fontSize: 15, fontWeight: 500 }}>Mengkonversi ke PDF…</p>
            <p style={{ color: "rgba(232,201,154,.5)", fontSize: 13, marginTop: 6 }}>Memproses template {prodi}</p>
          </div>
        )}
        {status === "error" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 100, textAlign: "center" }}>
            <AlertCircle size={44} color="#fca5a5"/>
            <p style={{ color: "#fca5a5", fontWeight: 700, marginTop: 16, fontSize: 16 }}>Gagal memuat template</p>
            <p style={{ color: "rgba(252,165,165,.7)", fontSize: 13, marginTop: 10, maxWidth: 400, textAlign: "center" }}>{errMsg}</p>
            <p style={{ color: "rgba(255,255,255,.2)", fontSize: 11, marginTop: 8 }}>Pastikan LibreOffice / Microsoft Word terinstall di server</p>
          </div>
        )}
        {status === "ok" && blobUrl && (
          <iframe
            ref={iframeRef}
            src={`${blobUrl}#toolbar=0&navpanes=0&view=FitH&zoom=${zoom}`}
            style={{
              width: "100%", height: "100%", border: "none",
              transform: `scale(${zoom/100})`,
              transformOrigin: "top center",
              background: "#fff"
            }}
            title={`Template SKPI ${prodi}`}
          />
        )}
      </div>

      {/* Status bar */}
      {status === "ok" && (
        <div style={{
          height: 26, background: "#2d2d2d", borderTop: "1px solid #3d3d3d",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px", fontSize: 11, color: "rgba(255,255,255,.4)", flexShrink: 0
        }}>
          <span>Template {prodi} — PDF siap</span>
          <span>Zoom {zoom}% &nbsp;·&nbsp; Ctrl+Scroll untuk zoom</span>
        </div>
      )}

      {/* Global styles for buttons (because inline style cannot cover hover) */}
      <style jsx>{`
        .wp-icon-btn, .wp-btn, .wp-zoom-pct {
          width: 32px; height: 32px; border-radius: 6px;
          border: 1px solid rgba(255,255,255,.15);
          background: rgba(255,255,255,.07); color: #ddd;
          cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
          transition: all .15s;
        }
        .wp-btn {
          width: auto; padding: 0 14px; gap: 6px;
          font-size: 12px; font-weight: 600;
          background: rgba(255,255,255,.09); border: 1px solid rgba(255,255,255,.18);
        }
        .wp-zoom-pct {
          width: auto; min-width: 52px; padding: 0 8px;
          font-size: 12px; font-weight: 600;
          background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.14);
        }
        .wp-icon-btn:hover, .wp-btn:hover, .wp-zoom-pct:hover {
          background: rgba(255,255,255,.16); color: #fff;
        }
        .wp-spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}