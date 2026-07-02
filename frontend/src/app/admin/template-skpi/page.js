"use client";

/*
   ADMIN TEMPLATE SKPI
   ===================
   Fitur: 
   - Edit CPL (Sikap, Pengetahuan, Keterampilan Umum, Keterampilan Khusus)
   - Edit Informasi Program Studi (bisa tambah baris, edit, hapus, urutkan)
   - Upload file .docx (otomatis dikonversi ke PDF)
   - Preview PDF langsung di browser
   - Semua data disimpan di localStorage (frontend-only)
*/

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Eye, X, Upload, CheckCircle2, AlertCircle,
  ChevronDown, Search, Loader2, BookOpen, FileText,
  Trash2, Download, Edit3, Plus, Save, RotateCcw,
  GraduationCap, Info, ChevronUp, Shield, Wrench, Star,
  Building2, PenTool, GripVertical,
} from "lucide-react";
import styles from "./page.module.css";
import { PRODI_LIST, getProdiTemplate } from "@/lib/prodi-templates";

// Konfigurasi API (sesuaikan dengan .env)
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Helper untuk membuat slug dari nama prodi (aman untuk localStorage)
const toSlug = (s) => s.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");

/* ============================================================
   KONFIGURASI WARNA PER PRODI (hanya untuk tampilan)
============================================================ */
const PRODI_CFG = {
  "Teknologi Informasi":           { primary:"#ff7f00", border:"#ffaa33", gradient:"linear-gradient(135deg,#ff7f00,#e06000)", label:"TI"   },
  "Sistem Informasi":              { primary:"#3d1111", border:"#8a4444", gradient:"linear-gradient(135deg,#3d1111,#7a3333)", label:"SI"   },
  "Manajemen":                     { primary:"#0077aa", border:"#33aadd", gradient:"linear-gradient(135deg,#0077aa,#005588)", label:"MNJ"  },
  "Kewirausahaan":                 { primary:"#cc2200", border:"#ff6644", gradient:"linear-gradient(135deg,#cc2200,#992200)", label:"KWU"  },
  "Pendidikan Guru Sekolah Dasar": { primary:"#7a0087", border:"#bb44cc", gradient:"linear-gradient(135deg,#7a0087,#550066)", label:"PGSD" },
  "Agroekoteknologi":              { primary:"#008b80", border:"#33ccbb", gradient:"linear-gradient(135deg,#008b80,#006655)", label:"AGRO" },
};
const getPC = (n) => PRODI_CFG[n] || { primary:"#765439", border:"#c8945a", gradient:"linear-gradient(135deg,#765439,#3d200a)", label:"?" };

/* ============================================================
   DAFTAR BAGIAN CPL (4 kelompok)
============================================================ */
const SECTIONS = [
  { key:"sikap",               label:"Sikap",              labelEn:"Proposition of Attitude", Icon: Shield   },
  { key:"pengetahuan",         label:"Pengetahuan",         labelEn:"Knowledge",               Icon: BookOpen },
  { key:"keterampilan_umum",   label:"Keterampilan Umum",   labelEn:"General Competence",      Icon: Wrench   },
  { key:"keterampilan_khusus", label:"Keterampilan Khusus", labelEn:"Specific Competences",    Icon: Star     },
];

/* ============================================================
   KEY UNTUK MENYIMPAN DI LOCALSTORAGE
============================================================ */
const cplStorageKey = (p) => `cpl_override_${toSlug(p)}`;
const prodiInfoStorageKey = (p) => `prodi_info_override_${toSlug(p)}`;
const cplUpdatedKey = (p) => `${cplStorageKey(p)}_updated`;
const prodiInfoUpdatedKey = (p) => `${prodiInfoStorageKey(p)}_updated`;

