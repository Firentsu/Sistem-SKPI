"use client";
import { useState, useEffect, useRef } from "react";
import {
  Eye, X, Upload, CheckCircle2, AlertCircle,
  ChevronDown, ChevronRight, Search, Loader2,
  BookOpen, FileText, Trash2, Download,
} from "lucide-react";
import styles from "./page.module.css";
import { PRODI_LIST, getProdiTemplate } from "@/lib/prodi-templates";

import PreviewModal from "@/components/PreviewModal";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/* ── WARNA PER PRODI ── */
const PRODI_CFG = {
  "Teknologi Informasi": { color: "#cc6600", bg: "#fff3e6", border: "#ffaa33", gradient: "linear-gradient(135deg,#ff7f00,#ffaa33)", label: "TI" },
  "Sistem Informasi": { color: "#3d1111", bg: "#f0ecec", border: "#8a4444", gradient: "linear-gradient(135deg,#3d1111,#7a3333)", label: "SI" },
  "Manajemen": { color: "#0077aa", bg: "#e6f5fa", border: "#33ccff", gradient: "linear-gradient(135deg,#0099cc,#33ccff)", label: "MJ" },
  "Kewirausahaan": { color: "#cc2900", bg: "#ffe6e0", border: "#ff7755", gradient: "linear-gradient(135deg,#ff3300,#ff7755)", label: "KW" },
  "Pendidikan Guru Sekolah Dasar": { color: "#660066", bg: "#f3e6f3", border: "#b300b3", gradient: "linear-gradient(135deg,#800080,#b300b3)", label: "PGSD" },
  "Agroekoteknologi": { color: "#007a70", bg: "#e6faf8", border: "#00bfb3", gradient: "linear-gradient(135deg,#00bfb3,#009988)", label: "AGR" },
};
const getPC = (nama) => PRODI_CFG[nama] || { color: "#765439", bg: "#fdf4ec", border: "#e4d4c4", gradient: "linear-gradient(135deg,#765439,#4a2f1a)", label: "?" };
const toSlug = (s) => s.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");


/* ══ UPLOAD ZONE ══ */
function UploadZone({ prodi, onSuccess, onCancel }) {
  const [phase, setPhase] = useState("idle");
  const [msg, setMsg] = useState("");
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);
  const cfg = getPC(prodi);

  const handleFile = async (file) => {
    if (!file?.name.endsWith(".docx")) {
      setPhase("error"); setMsg("Hanya file .docx yang diizinkan."); return;
    }
    setPhase("uploading"); setMsg("Mengupload...");
    try {
      const form = new FormData();
      /* PENTING: nama_prodi harus di-append SEBELUM file agar
         server bisa membaca field ini saat memproses multipart */
      form.append("nama_prodi", prodi);
      form.append("file", file);
      const res = await fetch(`${API}/api/template-skpi/upload`, {
        method: "POST", body: form, credentials: "include",
      });
      /* Pastikan response adalah JSON sebelum di-parse */
      const contentType = res.headers.get("content-type") || "";
      const json = contentType.includes("application/json")
        ? await res.json()
        : { error: `Server error (${res.status})` };
      if (!res.ok || !json.ok) throw new Error(json.error || "Upload gagal");
      setPhase("done");
      setMsg(`Berhasil! ${(json.size / 1024).toFixed(1)} KB disimpan.`);
      setTimeout(() => onSuccess(), 900);
    } catch (e) {
      /* Beri pesan yang lebih jelas untuk network error */
      const msg = e.message === "Failed to fetch"
        ? "Tidak dapat terhubung ke server. Pastikan backend berjalan di port 5000."
        : "Gagal: " + e.message;
      setPhase("error"); setMsg(msg);
    }
  };

  const busy = phase === "uploading";
  return (
    <div className={styles.uploadZoneWrap}>
      <div className={styles.uploadZoneHeader}>
        <span style={{ fontWeight: 700, color: cfg.color }}>Upload Template — {prodi}</span>
        <button className={styles.btnCancel} onClick={onCancel}><X size={14} /></button>
      </div>
      {phase !== "done" && (
        <div
          className={`${styles.dropZone} ${drag ? styles.dzDrag : ""} ${busy ? styles.dzBusy : ""}`}
          style={{ borderColor: drag ? cfg.color : undefined }}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => !busy && inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" accept=".docx" hidden
            onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
          {busy
            ? <div className={styles.dzContent}>
              <Loader2 size={28} className={styles.spin} style={{ color: cfg.color }} />
              <p>{msg}</p>
            </div>
            : <div className={styles.dzContent}>
              <Upload size={28} style={{ color: "#b09880" }} />
              <p>Drag & drop file <strong>.docx</strong> di sini</p>
              <small>atau klik untuk pilih — maks 20 MB</small>
            </div>
          }
        </div>
      )}
      {phase !== "idle" && !busy && (
        <div className={`${styles.uploadMsg} ${phase === "done" ? styles.msgOk : styles.msgErr}`}>
          {phase === "done" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          <span>{msg}</span>
        </div>
      )}
    </div>
  );
}

