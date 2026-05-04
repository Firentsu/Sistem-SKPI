"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, Filter, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2,
  X, Download, Eye, FileText, Loader2, Zap, Users, Award, TrendingUp,
  RefreshCw, GraduationCap, Activity, ChevronDown, Shield, Printer,
  Star, Medal, Trophy, CheckSquare, Clock, Send,
} from "lucide-react";
import styles from "./page.module.css";
import {
  getMahasiswaList, getProdiList, getIcpSummary,
  generateSkpi, publishSkpi, getSkpiList, getMahasiswaDetail,
} from "@/lib/api";

/* ══════════════════════════════════════════
   KONSTANTA
══════════════════════════════════════════ */
const PER_PAGE = 10;

const ICP_TIERS = [
  { min: 200,  label: "Gold Achievement",   color: "#ca8a04", bg: "#fef9c3", border: "#fde047", icon: Trophy },
  { min: 150,  label: "Silver Achievement", color: "#2563eb", bg: "#dbeafe", border: "#93c5fd", icon: Medal  },
  { min: 100,  label: "Bronze Achievement", color: "#92400e", bg: "#fef3c7", border: "#fcd34d", icon: Award  },
  { min: 0,    label: "Belum Memenuhi",     color: "#dc2626", bg: "#fee2e2", border: "#fca5a5", icon: AlertCircle },
];

const STATUS_SKPI_CFG = {
  belum:       { label: "Belum",     color: "#6b7280", bg: "#f3f4f6", border: "#d1d5db" },
  diajukan:    { label: "Proses",    color: "#d97706", bg: "#fef3c7", border: "#fde68a" },
  direvisi:    { label: "Revisi",    color: "#7c3aed", bg: "#ede9fe", border: "#c4b5fd" },
  diterbitkan: { label: "Diterbitkan",color:"#16a34a", bg: "#dcfce7", border: "#86efac" },
};

function getIcpTier(poin) {
  return ICP_TIERS.find(t => poin >= t.min) || ICP_TIERS[ICP_TIERS.length - 1];
}

const ICP_CAT_COLORS = {
  Fisik: "#ef4444", Iman: "#f59e0b", Intelektualitas: "#3b82f6",
  Kepribadian: "#8b5cf6", Keterampilan: "#10b981", Moral: "#f97316",
};

/* ── PRODI COLOR (dari halaman mahasiswa) ── */
const PRODI_CFG = {
  "Teknologi Informasi":          { color: "#5b21b6", bg: "#ede9fe", border: "#c4b5fd", gradient: "linear-gradient(135deg,#7c3aed,#5b21b6)", label: "TI"   },
  "Sistem Informasi":             { color: "#1d4ed8", bg: "#dbeafe", border: "#93c5fd", gradient: "linear-gradient(135deg,#2563eb,#1d4ed8)", label: "SI"   },
  "Manajemen":                    { color: "#0369a1", bg: "#e0f2fe", border: "#7dd3fc", gradient: "linear-gradient(135deg,#0284c7,#0369a1)", label: "MJ"   },
  "Kewirausahaan":                { color: "#065f46", bg: "#d1fae5", border: "#6ee7b7", gradient: "linear-gradient(135deg,#059669,#065f46)", label: "KW"   },
  "Pendidikan Guru Sekolah Dasar":{ color: "#854d0e", bg: "#fef9c3", border: "#fde047", gradient: "linear-gradient(135deg,#ca8a04,#854d0e)", label: "PGSD" },
  "Agroekoteknologi":             { color: "#166534", bg: "#dcfce7", border: "#86efac", gradient: "linear-gradient(135deg,#16a34a,#166534)", label: "AGR"  },
};
function getProdiCfg(nama) {
  return PRODI_CFG[nama] || { color: "#765439", bg: "#fdf4ec", border: "#e4d4c4", gradient: "linear-gradient(135deg,#765439,#4a2f1a)", label: "?" };
}

/* ══════════════════════════════════════════
   TOAST
══════════════════════════════════════════ */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  const remove = id => setToasts(p => p.filter(t => t.id !== id));
  return { toasts, add, remove };
}