/* ============================================================
   DATA DEFAULT INFORMASI PRODI (berasal dari template)
============================================================ */
function getDefaultProdiInfo(prodiName) {
  const tpl = getProdiTemplate(prodiName);
  if (!tpl) return [];
  return [
    { label: "Program Studi", value: tpl.nama },
    { label: "Nama (English)", value: tpl.nama_en },
    { label: "Gelar", value: `${tpl.gelar} / ${tpl.gelar_en}` },
    { label: "Jenjang", value: tpl.jenjang },
    { label: "Level KKNI", value: `Level ${tpl.level_kkni}` },
    { label: "Lama Studi", value: tpl.lama_studi },
    // Konsentrasi: bisa diisi beberapa nilai dalam satu baris (pisah koma atau baris baru)
    { label: "Konsentrasi", value: tpl.konsentrasi || "—" },
    { label: "Akreditasi", value: tpl.akreditasi },
    { label: "SK Pendirian", value: tpl.sk_pendirian || "SK Menteri Pendidikan dan Kebudayaan Republik Indonesia No. 725/M/2020" },
  ];
}

/* ============================================================
   HELPER UNTUK MENYIMPAN / MEMBACA CPL
============================================================ */
function loadCplOverride(p)   { try { const r=localStorage.getItem(cplStorageKey(p)); return r?JSON.parse(r):null; } catch{return null;} }
function saveCplOverride(p,d) { localStorage.setItem(cplStorageKey(p),JSON.stringify(d)); localStorage.setItem(cplUpdatedKey(p),new Date().toISOString()); }
function clearCplOverride(p)  { localStorage.removeItem(cplStorageKey(p)); localStorage.removeItem(cplUpdatedKey(p)); }
function getEffectiveCpl(p)   { const base=getProdiTemplate(p); if(!base) return null; const ov=loadCplOverride(p); return ov?{...base,...ov}:{...base}; }

/* ============================================================
   HELPER UNTUK MENYIMPAN / MEMBACA INFO PRODI
============================================================ */
function loadProdiInfoOverride(p) { try { const r=localStorage.getItem(prodiInfoStorageKey(p)); return r?JSON.parse(r):null; } catch{return null;} }
function saveProdiInfoOverride(p,d) { localStorage.setItem(prodiInfoStorageKey(p),JSON.stringify(d)); localStorage.setItem(prodiInfoUpdatedKey(p),new Date().toISOString()); }
function clearProdiInfoOverride(p) { localStorage.removeItem(prodiInfoStorageKey(p)); localStorage.removeItem(prodiInfoUpdatedKey(p)); }
function getEffectiveProdiInfo(p) {
  const defaultInfo = getDefaultProdiInfo(p);
  const ov = loadProdiInfoOverride(p);
  return ov ? ov : defaultInfo;
}

/* ============================================================
   KOMPONEN TOAST (notifikasi)
============================================================ */
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