/* ══ CPL ACCORDION ══ */
function CplAccordion({ title, titleEN, items, color, open, onToggle, searchQ }) {
  const filtered = searchQ
    ? items.filter(s => s.text.toLowerCase().includes(searchQ.toLowerCase()) || s.en.toLowerCase().includes(searchQ.toLowerCase()))
    : items;
  return (
    <div className={styles.accordion} style={{ borderLeft: `3px solid ${color}` }}>
      <button className={styles.accordionBtn} onClick={onToggle}>
        <div className={styles.accordionLeft}>
          <span className={styles.accordionTitle} style={{ color: open ? color : "#2c1a0e" }}>{title}</span>
          <span className={styles.accordionEN}>/ <em>{titleEN}</em></span>
        </div>
        <div className={styles.accordionRight}>
          <span className={styles.countBadge} style={{ background: `${color}18`, color }}>{filtered.length}</span>
          {open ? <ChevronDown size={14} style={{ color }} /> : <ChevronRight size={14} style={{ color: "#b09880" }} />}
        </div>
      </button>
      {open && (
        <div className={styles.accordionBody}>
          {filtered.length === 0
            ? <p className={styles.noResult}>Tidak ada hasil.</p>
            : <table className={styles.cplTable}><tbody>
              {filtered.map((s, i) => (
                <tr key={i} className={styles.cplRow}>
                  <td className={styles.cplNo} style={{ color }}>{i + 1}</td>
                  <td className={styles.cplCell}>
                    <div className={styles.cplID}>{s.text}</div>
                    <div className={styles.cplEN}><em>{s.en}</em></div>
                  </td>
                </tr>
              ))}
            </tbody></table>
          }
        </div>
      )}
    </div>
  );
}