function Toasts({ toasts, remove }) {
  return (
    <div className={styles.toastStack}>
      {toasts.map(t => (
        <div key={t.id} className={`${styles.toast} ${t.type === "success" ? styles.toastOk : styles.toastErr}`}>
          {t.type === "success" ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>}
          <span>{t.msg}</span>
          <button onClick={() => remove(t.id)}><X size={12}/></button>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════
   ICP MINI CHART (Bar horizontal)
══════════════════════════════════════════ */
function IcpMiniChart({ detail }) {
  if (!detail?.length) return <span style={{ color: "#aaa", fontSize: "12px" }}>—</span>;
  const max = Math.max(...detail.map(d => d.total_poin ?? 0), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3px", width: "120px" }}>
      {detail.map(d => {
        const pct = Math.round(((d.total_poin ?? 0) / max) * 100);
        const c   = ICP_CAT_COLORS[d.nama_indo] || "#888";
        return (
          <div key={d.id_icp} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{ flex: 1, background: "#f5f5f5", borderRadius: "3px", height: "6px", overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, background: c, height: "100%", minWidth: (d.total_poin > 0) ? "3px" : "0", borderRadius: "3px" }}/>
            </div>
            <span style={{ fontSize: "9px", color: c, fontWeight: 700, width: "22px", textAlign: "right" }}>
              {d.total_poin ?? 0}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════
   PREVIEW MODAL — dokumen SKPI nyata
══════════════════════════════════════════ */
function PreviewModal({ mhs, onClose, onGenerate, onPublish, generating, publishing, existingSkpi }) {
  const printRef = useRef(null);
  const tier = getIcpTier(mhs?.total_poin ?? 0);
  const TierIcon = tier.icon;
  const tgl = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const nomorSkpi = existingSkpi?.nomor_skpi || `SKPI/${mhs?.prodi?.replace(/\s+/g,"").substring(0,2).toUpperCase() || "XX"}/${String(mhs?.id_mahasiswa).padStart(3,"0")}/${new Date().toLocaleDateString("id-ID",{month:"2-digit",year:"numeric"}).replace("/","/")}`;

  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>SKPI — ${mhs.nama}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Times New Roman',serif;font-size:10pt;color:#000;padding:15mm 20mm}
        table{width:100%;border-collapse:collapse;margin-bottom:6px}
        td,th{border:1px solid #aaa;padding:4px 7px;vertical-align:top;font-size:9.5pt;line-height:1.4}
        th{background:#d0d0d0;font-weight:bold;text-align:center}
        .kop{display:flex;align-items:center;gap:14px;margin-bottom:6px}
        .kop img{height:50px}
        .kop-pt{font-size:13pt;font-weight:bold}
        .kop-en{font-size:10pt;font-style:italic}
        hr{border:2px solid #333;margin:5px 0 8px}
        .judul{text-align:center;margin-bottom:12px}
        .judul .id{font-size:13pt;font-weight:bold}
        .sec-hdr{background:#555;color:#fff;padding:4px 8px;font-weight:bold;margin:8px 0 0;display:flex;gap:8px}
        .sub-hdr{background:#999;color:#fff;padding:2px 8px;font-size:9pt;font-weight:700}
        .cpl-hdr{padding:3px 8px;font-weight:700;text-decoration:underline;background:#e8e8e8}
        em{font-style:italic}
        .td-no{width:40px;text-align:center;font-weight:700;background:#f0f0f0}
        .td-lbl{width:35%}
        .icp-result{background:#f0f0f0;padding:4px 8px;font-weight:600;margin:4px 0}
        .ttd{text-align:center;margin-top:16px;line-height:1.6}
        .ttd-space{height:56px}
        .catatan{border-top:1px solid #aaa;padding:6px;font-size:8.5pt;margin-top:10px}
        .catatan ul{margin-left:14px}
        @page{size:A4;margin:12mm}
      </style></head><body>${content.innerHTML}</body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 350);
  };

  if (!mhs) return null;
  const icp = mhs.detail_icp || [];
  const icpTotal = mhs.total_poin ?? 0;
  const icpMax = Math.max(...icp.map(d => d.total_poin ?? 0), 1);

  return (
    <div className={styles.previewOverlay}>
      {/* Toolbar */}
      <div className={styles.previewBar}>
        <div className={styles.previewBarLeft}>
          <FileText size={16}/>
          <span>Preview SKPI — <strong>{mhs.nama}</strong> ({mhs.nim})</span>
          <span className={styles.previewTier} style={{ background: tier.bg, color: tier.color, border: `1px solid ${tier.border}` }}>
            <TierIcon size={11}/> {tier.label}
          </span>
        </div>
        <div className={styles.previewBarRight}>
          <button className={styles.btnPrint} onClick={handlePrint}><Printer size={14}/> Cetak / PDF</button>
          {!existingSkpi && (
            <button className={`${styles.btnGenerate} ${generating ? styles.btnLoading : ""}`}
              onClick={onGenerate} disabled={generating || mhs.total_poin < 100}>
              {generating ? <Loader2 size={14} className={styles.spin}/> : <Zap size={14}/>}
              {generating ? "Generating..." : "Generate SKPI"}
            </button>
          )}
          {existingSkpi && existingSkpi.status === "draft" && (
            <button className={`${styles.btnPublish} ${publishing ? styles.btnLoading : ""}`}
              onClick={onPublish} disabled={publishing}>
              {publishing ? <Loader2 size={14} className={styles.spin}/> : <Send size={14}/>}
              {publishing ? "Menerbitkan..." : "Terbitkan Resmi"}
            </button>
          )}
          {existingSkpi?.status === "resmi" && (
            <span className={styles.btnResmi}><CheckSquare size={14}/> Sudah Diterbitkan</span>
          )}
          <button className={styles.previewClose} onClick={onClose}><X size={18}/></button>
        </div>
      </div>

      {/* Paper */}
      <div className={styles.previewScroll}>
        <div className={styles.paper} ref={printRef}>
          {/* KOP */}
          <div className="kop" style={{ display:"flex", alignItems:"center", gap:"14px", marginBottom:"6px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/Logo_isb.png" alt="ISB" style={{ height:"52px" }} onError={e=>e.currentTarget.style.display="none"}/>
            <div>
              <div style={{ fontSize:"14pt", fontWeight:"bold", fontFamily:"'Times New Roman',serif" }}>INSTITUT SHANTI BHUANA</div>
              <div style={{ fontSize:"10.5pt", fontStyle:"italic", fontFamily:"'Times New Roman',serif" }}>INSTITUTE of SHANTI BHUANA</div>
            </div>
          </div>
          <hr style={{ border:"none", borderTop:"2.5px solid #333", margin:"5px 0 8px" }}/>

          {/* Judul */}
          <div style={{ textAlign:"center", fontFamily:"'Times New Roman',serif", marginBottom:"14px" }}>
            <div style={{ fontSize:"13pt", fontWeight:"bold" }}>SURAT KETERANGAN PENDAMPING IJAZAH (SKPI)</div>
            <div style={{ fontStyle:"italic", fontSize:"11pt" }}>CERTIFICATE of SUPPLEMENT</div>
            <div style={{ fontWeight:"bold", fontSize:"11pt", margin:"4px 0" }}>Nomor: {nomorSkpi}</div>
            <div style={{ fontSize:"8.5pt", marginTop:"6px" }}>Surat Keterangan Pendamping Ijazah ini menyatakan kemampuan kerja, penguasaan pengetahuan dan integritas pemegangnya.</div>
            <div style={{ fontSize:"8pt", fontStyle:"italic", color:"#444" }}><em>This Certificate of Supplement is to provide a description of the nature, level, context and status of the studies that were pursued and successfully completed by the individual named on the original qualification to which this supplement is appended</em></div>
          </div>

          {/* Seksi 1 — Identitas */}
          <DocSectionHeader no="1" id="INFORMASI TENTANG IDENTITAS DIRI PEMEGANG SKPI" en="Information Identifying the Holder of this Certificate of Supplement"/>
          <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:"'Times New Roman',serif" }}>
            <tbody>
              {[
                ["1.1a","Nama sesuai Ijazah","Name as in High School Certificate", mhs.nama],
                ["1.1b","Nama sesuai KTP","Name as in Identification Card", mhs.nama],
                ["1.1c","Nama sesuai Akta Kelahiran","Name as in Birth Certificate", mhs.nama],
                ["1.2","Tempat dan Tanggal Lahir","Place and Date of Birth", mhs.tempat_lahir ? `${mhs.tempat_lahir}, ${mhs.tgl_lahir ? new Date(mhs.tgl_lahir).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"}) : "-"}` : "-"],
                ["1.3","Nomor Induk Mahasiswa","Student's Registration Number", mhs.nim],
                ["1.4","Tanggal Masuk","Date of Enrollment", mhs.tgl_masuk ? new Date(mhs.tgl_masuk).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"}) : "-"],
                ["1.5","Tanggal Lulus","Date of Completion", mhs.tgl_lulus ? new Date(mhs.tgl_lulus).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"}) : "-"],
                ["1.6","Nomor Seri Ijazah","Serial Number", mhs.nomor_ijazah || "-"],
                ["1.7","Gelar","Degree", mhs.gelar ? `${mhs.gelar}\n${mhs.gelar_eng||""}` : "Sarjana Komputer (S.Kom.) / Bachelor of Computer"],
              ].map(([no, id, en, val]) => (
                <DocRow key={no} no={no} id={id} en={en} val={String(val||"-")}/>
              ))}
            </tbody>
          </table>

          {/* Seksi 2 — Institusi */}
          <DocSectionHeader no="2" id="INFORMASI TENTANG IDENTITAS PENYELENGGARA PROGRAM" en="Information Identifying the Awarding Institution"/>
          <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:"'Times New Roman',serif" }}>
            <tbody>
              <DocRow no="2.1" id="SK Pendirian Perguruan Tinggi" en="Awarding Institution's License" val="SK Menteri Pendidikan dan Kebudayaan Republik Indonesia No. 725/M/2020"/>
              <DocRow no="2.2" id="Akreditasi" en="Accreditation" val={"Institusi: Terakreditasi BAIK SEKALI, SK BAN-PT No. 801/SK/BAN-PT/Ak/PT/X/2023\nProdi "+mhs.prodi+": Terakreditasi BAIK SEKALI"}/>
              <DocRow no="2.3" id="Nama Perguruan Tinggi" en="Awarding Institution" val="Institut Shanti Bhuana / Institute of Shanti Bhuana"/>
              <DocRow no="2.4" id="Program Studi" en="Study Program" val={`${mhs.prodi} — Kelas Reguler`}/>
              <DocRow no="2.5" id="Jenjang Pendidikan" en="Level of Education" val="Sarjana (S1) / Bachelor Degree"/>
              <DocRow no="2.6" id="Jenis Pendidikan" en="Type of Education" val="Institut / Institute"/>
              <DocRow no="2.7" id="Jenjang Kualifikasi KKNI" en="Level of Qualification in the National Qualification" val="Framework Level 6"/>
              <DocRow no="2.8" id="Bahasa Pengantar Kuliah" en="Language of Instruction" val="Bahasa Indonesia / Indonesian"/>
              <DocRow no="2.9" id="Sistem Penilaian" en="Grading System" val="Skala: 1–4; A = 4, A- = 3,5, B = 3, B- = 2,5, C = 2, D = 1, E = 0"/>
              <DocRow no="2.10" id="Lama Studi Reguler" en="Regular Length of Study" val="8 Semester / 8 Semesters"/>
              <DocRow no="2.11" id="Persyaratan Penerimaan" en="Entry Requirement" val="Lulus Pendidikan Menengah Atas/Sederajat"/>
              <DocRow no="2.12" id="Jenis dan Jenjang Pendidikan Lanjutan" en="Access to Further Study" val="Akademik, Magister (S2), Doktoral (S3)"/>
            </tbody>
          </table>

          {/* Seksi 3 — Capaian (ringkasan karena data dari DB belum detail per mhs) */}
          <DocSectionHeader no="3" id="INFORMASI TENTANG KUALIFIKASI DAN HASIL YANG DICAPAI" en="Information Identifying the Qualification and Outcomes Obtained"/>
          <div style={{ background:"#999", color:"#fff", padding:"3px 9px", fontSize:"9pt", fontWeight:700 }}>A &nbsp; Capaian Pembelajaran / <em>Learning Outcomes</em></div>
          <div style={{ background:"#e8e8e8", padding:"3px 9px", fontSize:"9pt", fontWeight:700, textDecoration:"underline" }}>Sikap / <em>Proposition of Attitude</em></div>
          <p style={{ fontSize:"8.5pt", padding:"4px 9px", fontStyle:"italic", fontFamily:"serif", color:"#555" }}>[Capaian Pembelajaran Sikap sesuai kurikulum program studi {mhs.prodi}]</p>
          <div style={{ background:"#e8e8e8", padding:"3px 9px", fontSize:"9pt", fontWeight:700, textDecoration:"underline" }}>Pengetahuan / <em>Knowledge</em></div>
          <p style={{ fontSize:"8.5pt", padding:"4px 9px", fontStyle:"italic", fontFamily:"serif", color:"#555" }}>[Capaian Pembelajaran Pengetahuan sesuai kurikulum program studi {mhs.prodi}]</p>
          <div style={{ background:"#e8e8e8", padding:"3px 9px", fontSize:"9pt", fontWeight:700, textDecoration:"underline" }}>Keterampilan Umum / <em>General Competence</em></div>
          <p style={{ fontSize:"8.5pt", padding:"4px 9px", fontStyle:"italic", fontFamily:"serif", color:"#555" }}>[Keterampilan Umum sesuai SN-Dikti]</p>
          <div style={{ background:"#e8e8e8", padding:"3px 9px", fontSize:"9pt", fontWeight:700, textDecoration:"underline" }}>Keterampilan Khusus / <em>Spesific Competences/Skills</em></div>
          <p style={{ fontSize:"8.5pt", padding:"4px 9px", fontStyle:"italic", fontFamily:"serif", color:"#555" }}>[Keterampilan Khusus sesuai kurikulum program studi {mhs.prodi}]</p>

          {/* Seksi 4 — Aktivitas & ICP */}
          <DocSectionHeader no="4" id="AKTIVITAS, PRESTASI, DAN PENGHARGAAN" en="Activities, Achievements, and Rewards"/>
          <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:"'Times New Roman',serif" }}>
            <tbody>
              <tr>
                <td style={{ border:"1px solid #aaa", padding:"5px 8px", fontSize:"9pt", verticalAlign:"top", width:"40px", textAlign:"center", fontWeight:700, background:"#f0f0f0" }}>—</td>
                <td style={{ border:"1px solid #aaa", padding:"5px 8px", fontSize:"9pt", verticalAlign:"top", width:"35%" }}>Kegiatan & Aktivitas Mahasiswa</td>
                <td style={{ border:"1px solid #aaa", padding:"5px 8px", fontSize:"9pt" }}>
                  {mhs.jumlah_kegiatan > 0
                    ? `${mhs.jumlah_kegiatan} kegiatan tercatat (disetujui oleh admin)`
                    : "Belum ada kegiatan yang dicatat"}
                </td>
              </tr>
            </tbody>
          </table>

          {/* ICP */}
          <div style={{ background:"#777", color:"#fff", padding:"3px 9px", fontWeight:700, fontSize:"9pt", marginTop:"8px", display:"flex", gap:"8px" }}>
            <span>2.</span><div>POIN INTEGRITAS / <em>Integrity Credit Points (ICP)</em></div>
          </div>
          <div style={{ background:"#f5f5f5", border:"1px solid #ccc", padding:"5px 10px", margin:"4px 0", fontWeight:600, fontSize:"9pt", fontFamily:"serif" }}>
            Hasil Pencapaian ICP / <em>ICP Performance:</em> <strong>{icpTotal}</strong>
            &nbsp;—&nbsp;
            <span style={{ color: tier.color, fontWeight:700 }}>
              {tier.label}
            </span>
          </div>
          <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:"'Times New Roman',serif" }}>
            <thead>
              <tr>
                <th style={{ border:"1px solid #aaa", padding:"4px 8px", background:"#ddd", fontSize:"9pt", textAlign:"center", width:"40px" }}>No.</th>
                <th style={{ border:"1px solid #aaa", padding:"4px 8px", background:"#ddd", fontSize:"9pt" }}>Kategori</th>
                <th style={{ border:"1px solid #aaa", padding:"4px 8px", background:"#ddd", fontSize:"9pt", textAlign:"center" }}>Pencapaian ICP (Poin)</th>
              </tr>
            </thead>
            <tbody>
              {icp.length > 0 ? icp.map((d, i) => (
                <tr key={d.id_icp}>
                  <td style={{ border:"1px solid #aaa", padding:"4px 8px", fontSize:"9pt", textAlign:"center" }}>{i+1}</td>
                  <td style={{ border:"1px solid #aaa", padding:"4px 8px", fontSize:"9pt" }}>{d.nama_indo}</td>
                  <td style={{ border:"1px solid #aaa", padding:"4px 8px", fontSize:"9pt", textAlign:"center", fontWeight:700 }}>{d.total_poin ?? 0}</td>
                </tr>
              )) : (
                <tr><td colSpan={3} style={{ border:"1px solid #aaa", padding:"8px", textAlign:"center", fontSize:"9pt", color:"#888" }}>Belum ada data ICP</td></tr>
              )}
              <tr style={{ background:"#f0f0f0", fontWeight:700 }}>
                <td colSpan={2} style={{ border:"1px solid #aaa", padding:"4px 8px", fontSize:"9pt", textAlign:"right" }}>Total</td>
                <td style={{ border:"1px solid #aaa", padding:"4px 8px", fontSize:"9pt", textAlign:"center" }}>{icpTotal}</td>
              </tr>
            </tbody>
          </table>

          {/* Pengesahan */}
          <DocSectionHeader no="4" id="PENGESAHAN SKPI" en="SKPI Legalization"/>
          <div style={{ textAlign:"center", padding:"16px 20px", fontFamily:"'Times New Roman',serif" }}>
            <p>Bengkayang, {tgl} / <em>Bengkayang, {tgl}</em></p>
            <div style={{ height:"56px" }}/>
            <p style={{ lineHeight:"1.7" }}>
              <strong>Dr. Helena Anggraeni (Reni) Tondro Sugianto, S.T., M.T.</strong><br/>
              Wakil Rektor I Institut Shanti Bhuana<br/>
              <em>Vice Rector of Academic Affairs — Institute of Shanti Bhuana</em><br/>
              <small style={{ color:"#888" }}>NIDN. 1126107101</small>
            </p>
          </div>
          <div style={{ borderTop:"1px solid #aaa", padding:"8px 10px", fontSize:"8.5pt", fontFamily:"serif", marginTop:"8px" }}>
            <strong>Catatan Resmi</strong>
            <ul style={{ marginLeft:"16px", marginTop:"4px" }}>
              <li>SKPI dikeluarkan oleh institusi pendidikan tinggi yang berwenang mengeluarkan ijazah sesuai dengan peraturan perundang-undangan yang berlaku.</li>
              <li>SKPI hanya diterbitkan setelah mahasiswa dinyatakan lulus dari suatu program studi secara resmi oleh Perguruan Tinggi.</li>
              <li>SKPI diterbitkan dalam Bahasa Indonesia dan Bahasa Inggris.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Helper komponen dokumen ── */
function DocSectionHeader({ no, id, en }) {
  return (
    <div style={{ background:"#555", color:"#fff", padding:"5px 9px", fontWeight:"bold", fontSize:"10pt", margin:"10px 0 0", display:"flex", gap:"8px", fontFamily:"'Times New Roman',serif" }}>
      <span>{no}.</span>
      <div>
        <div>{id}</div>
        <div style={{ fontStyle:"italic", fontWeight:"normal", fontSize:"8.5pt" }}>{en}</div>
      </div>
    </div>
  );
}

function DocRow({ no, id, en, val }) {
  return (
    <tr>
      <td style={{ border:"1px solid #aaa", padding:"4px 7px", width:"40px", textAlign:"center", fontWeight:700, background:"#f0f0f0", fontSize:"9pt", verticalAlign:"middle" }}>{no}</td>
      <td style={{ border:"1px solid #aaa", padding:"4px 7px", width:"35%", fontSize:"9pt", verticalAlign:"top" }}>
        {id}<br/><em style={{ fontSize:"8.5pt", color:"#555" }}>{en}</em>
      </td>
      <td style={{ border:"1px solid #aaa", padding:"4px 7px", fontSize:"9pt", verticalAlign:"top" }}>
        {val.split("\n").map((v,i) => <div key={i}>{v}</div>)}
      </td>
    </tr>
  );
}

/* ══════════════════════════════════════════
   HALAMAN UTAMA
══════════════════════════════════════════ */
export default function GenerateSkpiPage() {
  const [rows, setRows]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState("");
  const [filterProdi, setFilterProdi]   = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterIcp, setFilterIcp]       = useState("Semua");
  const [prodiList, setProdiList] = useState([]);
  const [skpiMap, setSkpiMap]   = useState({}); // id_mahasiswa → skpi data
  const [preview, setPreview]   = useState(null);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const { toasts, add: toast, remove } = useToast();

  /* ── Load prodi list ── */
  useEffect(() => {
    getProdiList().then(list => { if (list) setProdiList(list); });
    document.title = "Generate SKPI | Admin";
  }, []);

  /* ── Load data gabungan mahasiswa + ICP ── */
  const loadData = useCallback(async (q = search, prodi = filterProdi, pg = page) => {
    setLoading(true);
    try {
      const [mhsRes, icpRes] = await Promise.all([
        getMahasiswaList({ q, prodi, page: pg }),
        getIcpSummary({ page: pg }),
      ]);

      if (mhsRes) {
        // Gabungkan data mahasiswa dengan ICP summary
        const icpById = {};
        (icpRes?.rows || []).forEach(r => {
          icpById[r.id_mahasiswa] = r;
        });

        const merged = (mhsRes.rows || []).map(m => {
          const icp = icpById[m.id_mahasiswa];
          return {
            id_mahasiswa:  m.id_mahasiswa,
            nim:           m.nim,
            nama:          m.nama,
            prodi:         m.programstudi?.nama_prodi || "-",
            angkatan:      m.angkatan || "-",
            status_skpi:   m.status_skpi || "belum",
            jumlah_kegiatan: m._count?.kegiatanmahasiswa ?? 0,
            total_poin:    icp?.total_poin ?? 0,
            detail_icp:    icp?.detail_icp ?? [],
            // Fields ekstra untuk SKPI doc
            tempat_lahir:  m.tempat_lahir,
            tgl_lahir:     m.tgl_lahir,
            tgl_masuk:     m.tanggal_masuk,
            tgl_lulus:     m.tanggal_lulus,
            nomor_ijazah:  m.nomor_ijazah,
            gelar:         m.gelar,
            gelar_eng:     m.gelar_eng,
          };
        });

        // Filter ICP lokal
        const filtered = merged.filter(m => {
          if (filterIcp === "Semua") return true;
          if (filterIcp === "Gold")   return m.total_poin >= 200;
          if (filterIcp === "Silver") return m.total_poin >= 150 && m.total_poin < 200;
          if (filterIcp === "Bronze") return m.total_poin >= 100 && m.total_poin < 150;
          if (filterIcp === "Kurang") return m.total_poin < 100;
          if (filterIcp === "Siap")   return m.total_poin >= 100;
          return true;
        }).filter(m => {
          if (filterStatus === "Semua") return true;
          return m.status_skpi === filterStatus;
        });

        setRows(filtered);
        setTotal(mhsRes.total ?? 0);
        setTotalPages(Math.ceil((mhsRes.total ?? 0) / PER_PAGE) || 1);
      }
    } finally {
      setLoading(false);
    }
  }, [search, filterProdi, page, filterIcp, filterStatus]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Load existing SKPI untuk mahasiswa yang ditampilkan ── */
  useEffect(() => {
    if (rows.length === 0) return;
    getSkpiList({ page: 1 }).then(res => {
      if (!res) return;
      const map = {};
      (res.rows || []).forEach(s => { map[s.id_mahasiswa] = s; });
      setSkpiMap(map);
    });
  }, [rows]);

  const searchTimer = useRef(null);
  const handleSearch = val => {
    setSearch(val); setPage(1);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadData(val, filterProdi, 1), 400);
  };

  /* ── Generate SKPI ── */
  const handleGenerate = async () => {
    if (!preview) return;
    if (preview.total_poin < 100) {
      toast("ICP mahasiswa belum memenuhi syarat minimum Bronze (100 poin)", "error");
      return;
    }
    setGenerating(true);
    const res = await generateSkpi(preview.id_mahasiswa);
    setGenerating(false);
    if (res.ok) {
      toast(`SKPI untuk ${preview.nama} berhasil digenerate!`);
      setSkpiMap(prev => ({ ...prev, [preview.id_mahasiswa]: res.data }));
      setRows(prev => prev.map(r =>
        r.id_mahasiswa === preview.id_mahasiswa
          ? { ...r, status_skpi: "diajukan" }
          : r
      ));
      setPreview(prev => ({ ...prev, status_skpi: "diajukan" }));
    } else {
      toast(res.data?.error || "Gagal generate SKPI", "error");
    }
  };

  /* ── Publish SKPI ── */
  const handlePublish = async () => {
    const skpi = skpiMap[preview?.id_mahasiswa];
    if (!skpi) return;
    setPublishing(true);
    const res = await publishSkpi(skpi.id_skpi, "resmi");
    setPublishing(false);
    if (res.ok) {
      toast(`SKPI ${preview.nama} berhasil diterbitkan resmi!`);
      setSkpiMap(prev => ({ ...prev, [preview.id_mahasiswa]: { ...skpi, status: "resmi" } }));
      setRows(prev => prev.map(r =>
        r.id_mahasiswa === preview.id_mahasiswa
          ? { ...r, status_skpi: "diterbitkan" }
          : r
      ));
    } else {
      toast(res.data?.error || "Gagal menerbitkan SKPI", "error");
    }
  };

  /* ── Stats ── */
  const stats = {
    total:       total,
    siap:        rows.filter(r => r.total_poin >= 100).length,
    diterbitkan: rows.filter(r => r.status_skpi === "diterbitkan").length,
    rataIcp:     rows.length ? Math.round(rows.reduce((s, r) => s + r.total_poin, 0) / rows.length) : 0,
  };

  const safePage = Math.min(page, totalPages);

  return (
    <div className={styles.container}>
      <Toasts toasts={toasts} remove={remove}/>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Generate &amp; Penerbitan SKPI</h1>
          <p className={styles.subtitle}>Generate, preview, dan terbitkan SKPI mahasiswa berdasarkan data ICP &amp; kegiatan</p>
        </div>
        <button className={styles.btnRefresh} onClick={() => loadData()} disabled={loading} title="Refresh data">
          <RefreshCw size={14} className={loading ? styles.spin : ""}/>
        </button>
      </div>

      {/* Stat Cards */}
      <div className={styles.statsGrid}>
        {[
          { icon: Users,    label: "Total Mahasiswa", val: total,           color: "#765439", bg: "#fdf4ec" },
          { icon: Award,    label: "Siap Generate",   val: stats.siap,      color: "#16a34a", bg: "#dcfce7" },
          { icon: CheckSquare,label:"Diterbitkan",    val: stats.diterbitkan,color:"#2563eb", bg: "#dbeafe" },
          { icon: TrendingUp,label:"Rata-rata ICP",   val: stats.rataIcp,   color: "#7c3aed", bg: "#ede9fe" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div className={styles.statCard} key={s.label}>
              <div className={styles.statIcon} style={{ background: s.bg, color: s.color }}><Icon size={20}/></div>
              <div className={styles.statInfo}>
                <div className={styles.statValue} style={{ color: s.color }}>{s.val}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Banner ICP */}
      <div className={styles.icpBanner}>
        <Shield size={14}/>
        <span>Syarat generate SKPI: minimal <strong>Bronze Achievement (100 ICP)</strong> &nbsp;|&nbsp;
          🥉 Bronze: 100–149 &nbsp;·&nbsp; 🥈 Silver: 150–199 &nbsp;·&nbsp; 🥇 Gold: ≥200 poin</span>
      </div>

      {/* Filter Bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchBox}>
          <Search size={15} className={styles.searchIco}/>
          <input className={styles.searchInp}
            placeholder="Cari NIM atau nama mahasiswa..."
            value={search} onChange={e => handleSearch(e.target.value)}/>
          {search && <button className={styles.searchClr} onClick={() => handleSearch("")}><X size={13}/></button>}
        </div>
        <div className={styles.filterGroup}>
          <Filter size={13}/>
          {/* Prodi */}
          <select className={styles.filterSelect} value={filterProdi}
            onChange={e => { setFilterProdi(e.target.value); setPage(1); loadData(search, e.target.value, 1); }}>
            <option value="Semua">Semua Prodi</option>
            {prodiList.map(p => <option key={p.id_prodi} value={p.nama_prodi}>{p.nama_prodi}</option>)}
          </select>
          {/* Status SKPI */}
          <select className={styles.filterSelect} value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="Semua">Semua Status</option>
            <option value="belum">Belum Generate</option>
            <option value="diajukan">Sudah Generate</option>
            <option value="diterbitkan">Diterbitkan</option>
          </select>
          {/* ICP Tier */}
          <select className={styles.filterSelect} value={filterIcp}
            onChange={e => { setFilterIcp(e.target.value); setPage(1); }}>
            <option value="Semua">Semua ICP</option>
            <option value="Siap">Siap (≥100)</option>
            <option value="Gold">🥇 Gold (≥200)</option>
            <option value="Silver">🥈 Silver (150–199)</option>
            <option value="Bronze">🥉 Bronze (100–149)</option>
            <option value="Kurang">❌ Belum Memenuhi</option>
          </select>
        </div>
      </div>

      {/* Tabel */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width:52 }}>No.</th>
              <th>Mahasiswa</th>
              <th>Program Studi</th>
              <th style={{ textAlign:"center" }}>Kegiatan</th>
              <th style={{ textAlign:"center" }}>ICP</th>
              <th>Rincian ICP</th>
              <th style={{ textAlign:"center" }}>Status SKPI</th>
              <th style={{ textAlign:"center" }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className={styles.emptyTd}>
                <div className={styles.emptyState}><Loader2 size={30} className={styles.spin}/><p>Memuat data...</p></div>
              </td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className={styles.emptyTd}>
                <div className={styles.emptyState}>
                  <FileText size={42}/><p>Tidak ada data mahasiswa</p>
                  <span>Coba ubah filter</span>
                </div>
              </td></tr>
            ) : rows.map((row, idx) => {
              const tier      = getIcpTier(row.total_poin);
              const TierIcon  = tier.icon;
              const prodiCfg  = getProdiCfg(row.prodi);
              const skpiData  = skpiMap[row.id_mahasiswa];
              const statusCfg = STATUS_SKPI_CFG[row.status_skpi] || STATUS_SKPI_CFG.belum;
              const canGenerate = row.total_poin >= 100 && !skpiData;

              return (
                <tr key={row.id_mahasiswa} className={row.total_poin < 100 ? styles.rowDim : ""}>
                  <td className={styles.tdNo}>{(safePage-1)*PER_PAGE+idx+1}</td>
                  <td>
                    <div className={styles.mhsCell}>
                      {/* Avatar with prodi color */}
                      <div className={styles.avatar} style={{ background: prodiCfg.gradient }}>
                        {row.nama.charAt(0)}
                      </div>
                      <div>
                        <div className={styles.mhsName}>{row.nama}</div>
                        <code className={styles.mhsNim}>{row.nim}</code>
                        <div className={styles.mhsAngkatan}>{row.angkatan}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={styles.prodiBadge}
                      style={{ background: prodiCfg.bg, color: prodiCfg.color, borderColor: prodiCfg.border }}>
                      <span className={styles.prodiDot} style={{ background: prodiCfg.gradient }}>
                        {prodiCfg.label.slice(0,2)}
                      </span>
                      {row.prodi}
                    </span>
                  </td>
                  <td style={{ textAlign:"center" }}>
                    <span className={`${styles.kegiatanBadge} ${row.jumlah_kegiatan > 0 ? styles.kegiatanHas : styles.kegiatanNone}`}>
                      <Activity size={11}/>{row.jumlah_kegiatan}
                    </span>
                  </td>
                  <td style={{ textAlign:"center" }}>
                    <div className={styles.icpCell}>
                      <span className={styles.icpScore} style={{ color: tier.color }}>
                        {row.total_poin}
                      </span>
                      <span className={styles.icpTier}
                        style={{ background: tier.bg, color: tier.color, borderColor: tier.border }}>
                        <TierIcon size={10}/> {tier.label.split(" ")[0]}
                      </span>
                    </div>
                  </td>
                  <td><IcpMiniChart detail={row.detail_icp}/></td>
                  <td style={{ textAlign:"center" }}>
                    <span className={styles.skpiStatus}
                      style={{ background: statusCfg.bg, color: statusCfg.color, borderColor: statusCfg.border }}>
                      {statusCfg.label}
                      {skpiData?.status === "resmi" && <CheckCircle2 size={10} style={{ marginLeft:"3px" }}/>}
                    </span>
                  </td>
                  <td style={{ textAlign:"center" }}>
                    <div className={styles.actionGroup}>
                      <button className={styles.btnPreview}
                        onClick={() => setPreview(row)}
                        title="Preview & Generate SKPI">
                        <Eye size={13}/> Preview
                      </button>
                      {canGenerate && (
                        <button className={styles.btnGen}
                          onClick={async () => {
                            setPreview(row);
                            // Auto-trigger generate jika langsung dari tabel
                          }}
                          title="Generate SKPI">
                          <Zap size={13}/>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <span className={styles.paginInfo}>{total===0?0:(safePage-1)*PER_PAGE+1}–{Math.min(safePage*PER_PAGE,total)} dari {total}</span>
          <div className={styles.paginBtns}>
            <button className={styles.pBtn} onClick={()=>{setPage(1);loadData(search,filterProdi,1);}} disabled={safePage===1}>«</button>
            <button className={styles.pBtn} onClick={()=>{const p=Math.max(1,safePage-1);setPage(p);loadData(search,filterProdi,p);}} disabled={safePage===1}><ChevronLeft size={13}/></button>
            {Array.from({length:totalPages},(_,i)=>i+1)
              .filter(p=>p===1||p===totalPages||Math.abs(p-safePage)<=1)
              .reduce((acc,p,i,arr)=>{if(i>0&&arr[i-1]!==p-1)acc.push("…");acc.push(p);return acc;},[])
              .map((p,i)=>p==="…"?<span key={`d${i}`} className={styles.pDots}>…</span>
                :<button key={p} className={`${styles.pBtn} ${safePage===p?styles.pBtnOn:""}`}
                  onClick={()=>{setPage(p);loadData(search,filterProdi,p);}}>{p}</button>
              )}
            <button className={styles.pBtn} onClick={()=>{const p=Math.min(totalPages,safePage+1);setPage(p);loadData(search,filterProdi,p);}} disabled={safePage===totalPages}><ChevronRight size={13}/></button>
            <button className={styles.pBtn} onClick={()=>{setPage(totalPages);loadData(search,filterProdi,totalPages);}} disabled={safePage===totalPages}>»</button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <PreviewModal
          mhs={preview}
          onClose={() => setPreview(null)}
          onGenerate={handleGenerate}
          onPublish={handlePublish}
          generating={generating}
          publishing={publishing}
          existingSkpi={skpiMap[preview.id_mahasiswa] || null}
        />
      )}
    </div>
  );
}