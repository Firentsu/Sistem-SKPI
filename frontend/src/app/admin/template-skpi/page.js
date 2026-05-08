"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Eye, X, Upload, CheckCircle2, AlertCircle,
  ChevronDown, Search, Loader2, BookOpen, FileText,
  Trash2, Download, Edit3, Plus, Save, RotateCcw,
  GraduationCap, Info, ChevronUp, Check,
} from "lucide-react";
import styles from "./page.module.css";
import { PRODI_LIST, getProdiTemplate } from "@/lib/prodi-templates";
import * as mammoth from "mammoth";

/* ─────────────────────────────────────────
   KONFIGURASI WARNA PRODI
───────────────────────────────────────── */
const PRODI_CFG = {
  "Teknologi Informasi":           { primary: "#ff7f00", light: "#fff3e6", border: "#ffaa33", gradient: "linear-gradient(135deg,#ff7f00,#e06000)", label: "TI"   },
  "Sistem Informasi":              { primary: "#3d1111", light: "#f0ecec", border: "#8a4444", gradient: "linear-gradient(135deg,#3d1111,#7a3333)", label: "SI"   },
  "Manajemen":                     { primary: "#0077aa", light: "#e6f4fa", border: "#33aadd", gradient: "linear-gradient(135deg,#0077aa,#005588)", label: "MJ"   },
  "Kewirausahaan":                 { primary: "#cc2200", light: "#ffe8e0", border: "#ff6644", gradient: "linear-gradient(135deg,#cc2200,#992200)", label: "KW"   },
  "Pendidikan Guru Sekolah Dasar": { primary: "#7a0087", light: "#f5e6f8", border: "#bb44cc", gradient: "linear-gradient(135deg,#7a0087,#550066)", label: "PGSD" },
  "Agroekoteknologi":              { primary: "#008b80", light: "#e0f8f5", border: "#33ccbb", gradient: "linear-gradient(135deg,#008b80,#006655)", label: "AGR"  },
};
const getPC  = (nama) => PRODI_CFG[nama] || { primary: "#765439", light: "#fdf4ec", border: "#c8945a", gradient: "linear-gradient(135deg,#765439,#3d200a)", label: "?" };
const toSlug = (s) => s.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");

/* ─────────────────────────────────────────
   SECTION CONFIG
───────────────────────────────────────── */
const SECTIONS = [
  { key: "sikap",               label: "Sikap",               labelEn: "Proposition of Attitude", icon: "🧭" },
  { key: "pengetahuan",         label: "Pengetahuan",          labelEn: "Knowledge",               icon: "📚" },
  { key: "keterampilan_umum",   label: "Keterampilan Umum",    labelEn: "General Competence",      icon: "🛠️" },
  { key: "keterampilan_khusus", label: "Keterampilan Khusus",  labelEn: "Specific Competences",    icon: "⚙️" },
];

/* ─────────────────────────────────────────
   STORAGE HELPERS
───────────────────────────────────────── */
const storKey  = (p) => `cpl_override_${toSlug(p)}`;
const storKeyT = (p) => `cpl_override_${toSlug(p)}_updated`;

function loadOverride(p) {
  try { const r = localStorage.getItem(storKey(p)); return r ? JSON.parse(r) : null; }
  catch { return null; }
}
function saveOverride(p, data) {
  localStorage.setItem(storKey(p), JSON.stringify(data));
  localStorage.setItem(storKeyT(p), new Date().toISOString());
}
function clearOverride(p) {
  localStorage.removeItem(storKey(p));
  localStorage.removeItem(storKeyT(p));
}
function getEffective(p) {
  const base = getProdiTemplate(p);
  if (!base) return null;
  const ov = loadOverride(p);
  return ov ? { ...base, ...ov } : { ...base };
}

/* ─────────────────────────────────────────
   TOAST
───────────────────────────────────────── */
function Toast({ msg, onClose }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [msg, onClose]);
  if (!msg) return null;
  const ok = msg.type === "success";
  return (
    <div className={`${styles.toast} ${ok ? styles.toastSuccess : styles.toastError}`}>
      {ok ? <CheckCircle2 size={15}/> : <AlertCircle size={15}/>}
      <span>{msg.text}</span>
      <button onClick={onClose}><X size={13}/></button>
    </div>
  );
}

