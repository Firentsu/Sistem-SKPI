"use client";

import { useEffect, useState, useCallback } from "react";
import { useMahasiswa } from "@/context/MahasiswaContext";
import {
  Send, CheckCircle, AlertCircle, Award, Shield,
  TrendingUp, Loader2, CheckCircle2, Clock, RotateCcw, Star,
  GraduationCap,
} from "lucide-react";
import styles from "./pengajuan.module.css";
import { getMahasiswaKegiatan } from "@/lib/api";
import { getProdiTemplate } from "@/lib/prodi-templates";

/* ─────────────────────────────────────────
   KONSTANTA
───────────────────────────────────────── */
const TARGET_ICP = 100;

// Bobot poin sementara (nanti akan diintegrasikan dengan sistem lain)
const BOBOT_ICP = {
  prestasi:     { "Kampus / Internal": 8,  "Lokal / Regional": 12, "Nasional": 18, "Internasional": 25 },
  keterampilan: { "Kampus / Internal": 5,  "Lokal / Regional": 8,  "Nasional": 12, "Internasional": 15 },
  organisasi:   { "Kampus / Internal": 10, "Lokal / Regional": 12, "Nasional": 15, "Internasional": 18 },
  intelektual:  { "Kampus / Internal": 6,  "Lokal / Regional": 10, "Nasional": 14, "Internasional": 20 },
  praktik:      { "Kampus / Internal": 10, "Lokal / Regional": 12, "Nasional": 15, "Internasional": 20 },
};

function hitungPoin(k) {
  const bobot = BOBOT_ICP[k.kategori_skpi];
  if (!bobot) return 10;
  return bobot[k.level] || bobot["Kampus / Internal"] || 10;
}

function getICPLevel(total) {
  if (total >= 200) return { label: "Gold Achievement",   color: "#b45309", bg: "#fef9c3", icon: "🥇" };
  if (total >= 150) return { label: "Silver Achievement", color: "#6b7280", bg: "#f3f4f6", icon: "🥈" };
  if (total >= 100) return { label: "Bronze Achievement", color: "#92400e", bg: "#fef3c7", icon: "🥉" };
  return { label: "Belum Mencapai Target", color: "#dc2626", bg: "#fee2e2", icon: "⚠️" };
}