/* ══ HALAMAN UTAMA ══ */
export default function TemplateSkpiPage() {
  const [activeProdi, setActiveProdi] = useState(PRODI_LIST[0]);
  const [templateList, setTemplateList] = useState([]); // [{slug,nama_prodi,size,updated_at}]
  const [openSecs, setOpenSecs] = useState({ capaian_sikap: true });
  const [search, setSearch] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    document.title = "Template SKPI | Admin";
    fetchList();
  }, []);

  const fetchList = async () => {
    try {
      const res = await fetch(`${API}/api/template-skpi/list`, { credentials: "include" });
      const json = await res.json();
      if (json.ok) setTemplateList(json.list);
    } catch { }
  };

  const handleDelete = async () => {
    if (!confirm(`Hapus template Word untuk "${activeProdi}"?`)) return;
    const slug = toSlug(activeProdi);
    await fetch(`${API}/api/template-skpi/${slug}`, { method: "DELETE", credentials: "include" });
    fetchList();
  };

  const tpl = getProdiTemplate(activeProdi);
  const cfg = getPC(activeProdi);
  const slug = toSlug(activeProdi);
  const uploaded = templateList.find(t => t.slug === slug);

  const CPL_GROUPS = tpl ? [
    { key: "capaian_sikap", title: "Sikap", titleEN: "Proposition of Attitude", items: tpl.sikap || [] },
    { key: "capaian_pengetahuan", title: "Pengetahuan", titleEN: "Knowledge", items: tpl.pengetahuan || [] },
    { key: "keterampilan_umum", title: "Keterampilan Umum", titleEN: "General Competence", items: tpl.keterampilan_umum || [] },
    { key: "keterampilan_khusus", title: "Keterampilan Khusus", titleEN: "Specific Competences", items: tpl.keterampilan_khusus || [] },
  ] : [];

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Template SKPI</h1>
          <p className={styles.sub}>Upload file Word (.docx) per prodi — digunakan sebagai template saat generate SKPI mahasiswa</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className={styles.btnUpload}
            style={{ borderColor: cfg.border, color: cfg.color }}
            onClick={() => setShowUpload(v => !v)}>
            <Upload size={14} />
            {uploaded ? "Ganti File Word" : "Upload File Word"}
          </button>
          <button className={styles.btnPreview}
            style={{ background: cfg.gradient }}
            onClick={() => setShowPreview(true)}>
            <Eye size={14} /> Preview Template
          </button>
        </div>
      </div>

      {/* Prodi Tabs */}
      <div className={styles.tabs}>
        {PRODI_LIST.map(prodi => {
          const c = getPC(prodi);
          const sl = toSlug(prodi);
          const up = templateList.some(t => t.slug === sl);
          const t = getProdiTemplate(prodi);
          const tot = t ? (t.sikap?.length || 0) + (t.pengetahuan?.length || 0) + (t.keterampilan_umum?.length || 0) + (t.keterampilan_khusus?.length || 0) : 0;
          const on = activeProdi === prodi;
          return (
            <button key={prodi}
              className={`${styles.tab} ${on ? styles.tabOn : ""}`}
              style={on ? { borderColor: c.color, borderBottomColor: "transparent", color: c.color } : {}}
              onClick={() => { setActiveProdi(prodi); setSearch(""); setShowUpload(false); }}>
              <span className={styles.tabDot} style={{ background: on ? c.gradient : "#d4c0ac" }}>{c.label.slice(0, 2)}</span>
              <span className={styles.tabName}>{prodi}</span>
              {up && <span className={styles.tabUploaded} title="Template Word tersedia">✓</span>}
              <span className={styles.tabCount} style={on ? { color: c.color, background: `${c.color}15` } : {}}>{tot} CPL</span>
            </button>
          );
        })}
      </div>

      {/* Status Bar */}
      <div className={styles.infoBar} style={{ borderColor: cfg.border }}>
        <div className={styles.infoLeft}>
          {uploaded ? (
            <>
              <span className={styles.tagUploaded}><CheckCircle2 size={11} /> Template Word tersedia</span>
              <span style={{ fontSize: 12, color: "#9c7a5e" }}>
                {(uploaded.size / 1024).toFixed(0)} KB · {new Date(uploaded.updated_at).toLocaleDateString("id-ID")}
              </span>
            </>
          ) : (
            <span className={styles.tagDefault}><AlertCircle size={11} /> Belum ada template Word — silakan upload</span>
          )}
        </div>
        <div className={styles.infoActions}>
          {uploaded && (
            <>
              <a href={`${API}/uploads/templates/${slug}.docx`}
                download={`Template_SKPI_${activeProdi}.docx`}
                className={styles.btnDownload} title="Download file Word">
                <Download size={13} /> Download
              </a>
              <button className={styles.btnReset} onClick={handleDelete} title="Hapus template">
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Upload Zone */}
      {showUpload && (
        <UploadZone prodi={activeProdi}
          onSuccess={() => { setShowUpload(false); fetchList(); }}
          onCancel={() => setShowUpload(false)} />
      )}

      {/* Hint jika belum upload */}
      {!uploaded && !showUpload && (
        <div style={{ background: "#fef9c3", border: "1.5px solid #fde047", borderRadius: 12, padding: "16px 20px", display: "flex", gap: 14, alignItems: "flex-start" }}>
          <FileText size={22} style={{ color: "#854d0e", flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontWeight: 700, color: "#854d0e", margin: "0 0 5px" }}>Cara upload template untuk {activeProdi}:</p>
            <ol style={{ fontSize: 13, color: "#92400e", margin: 0, paddingLeft: 16, lineHeight: 1.8 }}>
              <li>Buka file Word template SKPI di Microsoft Word</li>
              <li>Pastikan sudah sesuai format yang diinginkan</li>
              <li>Simpan sebagai <strong>.docx</strong> (Word Document)</li>
              <li>Klik <strong>"Upload File Word (.docx)"</strong> di atas → pilih file</li>
              <li>Preview akan menampilkan isi dokumen Word langsung</li>
            </ol>
            <p style={{ fontSize: 12, color: "#78350f", marginTop: 6, margin: "6px 0 0", fontStyle: "italic" }}>
              Saat generate SKPI mahasiswa, sistem akan menggunakan template Word ini dan mengisi data mahasiswa secara otomatis.
            </p>
          </div>
        </div>
      )}

      {/* CPL Reference */}
      {tpl && !showUpload && (
        <div className={styles.cplPanel}>
          <div className={styles.cplHead}>
            <div className={styles.cplTitle}>
              <BookOpen size={14} style={{ color: cfg.color }} />
              <span>Referensi CPL — {activeProdi}</span>
              <span style={{ fontSize: 11.5, color: "#9c7a5e", fontWeight: 400, marginLeft: 4 }}>
                ({(tpl.sikap?.length || 0) + (tpl.pengetahuan?.length || 0) + (tpl.keterampilan_umum?.length || 0) + (tpl.keterampilan_khusus?.length || 0)} total CPL)
              </span>
            </div>
            <div className={styles.cplActions}>
              <button className={styles.btnMini}
                onClick={() => setOpenSecs({ capaian_sikap: true, capaian_pengetahuan: true, keterampilan_umum: true, keterampilan_khusus: true })}>
                Buka Semua
              </button>
              <button className={styles.btnMini} onClick={() => setOpenSecs({})}>Tutup Semua</button>
              <div className={styles.searchBox}>
                <Search size={13} style={{ color: "#b09880", flexShrink: 0 }} />
                <input className={styles.searchInp} placeholder="Cari CPL..."
                  value={search} onChange={e => setSearch(e.target.value)} />
                {search && <button className={styles.searchClr} onClick={() => setSearch("")}><X size={12} /></button>}
              </div>
            </div>
          </div>
          <div className={styles.accordions}>
            {CPL_GROUPS.map(g => (
              <CplAccordion key={g.key}
                title={g.title} titleEN={g.titleEN} items={g.items}
                color={cfg.color} open={!!openSecs[g.key]}
                onToggle={() => setOpenSecs(p => ({ ...p, [g.key]: !p[g.key] }))}
                searchQ={search} />
            ))}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <PreviewModal prodi={activeProdi} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}