/* ─────────────────────────────────────────
   PREVIEW MODAL
───────────────────────────────────────── */
function PreviewModal({ prodi, onClose }) {
  const [loading, setLoading] = useState(true);
  const [html,    setHtml]    = useState("");
  const [err,     setErr]     = useState("");
  const cfg  = getPC(prodi);
  const slug = toSlug(prodi);

  useEffect(() => {
    (async () => {
      setLoading(true); setErr("");
      const b64 = localStorage.getItem(`template_${slug}`);
      if (!b64) { setErr("Belum ada file .docx untuk prodi ini."); setLoading(false); return; }
      try {
        const bytes = atob(b64.split(",")[1]);
        const ab = new ArrayBuffer(bytes.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < bytes.length; i++) ia[i] = bytes.charCodeAt(i);
        const result = await mammoth.convertToHtml({ arrayBuffer: ab });
        setHtml(`<style>body{font-family:'Times New Roman',serif;line-height:1.5;margin:0;padding:20px;font-size:13px}
          table{border-collapse:collapse;width:100%;margin:8px 0}td,th{border:1px solid #ccc;padding:6px 8px;vertical-align:top}
          img{max-width:100%;height:auto}p{margin:0 0 6px}</style>${result.value}`);
      } catch { setErr("Gagal memproses file. Pastikan .docx valid."); }
      finally { setLoading(false); }
    })();
  }, [slug]);

  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn); return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const download = () => {
    const b64 = localStorage.getItem(`template_${slug}`); if (!b64) return;
    const a = document.createElement("a"); a.href = b64;
    a.download = localStorage.getItem(`template_${slug}_name`) || `Template_SKPI_${prodi}.docx`; a.click();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} style={{ maxWidth: 980 }} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalHeaderIcon} style={{ background: cfg.gradient, color:"#fff" }}><FileText size={15}/></div>
            <div><h3 className={styles.modalTitle}>Preview Template SKPI</h3><p className={styles.modalSub}>{prodi}</p></div>
          </div>
          <button className={styles.modalCloseBtn} onClick={onClose}><X size={17}/></button>
        </div>
        <div className={styles.modalBody} style={{ padding: 0, background: "#f5f0eb" }}>
          {loading ? (
            <div className={styles.previewLoading}><Loader2 size={28} className={styles.spin} style={{ color: cfg.primary }}/><p>Memuat dokumen…</p></div>
          ) : err ? (
            <div className={styles.previewError}><AlertCircle size={32} style={{ color:"#dc2626" }}/><p>{err}</p></div>
          ) : (
            <iframe srcDoc={html} title="Preview" className={styles.previewFrame}/>
          )}
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.btnOutline} onClick={download}><Download size={14}/> Unduh .docx</button>
          <button className={styles.btnSave} style={{ background: cfg.gradient }} onClick={onClose}>Tutup</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   UPLOAD ZONE