/* ============================================================
   PREVIEW MODAL – PDF langsung dari static URL (tanpa API)
============================================================ */
function PreviewModal({ prodi, onClose }) {
  const slug = toSlug(prodi);
  const [errMsg, setErrMsg] = useState("");

  // URL static PDF — langsung dari folder public, tanpa auth/konversi
  const pdfUrl = `${API}/uploads/templates/pdf/${slug}.pdf?t=${Date.now()}`;

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const download = () => {
    const a = Object.assign(document.createElement("a"), {
      href: `${API}/uploads/templates/${slug}.docx`,
      download: `Template_SKPI_${prodi}.docx`,
    });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const onIframeError = () => {
    setErrMsg("PDF tidak ditemukan. Upload template .docx terlebih dahulu.");
  };

  return (
    <div className={styles.previewOverlay}>
      {/* Toolbar */}
      <div className={styles.previewBar}>
        <div className={styles.previewBarLeft}>
          <FileText size={16}/>
          <span>Preview Template — <strong>{prodi}</strong></span>
          <span className={styles.previewBadge}>PDF</span>
        </div>
        <div className={styles.previewBarRight}>
          <button className={styles.btnDownloadDocx} onClick={download}>
            <Download size={14}/> Download .docx
          </button>
          <button className={styles.previewClose} onClick={onClose} title="Tutup (Esc)">
            <X size={18}/>
          </button>
        </div>
      </div>

      {/* PDF Viewer — iframe langsung, tanpa loading buatan */}
      <div style={{ flex:1, position:"relative", overflow:"hidden", background:"#525252" }}>
        {errMsg ? (
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center", gap:8, padding:32, textAlign:"center" }}>
            <AlertCircle size={44} style={{ color:"#fca5a5" }}/>
            <p style={{ color:"#fca5a5", fontWeight:700, fontSize:15, margin:"8px 0 0" }}>{errMsg}</p>
            <p style={{ color:"rgba(252,165,165,0.7)", fontSize:13, margin:0 }}>
              Upload .docx terlebih dahulu melalui tombol Upload
            </p>
          </div>
        ) : (
          <iframe
            src={pdfUrl}
            title={`Preview ${prodi}`}
            style={{ position:"absolute", inset:0, width:"100%", height:"100%", border:"none" }}
            onError={onIframeError}
          />
        )}
      </div>
    </div>
  );
}

/* ============================================================
   UPLOAD ZONE – Upload file .docx, otomatis dikonversi ke PDF
============================================================ */
function UploadZone({ prodi, onSuccess, onCancel }) {
  const [phase, setPhase] = useState("idle");
  const [msg, setMsg] = useState("");
  const [drag, setDrag] = useState(false);
  const inputRef = useRef();
  const cfg = getPC(prodi);

  const handleFile = async (file) => {
    if (!file?.name.endsWith(".docx")) { setPhase("error"); setMsg("Hanya file .docx yang diterima."); return; }
    if (file.size > 20*1024*1024)      { setPhase("error"); setMsg("Ukuran maksimal 20 MB."); return; }

    setPhase("uploading"); setMsg("Mengupload dan mengkonversi ke PDF…");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("nama_prodi", prodi);

      const res = await fetch(`${API}/api/template-skpi/upload`, { method:"POST", credentials:"include", body:form });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Upload gagal.");

      setPhase("done");
      setMsg(`Berhasil! .docx tersimpan${json.pdf_size ? ` — PDF ${(json.pdf_size/1024).toFixed(0)} KB` : ""}`);
      setTimeout(() => onSuccess(json), 800);
    } catch(e) {
      setPhase("error");
      setMsg(e.message);
    }
  };

  return (
    <div className={styles.uploadWrap}>
      <div className={styles.uploadHeader}>
        <span style={{ fontWeight:700, color:cfg.primary }}><Upload size={13}/> Upload Template — {prodi}</span>
        <button className={styles.btnGhost} onClick={onCancel}><X size={13}/> Batal</button>
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
                <small>Maksimal 20 MB · Akan dikonversi ke PDF</small>
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

/* ============================================================
   EDIT CPL MODAL – untuk menambah / mengedit satu butir CPL
============================================================ */
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
            <label className={styles.cplEditLabel}><span className={styles.langBadge} style={{ background:"#fef3c7",color:"#92400e" }}>ID Indonesia</span>Teks Bahasa Indonesia <span className={styles.req}>*</span></label>
            <textarea className={styles.cplTextarea} rows={4} value={textId} onChange={e=>setTextId(e.target.value)} placeholder="Tulis butir CPL dalam Bahasa Indonesia…"/>
            <span className={styles.charCount}>{textId.length} karakter</span>
          </div>
          <div className={styles.cplEditGroup}>
            <label className={styles.cplEditLabel}><span className={styles.langBadge} style={{ background:"#fde8cc",color:"#765439" }}>EN English</span>English Text <span className={styles.optBadge}>opsional</span></label>
            <textarea className={styles.cplTextarea} rows={4} value={textEn} onChange={e=>setTextEn(e.target.value)} placeholder="Write CPL item in English…"/>
            <span className={styles.charCount}>{textEn.length} karakter</span>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.btnGhost} onClick={onClose}>Batal</button>
          <button className={styles.btnSave} style={{ background:prodiColor }} onClick={() => { if(textId.trim()) onSave({id:textId.trim(),en:textEn.trim()}); }} disabled={!textId.trim()}>
            <Save size={14}/> {item?"Simpan Perubahan":"Tambah Butir"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   CONFIRM DELETE MODAL – konfirmasi hapus butir
============================================================ */
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
            <div><h3 className={styles.modalTitle}>Hapus Butir?</h3><p className={styles.modalSub}>Tidak dapat dibatalkan</p></div>
          </div>
          <button className={styles.modalCloseBtn} onClick={onClose}><X size={17}/></button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.confirmBox}>
            <p>Hapus butir no. <strong>{index+1}</strong>?</p>
            <p style={{ fontSize:12,color:"#9e7b5e",marginTop:6 }}>{item?.id || item?.label}</p>
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

/* ============================================================
   EDIT INFO PRODI MODAL – untuk menambah / mengedit satu baris info prodi
============================================================ */
function EditProdiInfoModal({ item, prodiColor, onSave, onClose }) {
  const [label, setLabel] = useState(item?.label || "");
  const [value, setValue] = useState(item?.value || "");
  useEffect(() => {
    const fn = e => { if(e.key==="Escape") onClose(); };
    window.addEventListener("keydown",fn); return()=>window.removeEventListener("keydown",fn);
  }, [onClose]);
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} style={{ maxWidth: 580 }} onClick={e=>e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalHeaderIcon} style={{ background:`${prodiColor}20`,color:prodiColor }}><PenTool size={15}/></div>
            <div><h3 className={styles.modalTitle}>{item ? "Edit Informasi Prodi" : "Tambah Informasi Baru"}</h3></div>
          </div>
          <button className={styles.modalCloseBtn} onClick={onClose}><X size={17}/></button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.cplEditGroup}>
            <label className={styles.cplEditLabel}>Label <span className={styles.req}>*</span></label>
            <input className={styles.modalInput} value={label} onChange={e=>setLabel(e.target.value)} placeholder="Contoh: Program Studi" />
          </div>
          <div className={styles.cplEditGroup}>
            <label className={styles.cplEditLabel}>Nilai / Value <span className={styles.req}>*</span></label>
            <textarea 
              className={styles.cplTextarea} 
              rows={3} 
              value={value} 
              onChange={e=>setValue(e.target.value)} 
              placeholder="Contoh: Teknologi Informasi / Information Technology. Untuk konsentrasi, pisahkan dengan koma atau baris baru: Jaringan, Website"
            />
            <small className={styles.hintText}>💡 Untuk konsentrasi, Anda bisa menulis beberapa nilai dalam satu baris (pisah koma) atau baris baru.</small>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.btnGhost} onClick={onClose}>Batal</button>
          <button className={styles.btnSave} style={{ background:prodiColor }} onClick={() => { if(label.trim()) onSave({label:label.trim(), value:value.trim()}); }} disabled={!label.trim()}>
            <Save size={14}/> {item ? "Simpan" : "Tambah"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PRODI INFO EDITOR – mengelola daftar info prodi (tambah, edit, hapus, urutkan)
============================================================ */
function ProdiInfoEditor({ items, prodiColor, onItemsChange }) {
  const [editTarget, setEditTarget] = useState(null); // { index, item } atau "new"
  const [confirmDel, setConfirmDel] = useState(null);

  const handleSaveEdit = (newItem) => {
    const upd = [...items];
    if (editTarget === "new") {
      upd.push(newItem);
    } else {
      upd[editTarget.index] = newItem;
    }
    onItemsChange(upd);
    setEditTarget(null);
  };
  const handleDelete = () => {
    const upd = items.filter((_, i) => i !== confirmDel);
    onItemsChange(upd);
    setConfirmDel(null);
  };
  const move = (idx, dir) => {
    const upd = [...items];
    const to = idx + dir;
    if (to < 0 || to >= upd.length) return;
    [upd[idx], upd[to]] = [upd[to], upd[idx]];
    onItemsChange(upd);
  };

  return (
    <div className={styles.prodiInfoCard}>
      <div className={styles.prodiInfoHeader}>
        <div className={styles.prodiInfoTitle}>
          <Building2 size={14} style={{ color: prodiColor }} />
          <span>Informasi Program Studi (dapat diedit)</span>
          <span className={styles.prodiInfoSub}>(tambah, edit, hapus, urutkan)</span>
        </div>
        <button className={styles.btnAddInfo} style={{ borderColor: prodiColor, color: prodiColor }} onClick={() => setEditTarget("new")}>
          <Plus size={13} /> Tambah Baris
        </button>
      </div>
      <div className={styles.prodiInfoList}>
        {items.length === 0 && <p className={styles.noResult}>Belum ada informasi. Klik "Tambah Baris".</p>}
        {items.map((item, idx) => (
          <div key={idx} className={styles.prodiInfoItem}>
            <div className={styles.prodiInfoItemDrag}>
              <GripVertical size={14} style={{ color: "#c0a890" }} />
            </div>
            <div className={styles.prodiInfoItemContent}>
              <div className={styles.prodiInfoLabel}>
                <input
                  type="text"
                  className={styles.prodiInfoInput}
                  value={item.label}
                  onChange={(e) => {
                    const upd = [...items];
                    upd[idx] = { ...item, label: e.target.value };
                    onItemsChange(upd);
                  }}
                  placeholder="Label"
                />
              </div>
              <div className={styles.prodiInfoValue}>
                <textarea
                  className={styles.prodiInfoTextarea}
                  rows={2}
                  value={item.value}
                  onChange={(e) => {
                    const upd = [...items];
                    upd[idx] = { ...item, value: e.target.value };
                    onItemsChange(upd);
                  }}
                  placeholder="Nilai / Value"
                />
              </div>
            </div>
            <div className={styles.prodiInfoActions}>
              <button className={styles.cplBtn} onClick={() => move(idx, -1)} disabled={idx === 0}><ChevronUp size={12} /></button>
              <button className={styles.cplBtn} onClick={() => move(idx, 1)} disabled={idx === items.length - 1}><ChevronDown size={12} /></button>
              <button className={styles.cplBtnEdit} style={{ color: prodiColor }} onClick={() => setEditTarget({ index: idx, item })}><Edit3 size={13} /></button>
              <button className={styles.cplBtnDel} onClick={() => setConfirmDel(idx)}><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </div>

      {editTarget !== null && (
        <EditProdiInfoModal
          item={editTarget === "new" ? null : editTarget.item}
          prodiColor={prodiColor}
          onSave={handleSaveEdit}
          onClose={() => setEditTarget(null)}
        />
      )}
      {confirmDel !== null && (
        <ConfirmDeleteModal
          item={{ id: items[confirmDel]?.label || "", en: items[confirmDel]?.value || "" }}
          index={confirmDel}
          onConfirm={handleDelete}
          onClose={() => setConfirmDel(null)}
        />
      )}
    </div>
  );
}

/* ============================================================
   CPL SECTION – accordion untuk tiap bagian CPL
============================================================ */
function CplSection({ sectionKey, label, labelEn, Icon, items, prodiColor, searchQ, isOpen, onToggle, onItemsChange }) {
  const [editTarget, setEditTarget] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const filtered = searchQ
    ? items.filter(s => s.id.toLowerCase().includes(searchQ.toLowerCase()) || s.en.toLowerCase().includes(searchQ.toLowerCase()))
    : items;

  const handleSaveEdit = (newItem) => {
    const upd = [...items];
    if (editTarget === "new") upd.push(newItem); else upd[editTarget.index] = newItem;
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
            <span className={styles.accIcon} style={{ color: isOpen ? prodiColor : "#9a7458" }}><Icon size={15}/></span>
            <div><span className={styles.accordionTitle} style={{ color:isOpen?prodiColor:"#2c1a0e" }}>{label}</span><span className={styles.accordionEN}> / <em>{labelEn}</em></span></div>
          </div>
          <div className={styles.accordionRight}>
            <span className={styles.countBadge} style={{ background:`${prodiColor}16`,color:prodiColor }}>{items.length} butir</span>
            {isOpen ? <ChevronUp size={14} style={{ color:prodiColor }}/> : <ChevronDown size={14} style={{ color:"#b09880" }}/>}
          </div>
        </button>
        {isOpen && (
          <div className={styles.accordionBody}>
            {filtered.length===0 && <p className={styles.noResult}>{searchQ?"Tidak ada hasil.":"Belum ada butir CPL."}</p>}
            {filtered.map((item, idx) => {
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

/* ============================================================
   HALAMAN UTAMA (TemplateSkpiPage)
============================================================ */
export default function TemplateSkpiPage() {
  const [activeProdi, setActiveProdi] = useState(PRODI_LIST[0]);
  const [cplData, setCplData] = useState(null);
  const [prodiInfoItems, setProdiInfoItems] = useState([]);
  const [isDirty, setIsDirty] = useState(false);
  const [openSecs, setOpenSecs] = useState({ sikap: true });
  const [search, setSearch] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [templateStatus, setTemplateStatus] = useState({});
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [hasCplOverride, setHasCplOverride] = useState(false);
  const [hasProdiInfoOverride, setHasProdiInfoOverride] = useState(false);

  const showToast = useCallback((text, type = "success") => setToast({ text, type }), []);

  // Load data ketika prodi berubah
  useEffect(() => {
    const newCpl = getEffectiveCpl(activeProdi);
    const newProdiInfo = getEffectiveProdiInfo(activeProdi);
    setCplData(newCpl);
    setProdiInfoItems(newProdiInfo);
    setHasCplOverride(!!loadCplOverride(activeProdi));
    setHasProdiInfoOverride(!!loadProdiInfoOverride(activeProdi));
    setIsDirty(false);
    setSearch("");
    setOpenSecs({ sikap: true });
    setShowUpload(false);
    setShowPreview(false);
  }, [activeProdi]);

  // Refresh status template dari backend
  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/template-skpi/list`, { credentials: "include" });
      if (!res.ok) return;
      const { list } = await res.json();
      const st = {};
      PRODI_LIST.forEach(p => { st[p] = false; });
      (list || []).forEach(item => { st[item.nama_prodi] = item.has_pdf; });
      setTemplateStatus(st);
    } catch {}
  }, []);

  useEffect(() => {
    refreshStatus();
    document.title = "Template SKPI — Admin SKPI";
  }, [refreshStatus]);

  // Handler perubahan CPL
  const handleCplItemsChange = useCallback((secKey, newItems) => {
    setCplData(prev => ({ ...prev, [secKey]: newItems }));
    setIsDirty(true);
  }, []);

  // Handler perubahan info prodi
  const handleProdiInfoItemsChange = useCallback((newItems) => {
    setProdiInfoItems(newItems);
    setIsDirty(true);
  }, []);

  // Simpan semua perubahan ke localStorage
  const handleSave = async () => {
    if (!cplData || !prodiInfoItems) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 350)); // jeda UX

    const saveCpl = {
      sikap: cplData.sikap, pengetahuan: cplData.pengetahuan,
      keterampilan_umum: cplData.keterampilan_umum, keterampilan_khusus: cplData.keterampilan_khusus,
    };
    saveCplOverride(activeProdi, saveCpl);
    saveProdiInfoOverride(activeProdi, prodiInfoItems);

    setIsDirty(false);
    setHasCplOverride(true);
    setHasProdiInfoOverride(true);
    setSaving(false);
    showToast(`Perubahan untuk ${activeProdi} berhasil disimpan!`);
  };

  // Reset ke data default
  const handleReset = () => {
    if (!confirm(`Reset semua data ${activeProdi} (CPL dan informasi prodi) ke default?`)) return;
    clearCplOverride(activeProdi);
    clearProdiInfoOverride(activeProdi);
    setCplData(getEffectiveCpl(activeProdi));
    setProdiInfoItems(getEffectiveProdiInfo(activeProdi));
    setHasCplOverride(false);
    setHasProdiInfoOverride(false);
    setIsDirty(false);
    showToast(`Data ${activeProdi} direset ke default.`);
  };

  // Buang perubahan lokal
  const handleDiscard = () => {
    if (!confirm("Buang semua perubahan?")) return;
    setCplData(getEffectiveCpl(activeProdi));
    setProdiInfoItems(getEffectiveProdiInfo(activeProdi));
    setIsDirty(false);
  };

  const handleUploadSuccess = (json) => {
    if (json?.extracted_cpl) {
      saveCplOverride(activeProdi, json.extracted_cpl);
      setHasCplOverride(true);
      setCplData({ ...getEffectiveCpl(activeProdi) });
      setIsDirty(false);
    }
    refreshStatus();
    setShowUpload(false);
    showToast(`Template ${activeProdi} berhasil diupload dan dikonversi ke PDF!`);
  };

  const handleDeleteTemplate = async () => {
    if (!confirm(`Hapus template Word/PDF untuk ${activeProdi}?`)) return;
    try {
      await fetch(`${API}/api/template-skpi/${toSlug(activeProdi)}`, { method: "DELETE", credentials: "include" });
      refreshStatus();
      setShowPreview(false);
      showToast(`Template ${activeProdi} dihapus.`);
    } catch {
      showToast("Gagal menghapus template.", "error");
    }
  };

  const switchProdi = (p) => {
    if (isDirty && !confirm("Ada perubahan belum disimpan. Lanjut pindah?")) return;
    setActiveProdi(p);
  };

  const cfg = getPC(activeProdi);
  const uploaded = templateStatus[activeProdi];
  const totalCpl = cplData ? (cplData.sikap?.length||0)+(cplData.pengetahuan?.length||0)+(cplData.keterampilan_umum?.length||0)+(cplData.keterampilan_khusus?.length||0) : 0;
  const cplDate = hasCplOverride ? new Date(localStorage.getItem(cplUpdatedKey(activeProdi))).toLocaleDateString("id-ID") : null;
  const infoDate = hasProdiInfoOverride ? new Date(localStorage.getItem(prodiInfoUpdatedKey(activeProdi))).toLocaleDateString("id-ID") : null;

  return (
    <div className={styles.page}>
      <Toast msg={toast} onClose={() => setToast(null)} />

      {/* HEADER dengan tombol simpan & reset */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Template SKPI</h1>
          <p className={styles.sub}>Kelola CPL, informasi prodi, dan file template Word (.docx)</p>
        </div>
        <div className={styles.headerActions}>
          {isDirty && <span className={styles.dirtyBadge}><AlertCircle size={12}/> Perubahan belum disimpan</span>}
          {(hasCplOverride || hasProdiInfoOverride) && !isDirty && (
            <button className={styles.btnReset} onClick={handleReset}><RotateCcw size={13}/> Reset ke Default</button>
          )}
          <button className={styles.btnSave}
            style={{ background:isDirty?cfg.gradient:"#d5bfaf", cursor:isDirty?"pointer":"default" }}
            onClick={handleSave} disabled={!isDirty||saving}>
            {saving?<><Loader2 size={14} className={styles.spin}/> Menyimpan…</>:<><Save size={14}/> Simpan Perubahan</>}
          </button>
        </div>
      </div>

      {/* TAB PILIH PRODI */}
      <div className={styles.tabs}>
        {PRODI_LIST.map(p => {
          const c = getPC(p);
          const on = activeProdi === p;
          const up = templateStatus[p];
          const ovCpl = !!loadCplOverride(p);
          const ovProdi = !!loadProdiInfoOverride(p);
          const tot = (()=>{ const t=getEffectiveCpl(p); return t?(t.sikap?.length||0)+(t.pengetahuan?.length||0)+(t.keterampilan_umum?.length||0)+(t.keterampilan_khusus?.length||0):0; })();
          return (
            <button key={p} className={`${styles.tab} ${on?styles.tabOn:""}`}
              style={on?{borderColor:c.primary,color:c.primary}:{}} onClick={()=>switchProdi(p)}>
              <span className={styles.tabDot} style={{ background:on?c.gradient:"#d4c0ac",color:"#fff" }}>{c.label}</span>
              <span className={styles.tabName}>{p}</span>
              <div className={styles.tabBadges}>
                {up && <span className={styles.tabWord} title="PDF tersedia">PDF</span>}
                {ovCpl && <span className={styles.tabEdited} title="CPL diubah">CPL</span>}
                {ovProdi && <span className={styles.tabEdited} title="Info prodi diubah">Info</span>}
                <span className={styles.tabCount} style={on?{color:c.primary,background:`${c.primary}14`}:{}}>{tot}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* INFO BAR (status template, info override) */}
      <div className={styles.infoBar} style={{ borderLeft:`4px solid ${cfg.primary}` }}>
        <div className={styles.infoLeft}>
          <div className={styles.prodiInfo}>
            <GraduationCap size={14} style={{ color:cfg.primary }}/>
            <strong>{activeProdi}</strong>
            <span className={styles.infoDot}>·</span>
            <span className={styles.totalCpl} style={{ color:cfg.primary }}>{totalCpl} CPL</span>
            {cplDate && <><span className={styles.infoDot}>·</span><span className={styles.overrideBadge} style={{ background:`${cfg.primary}14`,color:cfg.primary }}><Edit3 size={11}/> CPL diubah {cplDate}</span></>}
            {infoDate && <><span className={styles.infoDot}>·</span><span className={styles.overrideBadge} style={{ background:`${cfg.primary}14`,color:cfg.primary }}><Building2 size={11}/> Info diubah {infoDate}</span></>}
          </div>
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

      {/* FORM UPLOAD (jika tombol upload diklik) */}
      {showUpload && <UploadZone prodi={activeProdi} onSuccess={handleUploadSuccess} onCancel={()=>setShowUpload(false)}/>}

      {/* EDITOR INFO PRODI (di atas CPL) */}
      {prodiInfoItems && (
        <ProdiInfoEditor
          items={prodiInfoItems}
          prodiColor={cfg.primary}
          onItemsChange={handleProdiInfoItemsChange}
        />
      )}

      {/* TOOLBAR CPL (cari, buka/tutup semua) */}
      {cplData && (
        <div className={styles.cplToolbar}>
          <div className={styles.cplToolbarLeft}>
            <BookOpen size={14} style={{ color:cfg.primary }}/>
            <span className={styles.cplToolbarTitle}>Capaian Pembelajaran Lulusan (CPL)</span>
            <span className={styles.cplToolbarSub}>— edit, tambah, ubah urutan</span>
          </div>
          <div className={styles.cplToolbarRight}>
            <button className={styles.btnMini} onClick={()=>setOpenSecs({sikap:true,pengetahuan:true,keterampilan_umum:true,keterampilan_khusus:true})}>Buka Semua</button>
            <button className={styles.btnMini} onClick={()=>setOpenSecs({})}>Tutup Semua</button>
            <div className={styles.searchBox}>
              <Search size={13} style={{ color:"#b09880" }}/>
              <input className={styles.searchInp} placeholder="Cari butir CPL…" value={search} onChange={e=>setSearch(e.target.value)}/>
              {search && <button className={styles.searchClr} onClick={()=>setSearch("")}><X size={12}/></button>}
            </div>
          </div>
        </div>
      )}

      {/* ACCORDION CPL (4 bagian) */}
      {cplData && (
        <div className={styles.accordions}>
          {SECTIONS.map(sec => (
            <CplSection
              key={sec.key}
              sectionKey={sec.key}
              label={sec.label}
              labelEn={sec.labelEn}
              Icon={sec.Icon}
              items={cplData[sec.key] || []}
              prodiColor={cfg.primary}
              searchQ={search}
              isOpen={!!openSecs[sec.key]}
              onToggle={()=>setOpenSecs(p=>({...p,[sec.key]:!p[sec.key]}))}
              onItemsChange={items=>handleCplItemsChange(sec.key,items)}
            />
          ))}
        </div>
      )}

      {/* INFORMASI TAMBAHAN (ringkasan info prodi) */}
      {prodiInfoItems.length > 0 && (
        <div className={styles.prodiDetailCard}>
          <div className={styles.prodiDetailHeader} style={{ background:cfg.gradient }}><Info size={13}/> Informasi Program Studi (Ringkasan)</div>
          <div className={styles.prodiDetailGrid}>
            {prodiInfoItems.slice(0, 8).map((item, idx) => (
              <div key={idx} className={styles.prodiDetailItem}>
                <span className={styles.prodiDetailLabel}>{item.label}</span>
                <span className={styles.prodiDetailValue}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STICKY BAR (peringatan perubahan belum disimpan) */}
      {isDirty && (
        <div className={styles.stickyBar}>
          <div className={styles.stickyLeft}><AlertCircle size={14} style={{ color:"#d97706" }}/><span>Ada perubahan yang belum disimpan</span></div>
          <div className={styles.stickyRight}>
            <button className={styles.btnGhost} onClick={handleDiscard}>Buang</button>
            <button className={styles.btnSave} style={{ background:cfg.gradient }} onClick={handleSave} disabled={saving}>
              {saving?<><Loader2 size={14} className={styles.spin}/> Menyimpan…</>:<><Save size={14}/> Simpan Perubahan</>}
            </button>
          </div>
        </div>
      )}
      
      {/* MODAL PREVIEW PDF */}
      {showPreview && <PreviewModal prodi={activeProdi} onClose={()=>setShowPreview(false)}/>}
    </div>
  );
}