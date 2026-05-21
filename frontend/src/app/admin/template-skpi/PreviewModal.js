"use client";

import { useEffect, useState } from "react";
import { X, Download, Loader2, FileText, AlertCircle, Printer } from "lucide-react";

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

  const [status,  setStatus]  = useState("loading");
  const [errMsg,  setErrMsg]  = useState("");
  const [blobUrl, setBlobUrl] = useState("");

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

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

  const download = () => {
    const a = Object.assign(document.createElement("a"), {
      href: `${API}/uploads/templates/${slug}.docx`,
      download: `Template_SKPI_${prodi}.docx`,
    });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9999,
      display:"flex", flexDirection:"column",
      background:"#1e1e1e", fontFamily:"'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Toolbar */}
      <div style={{
        height:50, background:"#2d2d2d", borderBottom:"1px solid #3d3d3d",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 16px", gap:12, flexShrink:0, userSelect:"none",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, flex:1, minWidth:0 }}>
          <FileText size={16} color={cfg.primary}/>
          <span style={{ fontSize:13, fontWeight:600, color:"#f0dfc0",
            whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
            Template SKPI — {prodi}
          </span>
          {status === "ok" && (
            <span style={{ fontSize:10, fontWeight:700, background:"#dc2626",
              color:"#fff", padding:"2px 8px", borderRadius:4 }}>PDF</span>
          )}
          {status === "loading" && (
            <span style={{ display:"inline-flex", alignItems:"center", gap:5,
              fontSize:12, color:"rgba(255,255,255,0.45)" }}>
              <Loader2 size={12} style={{ animation:"spin 1s linear infinite" }}/> Memproses…
            </span>
          )}
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={download} title="Download .docx"
            style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"0 14px",
              height:32, borderRadius:6, border:"1px solid rgba(255,255,255,.18)",
              background:"rgba(255,255,255,.09)", color:"#ddd", cursor:"pointer",
              fontSize:12, fontWeight:600 }}>
            <Download size={14}/> Download .docx
          </button>
          <button onClick={onClose} title="Tutup (Esc)"
            style={{ width:32, height:32, borderRadius:6, border:"1px solid rgba(255,255,255,.15)",
              background:"rgba(255,255,255,.07)", color:"#ddd", cursor:"pointer",
              display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
            <X size={16}/>
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div style={{ flex:1, position:"relative", overflow:"hidden", background:"#525252" }}>
        {status === "loading" && (
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center", gap:12 }}>
            <Loader2 size={36} color={cfg.primary}
              style={{ animation:"spin 1s linear infinite" }}/>
            <p style={{ color:"#e8c99a", fontSize:15, fontWeight:500, margin:0 }}>
              Mengkonversi ke PDF…
            </p>
            <p style={{ color:"rgba(232,201,154,0.5)", fontSize:13, margin:0 }}>
              Memproses template {prodi}
            </p>
          </div>
        )}
        {status === "error" && (
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center", gap:8, padding:32, textAlign:"center" }}>
            <AlertCircle size={48} color="#fca5a5"/>
            <p style={{ color:"#fca5a5", fontWeight:700, fontSize:16, margin:"8px 0 0" }}>
              Gagal memuat template
            </p>
            <p style={{ color:"rgba(252,165,165,0.7)", fontSize:13, margin:0, maxWidth:400 }}>
              {errMsg}
            </p>
            <p style={{ color:"rgba(255,255,255,0.2)", fontSize:11, margin:0 }}>
              Pastikan LibreOffice / Microsoft Word terinstall di server
            </p>
          </div>
        )}
        {status === "ok" && blobUrl && (
          <embed
            src={`${blobUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
            type="application/pdf"
            style={{ position:"absolute", inset:0, width:"100%", height:"100%", border:"none" }}
          />
        )}
      </div>

      {/* Status bar */}
      {status === "ok" && (
        <div style={{
          height:26, background:"#2d2d2d", borderTop:"1px solid #3d3d3d",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"0 16px", fontSize:11, color:"rgba(255,255,255,0.35)", flexShrink:0,
        }}>
          <span>Template {prodi} — PDF siap</span>
          <span>Gunakan toolbar PDF untuk zoom</span>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