───────────────────────────────────────── */
function UploadZone({ prodi, onSuccess, onCancel }) {
  const [phase, setPhase] = useState("idle");
  const [msg,   setMsg]   = useState("");
  const [drag,  setDrag]  = useState(false);
  const inputRef = useRef();
  const cfg = getPC(prodi);

  const handleFile = (file) => {
    if (!file?.name.endsWith(".docx")) { setPhase("error"); setMsg("Hanya file .docx."); return; }
    if (file.size > 15*1024*1024) { setPhase("error"); setMsg("Maksimal 15 MB."); return; }
    setPhase("uploading"); setMsg("Memproses…");
    const r = new FileReader();
    r.onload = e => {
      const slug = toSlug(prodi);
      localStorage.setItem(`template_${slug}`, e.target.result);
      localStorage.setItem(`template_${slug}_name`, file.name);
      localStorage.setItem(`template_${slug}_size`, file.size);
      localStorage.setItem(`template_${slug}_date`, new Date().toISOString());
      setPhase("done"); setMsg(`Berhasil — ${(file.size/1024).toFixed(0)} KB tersimpan.`);
      setTimeout(onSuccess, 800);
    };
    r.onerror = () => { setPhase("error"); setMsg("Gagal membaca file."); };
    r.readAsDataURL(file);
  };

  return (
    <div className={styles.uploadWrap}>
      <div className={styles.uploadHeader}>
        <span style={{ fontWeight:700, color: cfg.primary, fontSize:13 }}>
          <Upload size={13} style={{ verticalAlign:"middle", marginRight:5 }}/>Upload / Ganti Template — {prodi}
        </span>
        <button className={styles.btnGhost} onClick={onCancel}><X size={13}/> Batal</button>
      </div>
      {phase !== "done" && (
        <div className={`${styles.dropZone} ${drag ? styles.dzDrag : ""}`}
          style={{ borderColor: drag ? cfg.primary : undefined }}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => phase !== "uploading" && inputRef.current?.click()}>
          <input ref={inputRef} type="file" accept=".docx" hidden onChange={e => handleFile(e.target.files[0])}/>
          <div className={styles.dzContent}>
            {phase === "uploading"
              ? <><Loader2 size={26} className={styles.spin} style={{ color: cfg.primary }}/><p>{msg}</p></>
              : <><Upload size={26} style={{ color:"#b09880" }}/><p>Seret file <strong>.docx</strong> ke sini atau klik</p><small>Maksimal 15 MB</small></>}
          </div>
        </div>
      )}
      {phase !== "idle" && phase !== "uploading" && (
        <div className={`${styles.uploadMsg} ${phase === "done" ? styles.msgOk : styles.msgErr}`}>
          {phase === "done" ? <CheckCircle2 size={13}/> : <AlertCircle size={13}/>}<span>{msg}</span>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   MODAL EDIT / TAMBAH BUTIR CPL
───────────────────────────────────────── */
function EditCplModal({ item, sectionLabel, prodiColor, onSave, onClose }) {
  const [textId, setTextId] = useState(item?.id || "");
  const [textEn, setTextEn] = useState(item?.en || "");

  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn); return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalHeaderIcon} style={{ background:`${prodiColor}20`, color: prodiColor }}><Edit3 size={15}/></div>
            <div>
              <h3 className={styles.modalTitle}>{item ? "Edit Butir CPL" : "Tambah Butir CPL"}</h3>
              <p className={styles.modalSub}>{sectionLabel}</p>
            </div>
          </div>
          <button className={styles.modalCloseBtn} onClick={onClose}><X size={17}/></button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.cplEditGroup}>
            <label className={styles.cplEditLabel}>
              <span className={styles.langBadge} style={{ background:"#fef3c7", color:"#92400e" }}>🇮🇩 Indonesia</span>
              Teks Bahasa Indonesia <span className={styles.req}>*</span>
            </label>
            <textarea className={styles.cplTextarea} rows={4} value={textId}
              onChange={e => setTextId(e.target.value)}
              placeholder="Tulis butir CPL dalam Bahasa Indonesia…"
              style={{ borderColor: textId ? `${prodiColor}60` : undefined }}/>
            <span className={styles.charCount}>{textId.length} karakter</span>
          </div>
          <div className={styles.cplEditGroup}>
            <label className={styles.cplEditLabel}>
              <span className={styles.langBadge} style={{ background:"#dbeafe", color:"#1d4ed8" }}>🇬🇧 English</span>
              English Text <span className={styles.optBadge}>opsional</span>
            </label>
            <textarea className={styles.cplTextarea} rows={4} value={textEn}
              onChange={e => setTextEn(e.target.value)}
              placeholder="Write CPL item in English…"
              style={{ borderColor: textEn ? `${prodiColor}60` : undefined }}/>
            <span className={styles.charCount}>{textEn.length} karakter</span>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.btnGhost} onClick={onClose}>Batal</button>
          <button className={styles.btnSave} style={{ background: prodiColor }}
            onClick={() => { if (textId.trim()) onSave({ id: textId.trim(), en: textEn.trim() }); }}
            disabled={!textId.trim()}>
            <Save size={14}/> {item ? "Simpan Perubahan" : "Tambah Butir"}
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
    const fn = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn); return () => window.removeEventListener("keydown", fn);
  }, [onClose]);
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalHeaderIcon} style={{ background:"#fee2e2", color:"#dc2626" }}><Trash2 size={15}/></div>
            <div><h3 className={styles.modalTitle}>Hapus Butir CPL?</h3><p className={styles.modalSub}>Tindakan ini tidak dapat dibatalkan</p></div>
          </div>
          <button className={styles.modalCloseBtn} onClick={onClose}><X size={17}/></button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.confirmBox}>
            <p style={{ fontSize:13, color:"#3d2006", margin:0 }}>Hapus butir no. <strong>{index + 1}</strong>?</p>
            <p style={{ fontSize:12, color:"#9e7b5e", margin:"6px 0 0", lineHeight:1.5 }}>
              {item?.id?.slice(0, 100)}{item?.id?.length > 100 ? "…" : ""}
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
   SECTION CPL (satu accordion)
