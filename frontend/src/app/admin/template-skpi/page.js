"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Eye, X, Upload, CheckCircle2, AlertCircle,
  ChevronDown, Search, Loader2, BookOpen, FileText,
  Trash2, Download, Edit3, Plus, Save, RotateCcw,
  GraduationCap, Info, ChevronUp,
  Shield, Wrench, Star,
} from "lucide-react";
import styles from "./page.module.css";
import { PRODI_LIST, getProdiTemplate } from "@/lib/prodi-templates";

const API    = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const toSlug = (s) => s.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");

/* ─────────────────────────────────────────
   PRODI CONFIG
───────────────────────────────────────── */
const PRODI_CFG = {
  "Teknologi Informasi":           { primary:"#ff7f00", border:"#ffaa33", gradient:"linear-gradient(135deg,#ff7f00,#e06000)", label:"TI"   },
  "Sistem Informasi":              { primary:"#3d1111", border:"#8a4444", gradient:"linear-gradient(135deg,#3d1111,#7a3333)", label:"SI"   },
  "Manajemen":                     { primary:"#0077aa", border:"#33aadd", gradient:"linear-gradient(135deg,#0077aa,#005588)", label:"MNJ"  },
  "Kewirausahaan":                 { primary:"#cc2200", border:"#ff6644", gradient:"linear-gradient(135deg,#cc2200,#992200)", label:"KWU"  },
  "Pendidikan Guru Sekolah Dasar": { primary:"#7a0087", border:"#bb44cc", gradient:"linear-gradient(135deg,#7a0087,#550066)", label:"PGSD" },
  "Agroekoteknologi":              { primary:"#008b80", border:"#33ccbb", gradient:"linear-gradient(135deg,#008b80,#006655)", label:"AGRO" },
};
const getPC = (n) => PRODI_CFG[n] || { primary:"#765439", border:"#c8945a", gradient:"linear-gradient(135deg,#765439,#3d200a)", label:"?" };

const SECTIONS = [
  { key:"sikap",               label:"Sikap",              labelEn:"Proposition of Attitude", Icon: Shield   },
  { key:"pengetahuan",         label:"Pengetahuan",         labelEn:"Knowledge",               Icon: BookOpen },
  { key:"keterampilan_umum",   label:"Keterampilan Umum",   labelEn:"General Competence",      Icon: Wrench   },
  { key:"keterampilan_khusus", label:"Keterampilan Khusus", labelEn:"Specific Competences",    Icon: Star     },
];

/* ─────────────────────────────────────────
   CPL OVERRIDE (localStorage)
───────────────────────────────────────── */
const storKey = (p) => `cpl_override_${toSlug(p)}`;
function loadOverride(p)   { try { const r=localStorage.getItem(storKey(p)); return r?JSON.parse(r):null; } catch{return null;} }
function saveOverride(p,d) { localStorage.setItem(storKey(p),JSON.stringify(d)); localStorage.setItem(`${storKey(p)}_updated`,new Date().toISOString()); }
function clearOverride(p)  { localStorage.removeItem(storKey(p)); localStorage.removeItem(`${storKey(p)}_updated`); }
function getEffective(p)   { const base=getProdiTemplate(p); if(!base) return null; const ov=loadOverride(p); return ov?{...base,...ov}:{...base}; }