/* ─────────────────────────────────────────
   HALAMAN UTAMA
───────────────────────────────────────── */
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
  const [tpl, setTpl] = useState(null);

  // Load status & riwayat dari localStorage
  useEffect(() => {
    document.title = "Pengajuan SKPI | Mahasiswa SKPI";
    const savedStatus  = localStorage.getItem("skpi_pengajuan_status");
    const savedRiwayat = localStorage.getItem("skpi_pengajuan_riwayat");
    if (savedStatus)  setStatus(savedStatus);
    if (savedRiwayat) setRiwayat(JSON.parse(savedRiwayat));
  }, []);

  // Load template prodi
  useEffect(() => {
    if (!user?.prodi) return;
    const t = getProdiTemplate(user.prodi);
    setTpl(t);
  }, [user?.prodi]);

  // Load kegiatan mahasiswa & hitung ICP sementara
  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await getMahasiswaKegiatan();
      const rows = data?.rows || [];
      const disetujui = rows.filter(k =>
        k.status === "Disetujui" || k.status_verifikasi === "disetujui"
      ).map(k => ({
        kategori_skpi: k.kategori_skpi || "",
        level: k.levelkegiatan?.nama_level || "",
      }));
      setKegiatanDisetujui(disetujui);
      const icp = disetujui.reduce((sum, k) => sum + hitungPoin(k), 0);
      setTotalICP(icp);
      setSyaratTerpenuhi(icp >= TARGET_ICP);
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
      showMsg(`Syarat ICP belum terpenuhi. Kamu butuh ${TARGET_ICP - totalICP} poin lagi.`, "error");
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

  const progressPct = Math.min(100, Math.round((totalICP / TARGET_ICP) * 100));
  const icpLevel = getICPLevel(totalICP);
  const STATUS_CFG = {
    "Belum Diajukan": { color: "#6b7280", bg: "#f3f4f6", icon: <Clock size={14} /> },
    "Diproses":       { color: "#d97706", bg: "#fef3c7", icon: <Loader2 size={14} className={styles.spin} /> },
    "Disetujui":      { color: "#16a34a", bg: "#dcfce7", icon: <CheckCircle2 size={14} /> },
    "Selesai":        { color: "#16a34a", bg: "#dcfce7", icon: <CheckCircle2 size={14} /> },
    "Ditolak":        { color: "#dc2626", bg: "#fee2e2", icon: <AlertCircle size={14} /> },
  };
  const stCfg = STATUS_CFG[status] || STATUS_CFG["Belum Diajukan"];

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Pengajuan SKPI</h1>
          <p className={styles.sub}>Ajukan Surat Keterangan Pendamping Ijazah setelah memenuhi syarat ICP</p>
        </div>
        {/* Tombol preview dihapus */}
      </div>

      {/* Info Prodi */}
      {tpl && (
        <div className={styles.prodiCard} style={{ borderLeft: `4px solid ${prodiConfig.primary}` }}>
          <GraduationCap size={15} style={{ color: prodiConfig.primary, flexShrink: 0 }} />
          <div>
            <strong style={{ color: prodiConfig.primary }}>{tpl.nama}</strong>
            <span className={styles.prodiDetail}>
              &nbsp;—&nbsp;{tpl.gelar} · KKNI Level {tpl.level_kkni} · {tpl.jenjang}
            </span>
          </div>
        </div>
      )}

      {loading ? (
        <div className={styles.loadingWrap}>
          <Loader2 size={28} className={styles.spin} style={{ color: prodiConfig.primary }} />
          <span>Memuat data kegiatan…</span>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard} style={{ borderTop: `3px solid ${prodiConfig.primary}` }}>
              <div className={styles.statIcon} style={{ background: `${prodiConfig.primary}14` }}>
                <Award size={20} style={{ color: prodiConfig.primary }} />
              </div>
              <div>
                <span className={styles.statVal} style={{ color: prodiConfig.primary }}>
                  {kegiatanDisetujui.length}
                </span>
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
                <span className={styles.statLbl}>Syarat ICP ≥ {TARGET_ICP}</span>
              </div>
            </div>
            <div className={styles.statCard} style={{ borderTop: `3px solid ${icpLevel.color}` }}>
              <div className={styles.statIcon} style={{ background: icpLevel.bg }}>
                <Star size={20} style={{ color: icpLevel.color }} />
              </div>
              <div>
                <span className={styles.statVal} style={{ color: icpLevel.color, fontSize: 14 }}>
                  {icpLevel.icon} {icpLevel.label}
                </span>
                <span className={styles.statLbl}>Level ICP</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className={styles.progressCard}>
            <div className={styles.progressTop}>
              <span className={styles.progressTitle}>Progress ICP menuju SKPI</span>
              <span className={styles.progressVal} style={{ color: prodiConfig.primary }}>
                {totalICP} / {TARGET_ICP} poin ({progressPct}%)
              </span>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progressPct}%`, background: prodiConfig.primary }} />
            </div>
            <p className={styles.progressNote} style={{ color: syaratTerpenuhi ? "#16a34a" : "#9e7b5e" }}>
              {syaratTerpenuhi
                ? "✅ Syarat ICP terpenuhi — kamu siap mengajukan SKPI!"
                : `⚠️ Tambahkan ${TARGET_ICP - totalICP} poin lagi untuk memenuhi syarat.`}
            </p>
          </div>

          {/* Status & Tombol Ajukan */}
          <div className={styles.statusCard} style={{ borderColor: stCfg.color }}>
            <div className={styles.statusTop}>
              <div className={styles.statusLeft}>
                <span className={styles.statusLabel}>Status Pengajuan</span>
                <span className={styles.statusVal} style={{ background: stCfg.bg, color: stCfg.color }}>
                  {stCfg.icon} {status}
                </span>
              </div>
              {status === "Belum Diajukan" && (
                <button
                  className={styles.btnAjukan}
                  style={{
                    background: syaratTerpenuhi ? prodiConfig.primary : "#d5bfaf",
                    cursor: syaratTerpenuhi ? "pointer" : "not-allowed",
                  }}
                  onClick={handleAjukan}
                  disabled={submitting || !syaratTerpenuhi}
                >
                  {submitting ? (
                    <><Loader2 size={15} className={styles.spin} /> Memproses…</>
                  ) : (
                    <><Send size={15} /> Ajukan SKPI</>
                  )}
                </button>
              )}
            </div>
            {!syaratTerpenuhi && status === "Belum Diajukan" && (
              <p className={styles.statusNote}>
                ⚠️ Tambahkan kegiatan dan kumpulkan minimal {TARGET_ICP} poin ICP terlebih dahulu.
              </p>
            )}
            {status === "Diproses" && (
              <p className={styles.statusNote} style={{ color: "#d97706" }}>
                ⏳ Pengajuanmu sedang diproses oleh admin. Pantau halaman ini secara berkala.
              </p>
            )}
          </div>

          {/* Persyaratan */}
          <div className={styles.syaratCard}>
            <h3 className={styles.syaratTitle}><CheckCircle size={14} /> Persyaratan Pengajuan SKPI</h3>
            <div className={styles.syaratList}>
              {[
                { ok: syaratTerpenuhi,             text: `Minimal ${TARGET_ICP} poin ICP (poin kamu: ${totalICP})` },
                { ok: kegiatanDisetujui.length > 0, text: "Minimal 1 kegiatan berstatus Disetujui" },
                { ok: !!user?.nim && !!user?.nama,  text: "Data profil (NIM, nama, prodi) sudah lengkap" },
                { ok: !!tpl,                        text: `Template SKPI prodi ${user?.prodi} tersedia` },
              ].map((s, i) => (
                <div key={i} className={styles.syaratItem}>
                  <span className={`${styles.syaratDot} ${s.ok ? styles.syaratOk : styles.syaratNo}`}>
                    {s.ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                  </span>
                  <span style={{ color: s.ok ? "#3d2006" : "#9e7b5e" }}>{s.text}</span>
                </div>
              ))}
            </div>
            <p className={styles.syaratNote}>
              📌 Setelah diajukan, SKPI akan diverifikasi oleh admin. Hasil verifikasi ditampilkan di halaman ini.
            </p>
          </div>

          {/* Riwayat Pengajuan */}
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
                      {r.icp && <span className={styles.riwayatIcp}>{r.icp} poin ICP</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Toast */}
      {message && (
        <div className={`${styles.toast} ${message.type === "success" ? styles.toastOk : styles.toastErr}`}>
          {message.type === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)}><X size={13} /></button>
        </div>
      )}
    </div>
  );
}