───────────────────────────────────────── */
function CplSection({ sectionKey, label, labelEn, icon, items, prodiColor, searchQ, isOpen, onToggle, onItemsChange }) {
  const [editTarget, setEditTarget] = useState(null); // {index, item} | "new"
  const [confirmDel, setConfirmDel] = useState(null); // index

  const filtered = searchQ
    ? items.filter(s => s.id.toLowerCase().includes(searchQ.toLowerCase()) || s.en.toLowerCase().includes(searchQ.toLowerCase()))
    : items;

  const handleSaveEdit = (newItem) => {
    const upd = [...items];
    if (editTarget === "new") upd.push(newItem);
    else upd[editTarget.index] = newItem;
    onItemsChange(upd);
    setEditTarget(null);
  };

  const handleDelete = () => {
    onItemsChange(items.filter((_, i) => i !== confirmDel));
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
    <>
      <div className={`${styles.accordion} ${isOpen ? styles.accordionOpen : ""}`}
        style={{ borderLeft: `3px solid ${prodiColor}` }}>
        <button className={styles.accordionBtn} onClick={onToggle}>
          <div className={styles.accordionLeft}>
            <span className={styles.accIcon}>{icon}</span>
            <div>
              <span className={styles.accordionTitle} style={{ color: isOpen ? prodiColor : "#2c1a0e" }}>{label}</span>
              <span className={styles.accordionEN}> / <em>{labelEn}</em></span>
            </div>
          </div>
          <div className={styles.accordionRight}>
            <span className={styles.countBadge} style={{ background:`${prodiColor}16`, color: prodiColor }}>{items.length} butir</span>
            {isOpen ? <ChevronUp size={14} style={{ color: prodiColor }}/> : <ChevronDown size={14} style={{ color:"#b09880" }}/>}
          </div>
        </button>

        {isOpen && (
          <div className={styles.accordionBody}>
            {filtered.length === 0 && (
              <p className={styles.noResult}>{searchQ ? "Tidak ada hasil pencarian." : "Belum ada butir CPL."}</p>
            )}

            {filtered.map((item) => {
              const origIdx = items.indexOf(item);
              return (
                <div key={origIdx} className={styles.cplItem}>
                  <div className={styles.cplNo} style={{ background:`${prodiColor}14`, color: prodiColor }}>{origIdx + 1}</div>
                  <div className={styles.cplContent}>
                    <p className={styles.cplId}>{item.id}</p>
                    {item.en && <p className={styles.cplEn}><em>{item.en}</em></p>}
                  </div>
                  <div className={styles.cplActions}>
                    <button className={styles.cplBtn} title="Naik" onClick={() => move(origIdx, -1)} disabled={origIdx === 0}><ChevronUp size={12}/></button>
                    <button className={styles.cplBtn} title="Turun" onClick={() => move(origIdx, 1)} disabled={origIdx === items.length-1}><ChevronDown size={12}/></button>
                    <button className={styles.cplBtnEdit} title="Edit" style={{ color: prodiColor }} onClick={() => setEditTarget({ index: origIdx, item })}><Edit3 size={13}/></button>
                    <button className={styles.cplBtnDel} title="Hapus" onClick={() => setConfirmDel(origIdx)}><Trash2 size={13}/></button>
                  </div>
                </div>
              );
            })}

            <button className={styles.addCplBtn} style={{ borderColor:`${prodiColor}50`, color: prodiColor }}
              onClick={() => setEditTarget("new")}>
              <Plus size={13}/> Tambah Butir CPL
            </button>
          </div>
        )}
      </div>

      {editTarget !== null && (
        <EditCplModal
          item={editTarget === "new" ? null : editTarget.item}
          sectionLabel={`${label} — ${editTarget === "new" ? "Butir Baru" : `No. ${editTarget.index + 1}`}`}
          prodiColor={prodiColor}
          onSave={handleSaveEdit}
          onClose={() => setEditTarget(null)}
        />
      )}
      {confirmDel !== null && (
        <ConfirmDeleteModal
          item={items[confirmDel]}
          index={confirmDel}
          onConfirm={handleDelete}
          onClose={() => setConfirmDel(null)}
        />
      )}
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
  const [openSecs,       setOpenSecs]       = useState({ sikap: true });
  const [search,         setSearch]         = useState("");
  const [showPreview,    setShowPreview]    = useState(false);
  const [showUpload,     setShowUpload]     = useState(false);
  const [templateStatus, setTemplateStatus] = useState({});
  const [toast,          setToast]          = useState(null);
  const [hasOverride,    setHasOverride]    = useState(false);
  const [saving,         setSaving]         = useState(false);

  const showToast = useCallback((text, type = "success") => setToast({ text, type }), []);

  /* ── Load data saat prodi berganti ── */
  useEffect(() => {
    setCplData(getEffective(activeProdi));
    setIsDirty(false);
    setHasOverride(!!loadOverride(activeProdi));
    setSearch(""); setOpenSecs({ sikap: true });
    setShowUpload(false); setShowPreview(false);
  }, [activeProdi]);

  /* ── Load status template Word ── */
  useEffect(() => {
    const st = {};
    PRODI_LIST.forEach(p => { st[p] = !!localStorage.getItem(`template_${toSlug(p)}`); });
    setTemplateStatus(st);
    document.title = "Template SKPI — Admin SKPI";
  }, []);

  const handleItemsChange = useCallback((secKey, newItems) => {
    setCplData(prev => ({ ...prev, [secKey]: newItems }));
    setIsDirty(true);
  }, []);

  /* ── Simpan ── */
  const handleSave = async () => {
    if (!cplData || !isDirty) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 350));
    saveOverride(activeProdi, {
      sikap:              cplData.sikap,
      pengetahuan:        cplData.pengetahuan,
      keterampilan_umum:  cplData.keterampilan_umum,
      keterampilan_khusus:cplData.keterampilan_khusus,
    });
    setIsDirty(false); setHasOverride(true); setSaving(false);
    showToast(`CPL ${activeProdi} berhasil disimpan!`);
  };

  /* ── Reset ke data awal ── */
  const handleReset = () => {
    if (!confirm(`Reset CPL ${activeProdi} ke data awal? Semua perubahan manual akan hilang.`)) return;
    clearOverride(activeProdi);
    setCplData({ ...getProdiTemplate(activeProdi) });
    setIsDirty(false); setHasOverride(false);
    showToast(`CPL ${activeProdi} direset ke data awal.`);
  };

  /* ── Buang perubahan ── */
  const handleDiscard = () => {
    if (!confirm("Buang semua perubahan yang belum disimpan?")) return;
    setCplData(getEffective(activeProdi)); setIsDirty(false);
  };

  /* ── Upload sukses ── */
  const handleUploadSuccess = () => {
    setTemplateStatus(prev => ({ ...prev, [activeProdi]: true }));
    setShowUpload(false);
    showToast(`Template .docx ${activeProdi} berhasil diperbarui!`);
  };

  /* ── Hapus template Word ── */
  const handleDeleteTemplate = () => {
    if (!confirm(`Hapus file .docx template untuk ${activeProdi}?`)) return;
    const slug = toSlug(activeProdi);
    ["","_name","_size","_date"].forEach(s => localStorage.removeItem(`template_${slug}${s}`));
    setTemplateStatus(prev => ({ ...prev, [activeProdi]: false }));
    setShowPreview(false);
    showToast(`Template .docx ${activeProdi} dihapus.`);
  };

  /* ── Switch prodi dengan konfirmasi jika dirty ── */
  const switchProdi = (p) => {
    if (isDirty && !confirm("Ada perubahan belum disimpan. Lanjut pindah prodi?")) return;
    setActiveProdi(p);
  };

  /* ── Derived ── */
  const cfg      = getPC(activeProdi);
  const tpl      = getProdiTemplate(activeProdi);
  const uploaded = templateStatus[activeProdi];
  const slug     = toSlug(activeProdi);

  const fileSize = uploaded ? Math.round(Number(localStorage.getItem(`template_${slug}_size`)) / 1024) : null;
  const fileDate = uploaded
    ? new Date(localStorage.getItem(`template_${slug}_date`)).toLocaleDateString("id-ID", { day:"numeric", month:"short", year:"numeric" })
    : null;
  const overrideDate = hasOverride
    ? new Date(localStorage.getItem(`${storKey(activeProdi)}_updated`)).toLocaleDateString("id-ID", { day:"numeric", month:"short", year:"numeric" })
    : null;

  const totalCpl = cplData
    ? (cplData.sikap?.length||0)+(cplData.pengetahuan?.length||0)+(cplData.keterampilan_umum?.length||0)+(cplData.keterampilan_khusus?.length||0)
    : 0;

  return (
    <div className={styles.page}>
      <Toast msg={toast} onClose={() => setToast(null)}/>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Template SKPI</h1>
          <p className={styles.sub}>Kelola CPL dan file template Word (.docx) per program studi</p>
        </div>
        <div className={styles.headerActions}>
          {isDirty && <span className={styles.dirtyBadge}><AlertCircle size={12}/> Belum disimpan</span>}
          {hasOverride && !isDirty && (
            <button className={styles.btnReset} onClick={handleReset} title="Reset ke data awal">
              <RotateCcw size={13}/> Reset
            </button>
          )}
          <button className={styles.btnSave}
            style={{ background: isDirty ? cfg.gradient : "#d5bfaf", cursor: isDirty ? "pointer":"default" }}
            onClick={handleSave} disabled={!isDirty || saving}>
            {saving ? <><Loader2 size={14} className={styles.spin}/> Menyimpan…</> : <><Save size={14}/> Simpan CPL</>}
          </button>
        </div>
      </div>

      {/* ── Tab Prodi ── */}
      <div className={styles.tabs}>
        {PRODI_LIST.map(p => {
          const c   = getPC(p);
          const up  = templateStatus[p];
          const t   = getProdiTemplate(p);
          const tot = t ? (t.sikap?.length||0)+(t.pengetahuan?.length||0)+(t.keterampilan_umum?.length||0)+(t.keterampilan_khusus?.length||0) : 0;
          const on  = activeProdi === p;
          const ov  = !!loadOverride(p);
          return (
            <button key={p}
              className={`${styles.tab} ${on ? styles.tabOn : ""}`}
              style={on ? { borderColor: c.primary, color: c.primary } : {}}
              onClick={() => switchProdi(p)}>
              <span className={styles.tabDot}
                style={{ background: on ? c.gradient : "#d4c0ac", color:"#fff", fontSize:10, fontWeight:800 }}>
                {c.label.slice(0, 2)}
              </span>
              <span className={styles.tabName}>{p}</span>
              <div className={styles.tabBadges}>
                {up && <span className={styles.tabWord} title="Template Word tersedia">W</span>}
                {ov && <span className={styles.tabEdited} title="CPL telah diubah">✎</span>}
                <span className={styles.tabCount} style={on ? { color: c.primary, background:`${c.primary}14` } : {}}>{tot}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Info Bar ── */}
      <div className={styles.infoBar} style={{ borderLeft:`4px solid ${cfg.primary}` }}>
        <div className={styles.infoLeft}>
          {tpl && (
            <div className={styles.prodiInfo}>
              <GraduationCap size={14} style={{ color: cfg.primary, flexShrink:0 }}/>
              <strong>{tpl.nama}</strong>
              <span className={styles.infoDot}>·</span>
              <span>{tpl.gelar} / {tpl.gelar_en}</span>
              <span className={styles.infoDot}>·</span>
              <span>KKNI Level {tpl.level_kkni}</span>
              <span className={styles.infoDot}>·</span>
              <span className={styles.totalCpl} style={{ color: cfg.primary }}>{totalCpl} CPL</span>
              {hasOverride && (
                <><span className={styles.infoDot}>·</span>
                <span className={styles.overrideBadge} style={{ background:`${cfg.primary}14`, color: cfg.primary }}>
                  <Edit3 size={11}/> Diubah {overrideDate}
                </span></>
              )}
            </div>
          )}
          <div className={styles.wordInfo}>
            {uploaded
              ? <span className={styles.tagUploaded}><CheckCircle2 size={11}/> Template Word — {fileSize} KB — {fileDate}</span>
              : <span className={styles.tagMissing}><AlertCircle size={11}/> Belum ada template Word</span>}
          </div>
        </div>
        <div className={styles.infoActions}>
          <button className={styles.btnOutlineSmall}
            style={{ borderColor: cfg.border, color: cfg.primary }}
            onClick={() => setShowUpload(v => !v)}>
            <Upload size={13}/> {uploaded ? "Ganti File":"Upload .docx"}
          </button>
          <button className={styles.btnOutlineSmall}
            style={{ borderColor: cfg.border, color: cfg.primary }}
            onClick={() => setShowPreview(true)} disabled={!uploaded}>
            <Eye size={13}/> Preview
          </button>
          {uploaded && (
            <button className={styles.btnOutlineSmall}
              style={{ borderColor:"#fca5a5", color:"#dc2626" }}
              onClick={handleDeleteTemplate}>
              <Trash2 size={13}/> Hapus File
            </button>
          )}
        </div>
      </div>

      {/* ── Upload Zone ── */}
      {showUpload && (
        <UploadZone prodi={activeProdi} onSuccess={handleUploadSuccess} onCancel={() => setShowUpload(false)}/>
      )}

      {/* ── CPL Toolbar ── */}
      {cplData && (
        <div className={styles.cplToolbar}>
          <div className={styles.cplToolbarLeft}>
            <BookOpen size={14} style={{ color: cfg.primary, flexShrink:0 }}/>
            <span className={styles.cplToolbarTitle}>Capaian Pembelajaran Lulusan (CPL)</span>
            <span className={styles.cplToolbarSub}>— edit, tambah, ubah urutan</span>
          </div>
          <div className={styles.cplToolbarRight}>
            <button className={styles.btnMini}
              onClick={() => setOpenSecs({ sikap:true, pengetahuan:true, keterampilan_umum:true, keterampilan_khusus:true })}>
              Buka Semua
            </button>
            <button className={styles.btnMini} onClick={() => setOpenSecs({})}>Tutup Semua</button>
            <div className={styles.searchBox}>
              <Search size={13} style={{ color:"#b09880", flexShrink:0 }}/>
              <input className={styles.searchInp} placeholder="Cari butir CPL…"
                value={search} onChange={e => setSearch(e.target.value)}/>
              {search && <button className={styles.searchClr} onClick={() => setSearch("")}><X size={12}/></button>}
            </div>
          </div>
        </div>
      )}

      {/* ── Accordion CPL ── */}
      {cplData && (
        <div className={styles.accordions}>
          {SECTIONS.map(sec => (
            <CplSection
              key={sec.key}
              sectionKey={sec.key} label={sec.label} labelEn={sec.labelEn} icon={sec.icon}
              items={cplData[sec.key] || []}
              prodiColor={cfg.primary}
              searchQ={search}
              isOpen={!!openSecs[sec.key]}
              onToggle={() => setOpenSecs(p => ({ ...p, [sec.key]: !p[sec.key] }))}
              onItemsChange={(items) => handleItemsChange(sec.key, items)}
            />
          ))}
        </div>
      )}

      {/* ── Info Prodi Card ── */}
      {tpl && (
        <div className={styles.prodiDetailCard}>
          <div className={styles.prodiDetailHeader} style={{ background: cfg.gradient }}>
            <Info size={13}/> Informasi Program Studi
          </div>
          <div className={styles.prodiDetailGrid}>
            {[
              ["Program Studi", tpl.nama],
              ["Nama (English)", tpl.nama_en],
              ["Gelar", `${tpl.gelar} / ${tpl.gelar_en}`],
              ["Jenjang", tpl.jenjang],
              ["Level KKNI", `Level ${tpl.level_kkni}`],
              ["Lama Studi", tpl.lama_studi],
              ["Konsentrasi", tpl.konsentrasi || "—"],
              ["Akreditasi", tpl.akreditasi],
            ].map(([lbl, val]) => (
              <div key={lbl} className={styles.prodiDetailItem}>
                <span className={styles.prodiDetailLabel}>{lbl}</span>
                <span className={styles.prodiDetailValue}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Sticky Save Bar ── */}
      {isDirty && (
        <div className={styles.stickyBar}>
          <div className={styles.stickyLeft}>
            <AlertCircle size={14} style={{ color:"#d97706" }}/>
            <span>Ada perubahan yang belum disimpan</span>
          </div>
          <div className={styles.stickyRight}>
            <button className={styles.btnGhost} onClick={handleDiscard}>Buang</button>
            <button className={styles.btnSave} style={{ background: cfg.gradient }} onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 size={14} className={styles.spin}/> Menyimpan…</> : <><Save size={14}/> Simpan CPL</>}
            </button>
          </div>
        </div>
      )}

      {showPreview && <PreviewModal prodi={activeProdi} onClose={() => setShowPreview(false)}/>}
    </div>
  );
}