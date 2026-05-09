"use client";

import { useEffect, useState, useCallback } from "react";
import { useMahasiswa } from "@/context/MahasiswaContext";
import {
  Send, Download, CheckCircle, AlertCircle, Award,
  Shield, TrendingUp, FileText, Eye, X, Loader2,
  CheckCircle2, Clock, RotateCcw, Star,
  GraduationCap
} from "lucide-react";
import styles from "./pengajuan.module.css";
import { getMahasiswaKegiatan } from "@/lib/api";
import { getProdiTemplate } from "@/lib/prodi-templates";

const TARGET_ICP = 100;

function SkpiPreview({ user, prodiConfig, kegiatanDisetujui, totalICP, tpl, onClose, onPrint }) {
  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const nomorSkpi = `SKPI/${tpl?.kode_prodi || "XX"}/001/I/${new Date().getFullYear()}`;

  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div className={styles.previewOverlay} onClick={onClose}>
      <div className={styles.previewBox} onClick={e => e.stopPropagation()}>
        <div className={styles.previewHeader}>
          <div className={styles.previewHeaderLeft}>
            <div className={styles.previewHeaderIcon} style={{ background: prodiConfig.gradient || prodiConfig.primary }}>
              <FileText size={15} />
            </div>
            <div>
              <h3 className={styles.previewTitle}>Preview SKPI</h3>
              <p className={styles.previewSub}>{user?.prodi} — {user?.nama}</p>
            </div>
          </div>
          <div className={styles.previewHeaderActions}>
            <button className={styles.previewPrintBtn} onClick={onPrint} style={{ background: prodiConfig.primary }}>
              Cetak / PDF
            </button>
            <button className={styles.previewCloseBtn} onClick={onClose}><X size={17} /></button>
          </div>
        </div>
        <div className={styles.previewBody} id="skpi-doc">
          <div className={styles.skpiDoc}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <h2>SURAT KETERANGAN PENDAMPING IJAZAH (SKPI)</h2>
              <h4>INSTITUT SHANTI BHUANA</h4>
              <p>Nomor: {nomorSkpi}</p>
            </div>
            <table className={styles.skpiTable}>
              <tbody>
                <tr><td style={{width: 200}}>Nama Mahasiswa</td><td>{user?.nama || "-"}</td></tr>
                <tr><td>NIM</td><td>{user?.nim || "-"}</td></tr>
                <tr><td>Program Studi</td><td>{user?.prodi || "-"}</td></tr>
                <tr><td>Total ICP</td><td>{totalICP} poin</td></tr>
              </tbody>
            </table>
            <div style={{ marginTop: 30, textAlign: "center" }}>
              <p>Bengkayang, {today}</p>
              <p>Rektor Institut Shanti Bhuana</p>
              <div style={{ marginTop: 30 }} />
              <p>(_____________________)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PengajuanPage() {
  const { user, prodiConfig } = useMahasiswa();

  const [kegiatanDisetujui, setKegiatanDisetujui] = useState([]);
  const [totalICP, setTotalICP] = useState(0);
  const [syaratTerpenuhi, setSyaratTerpenuhi] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("Belum Diajukan");
  const [riwayat, setRiwayat] = useState([]);
  const [message, setMessage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [tpl, setTpl] = useState(null);

  useEffect(() => {
    document.title = "Pengajuan SKPI | Mahasiswa SKPI";
    const savedStatus = localStorage.getItem("skpi_pengajuan_status");
    const savedRiwayat = localStorage.getItem("skpi_pengajuan_riwayat");
    if (savedStatus) setStatus(savedStatus);
    if (savedRiwayat) setRiwayat(JSON.parse(savedRiwayat));
  }, []);

  useEffect(() => {
    if (user?.prodi) setTpl(getProdiTemplate(user.prodi));
  }, [user?.prodi]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await getMahasiswaKegiatan();
      const rows = data?.rows || [];
      const disetujui = rows.filter(k => k.status === "Disetujui" || k.status_verifikasi === "disetujui");
      setKegiatanDisetujui(disetujui);
      setTotalICP(0);
      setSyaratTerpenuhi(false);
      setLoading(false);
    })();
  }, []);

  const showMsg = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleAjukan = useCallback(async () => {
    if (status !== "Belum Diajukan") return;
    if (!syaratTerpenuhi) {
      showMsg(`Syarat ICP belum terpenuhi. Target ${TARGET_ICP} poin.`, "error");
      return;
    }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    const tanggal = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    const newStatus = "Diproses";
    const newRiwayat = [{ tanggal, status: newStatus, icp: totalICP }, ...riwayat];
    setStatus(newStatus);
    setRiwayat(newRiwayat);
    localStorage.setItem("skpi_pengajuan_status", newStatus);
    localStorage.setItem("skpi_pengajuan_riwayat", JSON.stringify(newRiwayat));
    showMsg("Pengajuan SKPI berhasil dikirim! Menunggu verifikasi admin.");
    setSubmitting(false);
  }, [status, syaratTerpenuhi, totalICP, riwayat]);

  const handlePrint = () => window.print();

  const progressPct = Math.min(100, Math.round((totalICP / TARGET_ICP) * 100));
  const stCfg = {
    "Belum Diajukan": { color: "#6b7280", bg: "#f3f4f6", icon: <Clock size={14} /> },
    "Diproses": { color: "#d97706", bg: "#fef3c7", icon: <Loader2 size={14} className={styles.spin} /> },
    "Selesai": { color: "#16a34a", bg: "#dcfce7", icon: <CheckCircle2 size={14} /> },
  }[status] || { color: "#6b7280", bg: "#f3f4f6", icon: <Clock size={14} /> };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Pengajuan SKPI</h1>
          <p className={styles.sub}>Ajukan Surat Keterangan Pendamping Ijazah</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnPreview} style={{ borderColor: prodiConfig.primary, color: prodiConfig.primary }} onClick={() => setShowPreview(true)}>
            <Eye size={14} /> Preview SKPI
          </button>
        </div>
      </div>

      {tpl && (
        <div className={styles.prodiCard} style={{ borderLeft: `4px solid ${prodiConfig.primary}` }}>
          <GraduationCap size={16} style={{ color: prodiConfig.primary }} />
          <div>
            <strong style={{ color: prodiConfig.primary }}>{tpl.nama}</strong>
            <span className={styles.prodiDetail}> — {tpl.gelar}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className={styles.loadingWrap}>
          <Loader2 size={28} className={styles.spin} style={{ color: prodiConfig.primary }} />
          <span>Memuat data...</span>
        </div>
      ) : (
        <>
          <div className={styles.statsGrid}>
            <div className={styles.statCard} style={{ borderTop: `3px solid ${prodiConfig.primary}` }}>
              <div className={styles.statIcon} style={{ background: `${prodiConfig.primary}14` }}>
                <Award size={20} style={{ color: prodiConfig.primary }} />
              </div>
              <div>
                <span className={styles.statVal} style={{ color: prodiConfig.primary }}>{kegiatanDisetujui.length}</span>
                <span className={styles.statLbl}>Kegiatan Disetujui</span>
              </div>
            </div>
            <div className={styles.statCard} style={{ borderTop: `3px solid ${prodiConfig.primary}` }}>
              <div className={styles.statIcon} style={{ background: `${prodiConfig.primary}14` }}>
                <TrendingUp size={20} style={{ color: prodiConfig.primary }} />
              </div>
              <div>
                <span className={styles.statVal} style={{ color: prodiConfig.primary }}>{totalICP}</span>
                <span className={styles.statLbl}>Total Poin ICP</span>
              </div>
            </div>
            <div className={styles.statCard} style={{ borderTop: `3px solid ${syaratTerpenuhi ? "#16a34a" : "#dc2626"}` }}>
              <div className={styles.statIcon} style={{ background: syaratTerpenuhi ? "#dcfce7" : "#fee2e2" }}>
                <Shield size={20} style={{ color: syaratTerpenuhi ? "#16a34a" : "#dc2626" }} />
              </div>
              <div>
                <span className={styles.statVal} style={{ color: syaratTerpenuhi ? "#16a34a" : "#dc2626" }}>
                  {syaratTerpenuhi ? "✓ Terpenuhi" : `Kurang ${TARGET_ICP - totalICP}`}
                </span>
                <span className={styles.statLbl}>Syarat ICP (≥ {TARGET_ICP})</span>
              </div>
            </div>
            <div className={styles.statCard} style={{ borderTop: `3px solid #f59e0b` }}>
              <div className={styles.statIcon} style={{ background: "#fef3c7" }}>
                <Star size={20} style={{ color: "#b45309" }} />
              </div>
              <div>
                <span className={styles.statVal}>—</span>
                <span className={styles.statLbl}>Integrasi Data</span>
              </div>
            </div>
          </div>

          <div className={styles.progressCard}>
            <div className={styles.progressTop}>
              <span className={styles.progressTitle}>Progress ICP</span>
              <span className={styles.progressVal} style={{ color: prodiConfig.primary }}>{totalICP} / {TARGET_ICP} poin ({progressPct}%)</span>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progressPct}%`, background: prodiConfig.primary }} />
            </div>
            <p className={styles.progressNote}>
              {syaratTerpenuhi ? "✅ Syarat ICP terpenuhi — kamu siap mengajukan SKPI!" : "⚠️ Poin ICP akan diperbarui setelah data kegiatan diverifikasi."}
            </p>
          </div>

          <div className={styles.statusCard} style={{ borderColor: stCfg.color }}>
            <div className={styles.statusTop}>
              <div className={styles.statusLeft}>
                <span className={styles.statusLabel}>Status Pengajuan</span>
                <span className={styles.statusVal} style={{ background: stCfg.bg, color: stCfg.color }}>
                  {stCfg.icon} {status}
                </span>
              </div>
              {status === "Belum Diajukan" && (
                <button className={styles.btnAjukan} style={{ background: syaratTerpenuhi ? prodiConfig.primary : "#d5bfaf" }} onClick={handleAjukan} disabled={submitting || !syaratTerpenuhi}>
                  {submitting ? <><Loader2 size={15} className={styles.spin} /> Memproses…</> : <><Send size={15} /> Ajukan SKPI</>}
                </button>
              )}
              {(status === "Selesai" || status === "Disetujui") && (
                <button className={styles.btnDownload} style={{ borderColor: prodiConfig.primary, color: prodiConfig.primary }} onClick={() => setShowPreview(true)}>
                  <Download size={15} /> Unduh SKPI
                </button>
              )}
            </div>
          </div>

          <div className={styles.syaratCard}>
            <h3 className={styles.syaratTitle}><CheckCircle size={15} /> Persyaratan Pengajuan SKPI</h3>
            <div className={styles.syaratList}>
              {[
                { ok: syaratTerpenuhi, text: `Minimal ${TARGET_ICP} poin ICP (poin saat ini: ${totalICP})` },
                { ok: kegiatanDisetujui.length > 0, text: "Minimal 1 kegiatan berstatus Disetujui" },
                { ok: !!user?.nim && !!user?.nama, text: "Data profil (NIM, nama, prodi) sudah lengkap" },
                { ok: !!tpl, text: `Template SKPI untuk prodi ${user?.prodi} tersedia` },
              ].map((s, i) => (
                <div key={i} className={styles.syaratItem}>
                  <span className={`${styles.syaratDot} ${s.ok ? styles.syaratOk : styles.syaratNo}`}>
                    {s.ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                  </span>
                  <span style={{ color: s.ok ? "#3d2006" : "#9e7b5e" }}>{s.text}</span>
                </div>
              ))}
            </div>
          </div>

          {riwayat.length > 0 && (
            <div className={styles.riwayatCard}>
              <h3 className={styles.riwayatTitle}><RotateCcw size={14} /> Riwayat Pengajuan</h3>
              <div className={styles.riwayatList}>
                {riwayat.map((r, i) => (
                  <div key={i} className={styles.riwayatItem}>
                    <span className={styles.riwayatDot} style={{ background: prodiConfig.primary }} />
                    <div>
                      <span className={styles.riwayatStatus}>{r.status}</span>
                      <span className={styles.riwayatTgl}>{r.tanggal}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {message && (
        <div className={`${styles.toast} ${message.type === "success" ? styles.toastOk : styles.toastErr}`}>
          {message.type === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)}><X size={13} /></button>
        </div>
      )}

      {showPreview && <SkpiPreview user={user} prodiConfig={prodiConfig} kegiatanDisetujui={kegiatanDisetujui} totalICP={totalICP} tpl={tpl} onClose={() => setShowPreview(false)} onPrint={handlePrint} />}
    </div>
  );
}