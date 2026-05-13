"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  X, Download, Loader2, ZoomIn, ZoomOut,
  FileText, AlertCircle, Printer,
  ChevronLeft, ChevronRight,
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
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const embedRef   = useRef(null);
  const scrollRef  = useRef(null);
  const [blobUrl,  setBlobUrl]  = useState("");

  /* ESC close */
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  /* Lock body scroll */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  /* Fetch PDF dari backend */
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

  /* Zoom */
  const zoomIn    = () => setZoom(z => Math.min(z+10, 200));
  const zoomOut   = () => setZoom(z => Math.max(z-10, 40));
  const zoomReset = () => setZoom(100);

  /* Ctrl+Scroll */
  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom(z => Math.min(Math.max(z - Math.sign(e.deltaY)*5, 40), 200));
    }
  }, []);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive:false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  /* Download .docx */
  const download = () => {
    const a = Object.assign(document.createElement("a"), {
      href: `${API}/uploads/templates/${slug}.docx`,
      download: `Template_SKPI_${prodi}.docx`,
    });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return (
    <>
      <style>{`
        #word-preview-root {
          position:fixed; inset:0; z-index:9999;
          display:flex; flex-direction:column;
          font-family:'Segoe UI',system-ui,sans-serif;
          background:#1e1e1e;
        }
        #wp-toolbar {
          height:48px; background:#2d2d2d; border-bottom:1px solid #3d3d3d;
          display:flex; align-items:center; justify-content:space-between;
          padding:0 16px; gap:12px; flex-shrink:0; user-select:none;
        }
        .wp-left  { display:flex; align-items:center; gap:10px; flex:1; min-width:0; }
        .wp-center{ display:flex; align-items:center; gap:8px;  flex-shrink:0; }
        .wp-right { display:flex; align-items:center; gap:8px;  flex:1; justify-content:flex-end; }
        .wp-prodi { font-size:13px; font-weight:600; color:#f0dfc0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .wp-badge { font-size:10px; font-weight:700; background:#dc2626; color:#fff; padding:2px 8px; border-radius:4px; letter-spacing:.3px; }
        .wp-icon-btn {
          width:32px; height:32px; border-radius:6px;
          border:1px solid rgba(255,255,255,.15);
          background:rgba(255,255,255,.07); color:#ddd;
          cursor:pointer; display:flex; align-items:center; justify-content:center;
          transition:all .15s; flex-shrink:0;
        }
        .wp-icon-btn:hover:not(:disabled) { background:rgba(255,255,255,.16); color:#fff; }
        .wp-icon-btn:disabled { opacity:.3; cursor:not-allowed; }
        .wp-zoom-pct {
          min-width:52px; text-align:center; font-size:12px; color:#ddd;
          background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.14);
          border-radius:6px; padding:5px 8px; cursor:pointer; font-weight:600;
          font-variant-numeric:tabular-nums;
        }
        .wp-zoom-pct:hover { background:rgba(255,255,255,.14); }
        .wp-slider { width:100px; cursor:pointer; accent-color:${cfg.primary}; }
        .wp-page-nav {
          display:flex; align-items:center; gap:6px;
          background:rgba(255,255,255,.08); border-radius:6px; padding:4px 8px;
        }
        .wp-page-nav span { color:#ddd; font-size:12px; }
        .wp-btn {
          display:inline-flex; align-items:center; gap:6px;
          padding:7px 14px; border-radius:7px; font-size:12px; font-weight:600;
          background:rgba(255,255,255,.09); border:1px solid rgba(255,255,255,.18);
          color:#e0e0e0; cursor:pointer; transition:all .15s;
        }
        .wp-btn:hover { background:rgba(255,255,255,.16); color:#fff; }
        .wp-btn-dl {
          display:inline-flex; align-items:center; gap:6px;
          padding:7px 14px; border-radius:7px; font-size:12px; font-weight:700;
          background:${cfg.primary}; border:none; color:#fff; cursor:pointer;
          transition:opacity .15s;
        }
        .wp-btn-dl:hover { opacity:.85; }
        #wp-ruler {
          height:24px; background:#e8e8e8; border-bottom:1px solid #bbb;
          flex-shrink:0; overflow:hidden; position:relative;
        }
        .wp-ruler-track {
          position:absolute; left:50%; transform:translateX(-50%);
          width:210mm; height:100%; display:flex;
        }
        .wp-ruler-mark { flex:1; position:relative; border-left:1px solid #bbb; }
        .wp-ruler-mark:first-child { border-left:none; }
        .wp-ruler-num { position:absolute; top:10px; left:2px; font-size:9px; color:#666; user-select:none; }
        #wp-canvas {
          flex:1; overflow-y:auto; overflow-x:auto;
          background:#525252; padding:0;
          display:flex; flex-direction:column; align-items:center;
        }
        #wp-canvas::-webkit-scrollbar { width:10px; height:10px; }
        #wp-canvas::-webkit-scrollbar-track { background:#3a3a3a; }
        #wp-canvas::-webkit-scrollbar-thumb { background:#666; border-radius:5px; }
        #wp-canvas::-webkit-scrollbar-thumb:hover { background:#888; }
        #wp-pdf-embed {
          width:100%; height:100%; border:none; display:block;
          flex:1;
        }
        #wp-status {
          height:26px; background:#2d2d2d; border-top:1px solid #3d3d3d;
          display:flex; align-items:center; justify-content:space-between;
          padding:0 16px; font-size:11px; color:rgba(255,255,255,.4); flex-shrink:0;
        }
        .wp-state {
          display:flex; flex-direction:column; align-items:center;
          justify-content:center; padding-top:100px; text-align:center; width:100%;
        }
        @keyframes wp-spin { to { transform:rotate(360deg); } }
        .wp-spin { animation:wp-spin 1s linear infinite; }
      `}</style>

      <div id="word-preview-root">

        {/* ── Toolbar ── */}
        <div id="wp-toolbar">
          <div className="wp-left">
            <FileText size={16} color={cfg.primary}/>
            <span className="wp-prodi">Print Layout — {prodi}</span>
            {status === "ok" && <span className="wp-badge">PDF</span>}
          </div>

          <div className="wp-center">
            <button className="wp-icon-btn" onClick={zoomOut}  title="Perkecil"><ZoomOut  size={14}/></button>
            <button className="wp-zoom-pct" onClick={zoomReset} title="Reset">{zoom}%</button>
            <button className="wp-icon-btn" onClick={zoomIn}   title="Perbesar"><ZoomIn   size={14}/></button>
            <input className="wp-slider" type="range" min={40} max={200} step={5}
              value={zoom} onChange={e => setZoom(Number(e.target.value))}/>
          </div>

          <div className="wp-right">
            <button className="wp-btn" onClick={download}><Download size={14}/> Download .docx</button>
            <button className="wp-icon-btn" onClick={onClose} title="Tutup (Esc)" style={{ marginLeft:4 }}>
              <X size={16}/>
            </button>
          </div>
        </div>

        {/* ── Ruler ── */}
        {status === "ok" && (
          <div id="wp-ruler">
            <div className="wp-ruler-track">
              {Array.from({ length: 21 }, (_, i) => (
                <div key={i} className="wp-ruler-mark">
                  {i % 2 === 0 && i > 0 && <span className="wp-ruler-num">{i}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Canvas ── */}
        <div id="wp-canvas" ref={scrollRef}>

          {/* Loading */}
          {status === "loading" && (
            <div className="wp-state">
              <Loader2 size={40} className="wp-spin" color={cfg.primary}/>
              <p style={{ color:"#e8c99a", marginTop:18, fontSize:15, fontWeight:500 }}>
                Mengkonversi ke PDF…
              </p>
              <p style={{ color:"rgba(232,201,154,.5)", fontSize:13, marginTop:6 }}>
                Memproses template {prodi}
              </p>
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <div className="wp-state">
              <AlertCircle size={44} color="#fca5a5"/>
              <p style={{ color:"#fca5a5", fontWeight:700, marginTop:16, fontSize:16 }}>
                Gagal memuat template
              </p>
              <p style={{ color:"rgba(252,165,165,.7)", fontSize:13, marginTop:10, maxWidth:400, textAlign:"center", lineHeight:1.5 }}>
                {errMsg}
              </p>
              <p style={{ color:"rgba(255,255,255,.2)", fontSize:11, marginTop:8 }}>
                Pastikan LibreOffice / Microsoft Word terinstall di server
              </p>
            </div>
          )}

          {/* PDF embed — native browser PDF viewer */}
          {status === "ok" && blobUrl && (
            <embed
              id="wp-pdf-embed"
              ref={embedRef}
              src={`${blobUrl}#toolbar=1&navpanes=0&view=Fit&zoom=75`}
              type="application/pdf"
              style={{
                width:"100%", height:"100%",
                border:"none", display:"block",
                transform: zoom !== 100 ? `scale(${zoom/100})` : undefined,
                transformOrigin: "top center",
              }}
            />
          )}
        </div>

        {/* ── Status bar ── */}
        {status === "ok" && (
          <div id="wp-status">
            <span>Template {prodi} — PDF siap</span>
            <span>Zoom {zoom}% &nbsp;·&nbsp; Gunakan toolbar PDF untuk navigasi halaman &nbsp;·&nbsp; Ctrl+Scroll untuk zoom</span>
          </div>
        )}
      </div>
    </>
  );
}