/* ─────────────────────────────────────────
   TOAST
───────────────────────────────────────── */
function Toast({ msg, onClose }) {
  useEffect(() => { if(!msg) return; const t=setTimeout(onClose,4000); return()=>clearTimeout(t); }, [msg,onClose]);
  if(!msg) return null;
  const ok = msg.type==="success";
  return (
    <div className={`${styles.toast} ${ok?styles.toastSuccess:styles.toastError}`}>
      {ok?<CheckCircle2 size={15}/>:<AlertCircle size={15}/>}
      <span>{msg.text}</span>
      <button onClick={onClose}><X size={13}/></button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PREVIEW MODAL — PDF langsung dari backend
   Backend: LibreOffice convert .docx → .pdf → serve inline
   Frontend: <embed> PDF — tampilan 100% sama dengan file Word
═══════════════════════════════════════════════════════════ */
function PreviewModal({ prodi, onClose }) {
  const slug      = toSlug(prodi);
  const pdfUrl    = `${API}/api/template-skpi/preview/${slug}`;
  const downloadUrl = `${API}/uploads/templates/${slug}.docx`;
  const [status, setStatus] = useState("loading"); // loading | ok | error
  const [errMsg, setErrMsg] = useState("");

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

  /* Cek apakah PDF tersedia */
  useEffect(() => {
    setStatus("loading");
    fetch(pdfUrl, { credentials: "include", method: "HEAD" })
      .then(r => {
        if (r.ok) setStatus("ok");
        else r.json().then(j => setErrMsg(j.error || `Error ${r.status}`)).catch(()=>setErrMsg(`Error ${r.status}`)).finally(()=>setStatus("error"));
      })
      .catch(() => { setErrMsg("Tidak dapat terhubung ke server."); setStatus("error"); });
  }, [pdfUrl]);

  return (
    <>
      <style>{`
        #pdf-preview-root {
          position: fixed; inset: 0; z-index: 9999;
          display: flex; flex-direction: column;
          background: #404040;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }

        /* Toolbar */
        #pdf-toolbar {
          height: 44px; flex-shrink: 0;
          background: #323232;
          border-bottom: 1px solid #252525;
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 0 16px; gap: 12px;
        }
        .pdf-tl { display:flex; align-items:center; gap:10px; flex:1; min-width:0; }
        .pdf-tr { display:flex; align-items:center; gap:8px; }
        .pdf-title {
          font-size: 13px; font-weight: 700; color: #f0dfc0;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .pdf-badge {
          font-size: 10px; font-weight: 700;
          background: #dc2626; color: #fff;
          padding: 2px 8px; border-radius: 4px; letter-spacing: .3px;
        }
        .pdf-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 13px; border-radius: 7px; font-size: 12px; font-weight: 700;
          cursor: pointer; border: none; transition: opacity .15s;
        }
        .pdf-btn:hover { opacity: .85; }
        .pdf-btn-dl   { background: #d97706; color: #fff; text-decoration: none; }
        .pdf-btn-close {
          width: 30px; height: 30px; border-radius: 6px;
          border: 1px solid rgba(255,255,255,.15);
          background: rgba(255,255,255,.08); color: #ccc;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: background .15s;
        }
        .pdf-btn-close:hover { background: rgba(255,255,255,.18); }

        /* PDF embed area */
        #pdf-body {
          flex: 1; overflow: hidden; position: relative;
          background: #525252;
        }
        #pdf-embed {
          width: 100%; height: 100%; border: none; display: block;
        }

        /* Loading / Error overlay */
        #pdf-state {
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 14px; text-align: center;
          background: #525252;
        }
        @keyframes pdf-spin { to { transform: rotate(360deg); } }
        .pdf-spin { animation: pdf-spin 1s linear infinite; }

        /* Status bar */
        #pdf-status {
          height: 22px; flex-shrink: 0;
          background: #2a2a2a; border-top: 1px solid #1e1e1e;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 14px; font-size: 11px; color: rgba(255,255,255,.3);
        }
      `}</style>

      <div id="pdf-preview-root">

        {/* Toolbar */}
        <div id="pdf-toolbar">
          <div className="pdf-tl">
            <FileText size={15} color="#f0dfc0"/>
            <span className="pdf-title">Preview Template SKPI — {prodi}</span>
            {status === "ok" && <span className="pdf-badge">PDF</span>}
          </div>
          <div className="pdf-tr">
            <a className="pdf-btn pdf-btn-dl" href={downloadUrl} download={`Template_SKPI_${prodi}.docx`}>
              <Download size={13}/> Download .docx
            </a>
            <button className="pdf-btn-close" onClick={onClose} title="Tutup (Esc)">
              <X size={15}/>
            </button>
          </div>
        </div>

        {/* Body */}
        <div id="pdf-body">

          {/* Loading */}
          {status === "loading" && (
            <div id="pdf-state">
              <Loader2 size={38} className="pdf-spin" color="#e8c99a"/>
              <p style={{ color:"#e8c99a", fontSize:14, margin:0 }}>
                Mengkonversi ke PDF…
              </p>
              <p style={{ color:"rgba(232,201,154,.45)", fontSize:12, margin:0 }}>
                LibreOffice sedang memproses {prodi}
              </p>
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <div id="pdf-state">
              <AlertCircle size={42} color="#fca5a5"/>
              <p style={{ color:"#fca5a5", fontWeight:700, fontSize:15, margin:0 }}>
                Gagal memuat PDF
              </p>
              <p style={{ color:"rgba(252,165,165,.65)", fontSize:13, margin:0, maxWidth:400 }}>
                {errMsg}
              </p>
              <p style={{ color:"rgba(255,255,255,.25)", fontSize:11, margin:0 }}>
                Pastikan LibreOffice terinstall di server
              </p>
            </div>
          )}

          {/* PDF embed — browser native PDF viewer */}
          {status === "ok" && (
            <embed
              id="pdf-embed"
              src={`${pdfUrl}#toolbar=1&navpanes=0&view=FitH`}
              type="application/pdf"
            />
          )}
        </div>

        {/* Status bar */}
        <div id="pdf-status">
          <span>
            {status === "ok"   && `Template ${prodi} — PDF siap`}
            {status === "loading" && "Mengkonversi dokumen…"}
            {status === "error"   && "Gagal memuat PDF"}
          </span>
          <span>{status === "ok" && "Gunakan toolbar PDF untuk zoom & cetak"}</span>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────
   UPLOAD ZONE — Upload ke Backend → Auto PDF
───────────────────────────────────────── */
function UploadZone({ prodi, onSuccess, onCancel }) {
  const [phase, setPhase] = useState("idle");
  const [msg,   setMsg]   = useState("");
  const [drag,  setDrag]  = useState(false);
  const inputRef = useRef();
  const cfg = getPC(prodi);

  const handleFile = async (file) => {
    if (!file?.name.endsWith(".docx")) { setPhase("error"); setMsg("Hanya file .docx yang diterima."); return; }
    if (file.size > 20*1024*1024)      { setPhase("error"); setMsg("Ukuran maksimal 20 MB.");           return; }

    setPhase("uploading"); setMsg("Mengupload dan mengkonversi ke PDF…");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("nama_prodi", prodi);

      const res  = await fetch(`${API}/api/template-skpi/upload`, { method:"POST", credentials:"include", body:form });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Upload gagal.");

      const pdfKb = json.pdf_size ? ` — PDF ${(json.pdf_size/1024).toFixed(0)} KB` : "";
      setPhase("done");
      setMsg(`Berhasil! .docx tersimpan${pdfKb}`);
      setTimeout(() => onSuccess(json), 800);
    } catch(e) {
      setPhase("error");
      setMsg(e.message);
    }
  };

  return (
    <div className={styles.uploadWrap}>
      <div className={styles.uploadHeader}>
        <span style={{ fontWeight:700, color:cfg.primary, fontSize:13 }}>
          <Upload size={13} style={{ verticalAlign:"middle", marginRight:5 }}/>
          Upload Template — {prodi}
        </span>
        <button className={styles.btnGhost} onClick={onCancel}><X size={13}/> Batal</button>
      </div>

      {/* Flow indicator */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px 16px 4px", fontSize:11.5, color:"#9e7b5e" }}>
        {[
          ["1","Upload .docx"],
          ["2","LibreOffice convert"],
          ["3","PDF siap preview"],
        ].map(([step, label], i, arr) => (
          <span key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ background:`${cfg.primary}14`, color:cfg.primary, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700 }}>
              {step}. {label}
            </span>
            {i < arr.length-1 && <span style={{ color:"#c8a888" }}>→</span>}
          </span>
        ))}
      </div>

      {phase !== "done" && (
        <div
          className={`${styles.dropZone} ${drag ? styles.dzDrag : ""}`}
          style={{ borderColor: drag ? cfg.primary : undefined }}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => phase !== "uploading" && inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" accept=".docx" hidden onChange={e => handleFile(e.target.files[0])}/>
          <div className={styles.dzContent}>
            {phase === "uploading" ? (
              <>
                <Loader2 size={26} className={styles.spin} style={{ color:cfg.primary }}/>
                <p>Mengupload &amp; mengkonversi ke PDF…</p>
                <small>Proses ini memerlukan beberapa detik</small>
              </>
            ) : (
              <>
                <Upload size={26} style={{ color:"#b09880" }}/>
                <p>Seret file <strong>.docx</strong> ke sini atau klik untuk browse</p>
                <small>Maksimal 20 MB · Akan dikonversi ke PDF oleh LibreOffice di server</small>
              </>
            )}
          </div>
        </div>
      )}

      {phase !== "idle" && phase !== "uploading" && (
        <div className={`${styles.uploadMsg} ${phase==="done"?styles.msgOk:styles.msgErr}`}>
          {phase === "done" ? <CheckCircle2 size={13}/> : <AlertCircle size={13}/>}
          <span>{msg}</span>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   EDIT CPL MODAL
───────────────────────────────────────── */
function EditCplModal({ item, sectionLabel, prodiColor, onSave, onClose }) {
  const [textId, setTextId] = useState(item?.id || "");
  const [textEn, setTextEn] = useState(item?.en || "");
  useEffect(() => {
    const fn = e => { if(e.key==="Escape") onClose(); };
    window.addEventListener("keydown",fn); return()=>window.removeEventListener("keydown",fn);
  }, [onClose]);
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} style={{ maxWidth:620 }} onClick={e=>e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalHeaderIcon} style={{ background:`${prodiColor}20`,color:prodiColor }}><Edit3 size={15}/></div>
            <div><h3 className={styles.modalTitle}>{item?"Edit Butir CPL":"Tambah Butir CPL"}</h3><p className={styles.modalSub}>{sectionLabel}</p></div>
          </div>
          <button className={styles.modalCloseBtn} onClick={onClose}><X size={17}/></button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.cplEditGroup}>
            <label className={styles.cplEditLabel}>
              <span className={styles.langBadge} style={{ background:"#fef3c7",color:"#92400e" }}>ID Indonesia</span>
              Teks Bahasa Indonesia <span className={styles.req}>*</span>
            </label>
            <textarea className={styles.cplTextarea} rows={4} value={textId}
              onChange={e=>setTextId(e.target.value)} placeholder="Tulis butir CPL dalam Bahasa Indonesia…"
              style={{ borderColor:textId?`${prodiColor}60`:undefined }}/>
            <span className={styles.charCount}>{textId.length} karakter</span>
          </div>
          <div className={styles.cplEditGroup}>
            <label className={styles.cplEditLabel}>
              <span className={styles.langBadge} style={{ background:"#dbeafe",color:"#1d4ed8" }}>EN English</span>
              English Text <span className={styles.optBadge}>opsional</span>
            </label>
            <textarea className={styles.cplTextarea} rows={4} value={textEn}
              onChange={e=>setTextEn(e.target.value)} placeholder="Write CPL item in English…"
              style={{ borderColor:textEn?`${prodiColor}60`:undefined }}/>
            <span className={styles.charCount}>{textEn.length} karakter</span>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.btnGhost} onClick={onClose}>Batal</button>
          <button className={styles.btnSave} style={{ background:prodiColor }}
            onClick={() => { if(textId.trim()) onSave({id:textId.trim(),en:textEn.trim()}); }} disabled={!textId.trim()}>
            <Save size={14}/> {item?"Simpan Perubahan":"Tambah Butir"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   CONFIRM DELETE MODAL
───────────────────────────────────────── */
function ConfirmDeleteModal({ item, index, onConfirm, onClose }) {
  useEffect(() => {
    const fn = e => { if(e.key==="Escape") onClose(); };
    window.addEventListener("keydown",fn); return()=>window.removeEventListener("keydown",fn);
  }, [onClose]);
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} style={{ maxWidth:420 }} onClick={e=>e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalHeaderIcon} style={{ background:"#fee2e2",color:"#dc2626" }}><Trash2 size={15}/></div>
            <div><h3 className={styles.modalTitle}>Hapus Butir CPL?</h3><p className={styles.modalSub}>Tidak dapat dibatalkan</p></div>
          </div>
          <button className={styles.modalCloseBtn} onClick={onClose}><X size={17}/></button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.confirmBox}>
            <p style={{ fontSize:13,color:"#3d2006",margin:0 }}>Hapus butir no. <strong>{index+1}</strong>?</p>
            <p style={{ fontSize:12,color:"#9e7b5e",margin:"6px 0 0",lineHeight:1.5 }}>
              {item?.id?.slice(0,100)}{item?.id?.length>100?"…":""}
            </p>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.btnGhost} onClick={onClose}>Batal</button>
          <button className={`${styles.btnSave} ${styles.btnDanger}`} onClick={onConfirm}><Trash2 size={14}/> Hapus</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SECTION CPL (accordion)
───────────────────────────────────────── */
function CplSection({ sectionKey, label, labelEn, Icon, items, prodiColor, searchQ, isOpen, onToggle, onItemsChange }) {
  const [editTarget, setEditTarget] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const filtered = searchQ
    ? items.filter(s => s.id.toLowerCase().includes(searchQ.toLowerCase()) || s.en.toLowerCase().includes(searchQ.toLowerCase()))
    : items;

  const handleSaveEdit = (newItem) => {
    const upd = [...items];
    if (editTarget==="new") upd.push(newItem); else upd[editTarget.index]=newItem;
    onItemsChange(upd); setEditTarget(null);
  };
  const handleDelete = () => { onItemsChange(items.filter((_,i)=>i!==confirmDel)); setConfirmDel(null); };
  const move = (idx, dir) => {
    const upd=[...items], to=idx+dir;
    if(to<0||to>=upd.length) return;
    [upd[idx],upd[to]]=[upd[to],upd[idx]]; onItemsChange(upd);
  };

  return (
    <>
      <div className={`${styles.accordion} ${isOpen?styles.accordionOpen:""}`} style={{ borderLeft:`3px solid ${prodiColor}` }}>
        <button className={styles.accordionBtn} onClick={onToggle}>
          <div className={styles.accordionLeft}>
            <span className={styles.accIcon} style={{ color: isOpen ? prodiColor : "#9a7458" }}>
                <Icon size={15}/>
              </span>
            <div>
              <span className={styles.accordionTitle} style={{ color:isOpen?prodiColor:"#2c1a0e" }}>{label}</span>
              <span className={styles.accordionEN}> / <em>{labelEn}</em></span>
            </div>
          </div>
          <div className={styles.accordionRight}>
            <span className={styles.countBadge} style={{ background:`${prodiColor}16`,color:prodiColor }}>{items.length} butir</span>
            {isOpen ? <ChevronUp size={14} style={{ color:prodiColor }}/> : <ChevronDown size={14} style={{ color:"#b09880" }}/>}
          </div>
        </button>
        {isOpen && (
          <div className={styles.accordionBody}>
            {filtered.length===0 && <p className={styles.noResult}>{searchQ?"Tidak ada hasil.":"Belum ada butir CPL."}</p>}
            {filtered.map(item => {
              const origIdx = items.indexOf(item);
              return (
                <div key={origIdx} className={styles.cplItem}>
                  <div className={styles.cplNo} style={{ background:`${prodiColor}14`,color:prodiColor }}>{origIdx+1}</div>
                  <div className={styles.cplContent}>
                    <p className={styles.cplId}>{item.id}</p>
                    {item.en && <p className={styles.cplEn}><em>{item.en}</em></p>}
                  </div>
                  <div className={styles.cplActions}>
                    <button className={styles.cplBtn} onClick={()=>move(origIdx,-1)} disabled={origIdx===0}><ChevronUp size={12}/></button>
                    <button className={styles.cplBtn} onClick={()=>move(origIdx,1)} disabled={origIdx===items.length-1}><ChevronDown size={12}/></button>
                    <button className={styles.cplBtnEdit} style={{ color:prodiColor }} onClick={()=>setEditTarget({index:origIdx,item})}><Edit3 size={13}/></button>
                    <button className={styles.cplBtnDel} onClick={()=>setConfirmDel(origIdx)}><Trash2 size={13}/></button>
                  </div>
                </div>
              );
            })}
            <button className={styles.addCplBtn} style={{ borderColor:`${prodiColor}50`,color:prodiColor }} onClick={()=>setEditTarget("new")}>
              <Plus size={13}/> Tambah Butir CPL
            </button>
          </div>
        )}
      </div>
      {editTarget!==null && <EditCplModal item={editTarget==="new"?null:editTarget.item} sectionLabel={`${label} — ${editTarget==="new"?"Butir Baru":`No. ${editTarget.index+1}`}`} prodiColor={prodiColor} onSave={handleSaveEdit} onClose={()=>setEditTarget(null)}/>}
      {confirmDel!==null && <ConfirmDeleteModal item={items[confirmDel]} index={confirmDel} onConfirm={handleDelete} onClose={()=>setConfirmDel(null)}/>}
    </>
  );
}

/* ─────────────────────────────────────────
   HALAMAN UTAMA
───────────────────────────────────────── */
export default function TemplateSkpiPage() {
  const [activeProdi,    setActiveProdi]    = useState(PRODI_LIST[0]);
  const [cplData,        setCplData]        = useState(null);
  const [isDirty,        setIsDirty]        = useState(false);
  const [openSecs,       setOpenSecs]       = useState({ sikap:true });
  const [search,         setSearch]         = useState("");
  const [showPreview,    setShowPreview]    = useState(false);
  const [showUpload,     setShowUpload]     = useState(false);
  const [templateStatus, setTemplateStatus] = useState({});
  const [toast,          setToast]          = useState(null);
  const [hasOverride,    setHasOverride]    = useState(false);
  const [saving,         setSaving]         = useState(false);

  const showToast = useCallback((text,type="success") => setToast({text,type}), []);

  useEffect(() => {
    // Langsung load dari localStorage/template (tidak ada flicker)
    setCplData(getEffective(activeProdi));
    setHasOverride(!!loadOverride(activeProdi));
    setIsDirty(false);
    setSearch(""); setOpenSecs({ sikap:true });
    setShowUpload(false); setShowPreview(false);

    // Sinkron dari backend jika ada data tersimpan
    const slug = toSlug(activeProdi);
    fetch(`${API}/api/template-skpi/cpl/${slug}`, { credentials:"include" })
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json?.cpl_data) {
          saveOverride(activeProdi, json.cpl_data);
          setCplData(getEffective(activeProdi));
          setHasOverride(true);
        }
      })
      .catch(() => {});
  }, [activeProdi]);

  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/template-skpi/list`, { credentials:"include" });
      if (!res.ok) return;
      const { list } = await res.json();
      const st = {};
      PRODI_LIST.forEach(p => { st[p] = false; });
      (list||[]).forEach(item => { st[item.nama_prodi] = item.has_pdf; });
      setTemplateStatus(st);
    } catch {}
  }, []);

  useEffect(() => {
    refreshStatus();
    document.title = "Template SKPI — Admin SKPI";
  }, [refreshStatus]);

  const handleItemsChange = useCallback((secKey, newItems) => {
    setCplData(prev => ({ ...prev, [secKey]: newItems }));
    setIsDirty(true);
  }, []);

  const handleSave = async () => {
    if (!cplData || !isDirty) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 350));
    const saveData = {
      sikap: cplData.sikap, pengetahuan: cplData.pengetahuan,
      keterampilan_umum: cplData.keterampilan_umum, keterampilan_khusus: cplData.keterampilan_khusus,
    };
    saveOverride(activeProdi, saveData);

    // Simpan ke backend + trigger regenerasi preview PDF
    fetch(`${API}/api/template-skpi/cpl/${toSlug(activeProdi)}`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(saveData),
    }).catch(() => {});

    setIsDirty(false); setHasOverride(true); setSaving(false);
    showToast(`CPL ${activeProdi} berhasil disimpan! Preview akan diperbarui.`);
  };

  const handleReset = () => {
    if (!confirm(`Reset CPL ${activeProdi} ke data awal?`)) return;
    clearOverride(activeProdi); setCplData({ ...getProdiTemplate(activeProdi) });
    setIsDirty(false); setHasOverride(false);
    showToast(`CPL ${activeProdi} direset.`);
  };

  const handleDiscard = () => {
    if (!confirm("Buang semua perubahan?")) return;
    setCplData(getEffective(activeProdi)); setIsDirty(false);
  };

  const handleUploadSuccess = (json) => {
    if (json?.extracted_cpl) {
      saveOverride(activeProdi, json.extracted_cpl);
      setHasOverride(true);
      setCplData({ ...getEffective(activeProdi) });
      setIsDirty(false);
    }
    refreshStatus(); setShowUpload(false);
    showToast(`Template ${activeProdi} berhasil diupload dan dikonversi ke PDF!`);
  };

  const handleDeleteTemplate = async () => {
    if (!confirm(`Hapus template ${activeProdi}?`)) return;
    try {
      await fetch(`${API}/api/template-skpi/${toSlug(activeProdi)}`, { method:"DELETE", credentials:"include" });
      refreshStatus(); setShowPreview(false);
      showToast(`Template ${activeProdi} dihapus.`);
    } catch { showToast("Gagal menghapus template.", "error"); }
  };

  const switchProdi = (p) => {
    if (isDirty && !confirm("Ada perubahan belum disimpan. Lanjut pindah?")) return;
    setActiveProdi(p);
  };

  const cfg      = getPC(activeProdi);
  const tpl      = getProdiTemplate(activeProdi);
  const uploaded = templateStatus[activeProdi];
  const totalCpl = cplData ? (cplData.sikap?.length||0)+(cplData.pengetahuan?.length||0)+(cplData.keterampilan_umum?.length||0)+(cplData.keterampilan_khusus?.length||0) : 0;
  const overrideDate = hasOverride ? new Date(localStorage.getItem(`${storKey(activeProdi)}_updated`)).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"}) : null;

  return (
    <div className={styles.page}>
      <Toast msg={toast} onClose={() => setToast(null)}/>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Template SKPI</h1>
          <p className={styles.sub}>Kelola CPL dan file template Word (.docx) per program studi</p>
        </div>
        <div className={styles.headerActions}>
          {isDirty && <span className={styles.dirtyBadge}><AlertCircle size={12}/> Belum disimpan</span>}
          {hasOverride && !isDirty && (
            <button className={styles.btnReset} onClick={handleReset}><RotateCcw size={13}/> Reset</button>
          )}
          <button className={styles.btnSave}
            style={{ background:isDirty?cfg.gradient:"#d5bfaf", cursor:isDirty?"pointer":"default" }}
            onClick={handleSave} disabled={!isDirty||saving}>
            {saving?<><Loader2 size={14} className={styles.spin}/> Menyimpan…</>:<><Save size={14}/> Simpan CPL</>}
          </button>
        </div>
      </div>

      <div className={styles.tabs}>
        {PRODI_LIST.map(p => {
          const c=getPC(p), t=getEffective(p);
          const tot=t?(t.sikap?.length||0)+(t.pengetahuan?.length||0)+(t.keterampilan_umum?.length||0)+(t.keterampilan_khusus?.length||0):0;
          const on=activeProdi===p, up=templateStatus[p], ov=!!loadOverride(p);
          return (
            <button key={p} className={`${styles.tab} ${on?styles.tabOn:""}`}
              style={on?{borderColor:c.primary,color:c.primary}:{}} onClick={()=>switchProdi(p)}>
              <span className={styles.tabDot} style={{ background:on?c.gradient:"#d4c0ac",color:"#fff",fontSize:c.label.length>3?8.5:10,fontWeight:800 }}>{c.label}</span>
              <span className={styles.tabName}>{p}</span>
              <div className={styles.tabBadges}>
                {up && <span className={styles.tabWord} title="PDF tersedia">PDF</span>}
                {ov && <span className={styles.tabEdited} title="CPL diubah">Edit</span>}
                <span className={styles.tabCount} style={on?{color:c.primary,background:`${c.primary}14`}:{}}>{tot}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className={styles.infoBar} style={{ borderLeft:`4px solid ${cfg.primary}` }}>
        <div className={styles.infoLeft}>
          {tpl && (
            <div className={styles.prodiInfo}>
              <GraduationCap size={14} style={{ color:cfg.primary,flexShrink:0 }}/>
              <strong>{tpl.nama}</strong>
              <span className={styles.infoDot}>·</span>
              <span>{tpl.gelar} / {tpl.gelar_en}</span>
              <span className={styles.infoDot}>·</span>
              <span className={styles.totalCpl} style={{ color:cfg.primary }}>{totalCpl} CPL</span>
              {hasOverride && (
                <><span className={styles.infoDot}>·</span>
                <span className={styles.overrideBadge} style={{ background:`${cfg.primary}14`,color:cfg.primary }}>
                  <Edit3 size={11}/> Diubah {overrideDate}
                </span></>
              )}
            </div>
          )}
          <div className={styles.wordInfo}>
            {uploaded
              ? <span className={styles.tagUploaded}><CheckCircle2 size={11}/> Template tersedia (PDF siap preview)</span>
              : <span className={styles.tagMissing}><AlertCircle size={11}/> Belum ada template — upload .docx untuk generate PDF</span>}
          </div>
        </div>
        <div className={styles.infoActions}>
          <button className={styles.btnOutlineSmall} style={{ borderColor:cfg.border,color:cfg.primary }} onClick={()=>setShowUpload(v=>!v)}>
            <Upload size={13}/> {uploaded?"Ganti File":"Upload .docx"}
          </button>
          <button className={styles.btnOutlineSmall} style={{ borderColor:cfg.border,color:cfg.primary }} onClick={()=>setShowPreview(true)} disabled={!uploaded}>
            <Eye size={13}/> Preview PDF
          </button>
          {uploaded && (
            <button className={styles.btnOutlineSmall} style={{ borderColor:"#fca5a5",color:"#dc2626" }} onClick={handleDeleteTemplate}>
              <Trash2 size={13}/> Hapus
            </button>
          )}
        </div>
      </div>

      {showUpload && <UploadZone prodi={activeProdi} onSuccess={handleUploadSuccess} onCancel={()=>setShowUpload(false)}/>}

      {cplData && (
        <div className={styles.cplToolbar}>
          <div className={styles.cplToolbarLeft}>
            <BookOpen size={14} style={{ color:cfg.primary,flexShrink:0 }}/>
            <span className={styles.cplToolbarTitle}>Capaian Pembelajaran Lulusan (CPL)</span>
            <span className={styles.cplToolbarSub}>— edit, tambah, ubah urutan</span>
          </div>
          <div className={styles.cplToolbarRight}>
            <button className={styles.btnMini} onClick={()=>setOpenSecs({sikap:true,pengetahuan:true,keterampilan_umum:true,keterampilan_khusus:true})}>Buka Semua</button>
            <button className={styles.btnMini} onClick={()=>setOpenSecs({})}>Tutup Semua</button>
            <div className={styles.searchBox}>
              <Search size={13} style={{ color:"#b09880",flexShrink:0 }}/>
              <input className={styles.searchInp} placeholder="Cari butir CPL…" value={search} onChange={e=>setSearch(e.target.value)}/>
              {search && <button className={styles.searchClr} onClick={()=>setSearch("")}><X size={12}/></button>}
            </div>
          </div>
        </div>
      )}

      {cplData && (
        <div className={styles.accordions}>
          {SECTIONS.map(sec => (
            <CplSection key={sec.key}
              sectionKey={sec.key} label={sec.label} labelEn={sec.labelEn} Icon={sec.Icon}
              items={cplData[sec.key]||[]} prodiColor={cfg.primary}
              searchQ={search} isOpen={!!openSecs[sec.key]}
              onToggle={()=>setOpenSecs(p=>({...p,[sec.key]:!p[sec.key]}))}
              onItemsChange={items=>handleItemsChange(sec.key,items)}
            />
          ))}
        </div>
      )}

      {tpl && (
        <div className={styles.prodiDetailCard}>
          <div className={styles.prodiDetailHeader} style={{ background:cfg.gradient }}><Info size={13}/> Informasi Program Studi</div>
          <div className={styles.prodiDetailGrid}>
            {[["Program Studi",tpl.nama],["Nama (English)",tpl.nama_en],["Gelar",`${tpl.gelar} / ${tpl.gelar_en}`],["Jenjang",tpl.jenjang],["Level KKNI",`Level ${tpl.level_kkni}`],["Lama Studi",tpl.lama_studi],["Konsentrasi",tpl.konsentrasi||"—"],["Akreditasi",tpl.akreditasi]].map(([lbl,val])=>(
              <div key={lbl} className={styles.prodiDetailItem}>
                <span className={styles.prodiDetailLabel}>{lbl}</span>
                <span className={styles.prodiDetailValue}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isDirty && (
        <div className={styles.stickyBar}>
          <div className={styles.stickyLeft}><AlertCircle size={14} style={{ color:"#d97706" }}/><span>Ada perubahan yang belum disimpan</span></div>
          <div className={styles.stickyRight}>
            <button className={styles.btnGhost} onClick={handleDiscard}>Buang</button>
            <button className={styles.btnSave} style={{ background:cfg.gradient }} onClick={handleSave} disabled={saving}>
              {saving?<><Loader2 size={14} className={styles.spin}/> Menyimpan…</>:<><Save size={14}/> Simpan CPL</>}
            </button>
          </div>
        </div>
      )}
      
      {showPreview && <PreviewModal prodi={activeProdi} onClose={()=>setShowPreview(false)}/>}
    </div>
  );
}