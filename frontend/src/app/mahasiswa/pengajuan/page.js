"use client";

import { useEffect, useState, useCallback } from "react";
import { useMahasiswa } from "@/context/MahasiswaContext";
import { getMahasiswaKegiatan, getMahasiswaIcp, getPengajuanStatus, submitPengajuanSkpi } from "@/lib/api";
import {
  Send, CheckCircle, AlertCircle, Award, Shield,
  RefreshCw, History, ClipboardCheck, FileCheck,
  Trophy, Medal, TrendingUp,
} from "lucide-react";
import styles from "./pengajuan.module.css";

const MIN_ICP = 100;

const STATUS_MAP = {
  menunggu:  "Diproses",
  disetujui: "Selesai",
  ditolak:   "Ditolak",
};

function getIcpLevel(poin) {
  if (poin >= 200) return { label: "Gold",   color: "#ca8a04", bg: "#fef9c3", border: "#fde047", Icon: Trophy };
  if (poin >= 150) return { label: "Silver", color: "#2563eb", bg: "#dbeafe", border: "#93c5fd", Icon: Medal  };
  if (poin >= 100) return { label: "Bronze", color: "#92400e", bg: "#fef3c7", border: "#fcd34d", Icon: Award  };
  return { label: "Belum Memenuhi", color: "#dc2626", bg: "#fee2e2", border: "#fca5a5", Icon: AlertCircle };
}

export default function PengajuanPage() {
  const { prodiConfig } = useMahasiswa();

  const [pengajuan, setPengajuan]   = useState(null);
  const [kegiatan,  setKegiatan]    = useState([]);
  const [icpData,   setIcpData]     = useState({ total_poin: 0, detail: [] });
  const [loading,   setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message,    setMessage]    = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dataKeg, dataPengajuan, dataIcp] = await Promise.all([
        getMahasiswaKegiatan(),
        getPengajuanStatus(),
        getMahasiswaIcp(),
      ]);
      setKegiatan(dataKeg?.rows ?? []);
      setPengajuan(dataPengajuan);
      setIcpData(dataIcp ?? { total_poin: 0, detail: [] });
    } catch {
      setKegiatan([]);
      setPengajuan(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Pengajuan SKPI | Mahasiswa SKPI";
    loadData();
  }, [loadData]);

  const kegiatanDisetujui = kegiatan.filter(k => k.status_verifikasi === "disetujui");
  const icpTotal          = icpData.total_poin ?? 0;
  const icpLevel          = getIcpLevel(icpTotal);
  const IcpIcon           = icpLevel.Icon;

  const syaratKegiatan  = kegiatanDisetujui.length >= 1;
  const syaratIcp       = icpTotal >= MIN_ICP;
  const syaratTerpenuhi = syaratKegiatan && syaratIcp;

  const displayStatus = pengajuan
    ? (STATUS_MAP[pengajuan.status_pengajuan] ?? pengajuan.status_pengajuan)
    : "Belum Diajukan";

  const canSubmit = !pengajuan || pengajuan.status_pengajuan === "ditolak";

  const showMsg = (text, type = "success") => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleAjukan = async () => {
    if (!canSubmit) return;
    if (!syaratTerpenuhi) {
      if (!syaratKegiatan && !syaratIcp)
        showMsg("Belum ada kegiatan disetujui dan total ICP belum mencapai 100 poin.", "error");
      else if (!syaratKegiatan)
        showMsg("Minimal 1 kegiatan harus disetujui admin sebelum mengajukan SKPI.", "error");
      else
        showMsg(`Total ICP Anda ${icpTotal} poin. Minimal 100 poin (Bronze) untuk mengajukan SKPI.`, "error");
      return;
    }
    setSubmitting(true);
    const res = await submitPengajuanSkpi();
    setSubmitting(false);
    if (res.ok) {
      showMsg("Pengajuan SKPI berhasil dikirim! Menunggu verifikasi admin.");
      await loadData();
    } else {
      showMsg(res.data?.error || "Gagal mengirim pengajuan.", "error");
    }
  };

  const totalKegiatan = kegiatan.length;
  const totalRevisi   = kegiatan.filter(k => k.status_verifikasi === "revisi").length;
  const totalMenunggu = kegiatan.filter(k => k.status_verifikasi === "diproses").length;

  const step1Done = syaratTerpenuhi;
  const step2Done = step1Done && (pengajuan?.status_pengajuan === "menunggu" || pengajuan?.status_pengajuan === "disetujui");
  const step3Done = step2Done && pengajuan?.status_pengajuan === "disetujui";

  const icpPct = Math.min(100, Math.round((icpTotal / MIN_ICP) * 100));

  return (
    <div className={styles.container}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerBadge}><Send size={18}/></div>
          <div>
            <h1 className={styles.title}>Pengajuan SKPI</h1>
            <p className={styles.subtitle}>Ajukan Surat Keterangan Pendamping Ijazah setelah memenuhi syarat</p>
          </div>
        </div>
        <button className={styles.refreshIconBtn} onClick={loadData} disabled={loading} title="Refresh data">
          <RefreshCw size={15} className={loading ? styles.spinIcon : ""}/>
        </button>
      </div>

      {/* ── 4 Stat Cards ── */}
      <div className={styles.statsGrid} style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className={`${styles.statCard} ${styles.statCardGreen}`}>
          <div className={`${styles.statAccent} ${styles.accentGreen}`}/>
          <div className={`${styles.statIconWrap} ${styles.iconGreen}`}><Award size={18}/></div>
          <div className={styles.statBody}>
            <span className={styles.statValue}>{loading ? "—" : kegiatanDisetujui.length}</span>
            <span className={styles.statLabel}>Kegiatan Disetujui</span>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCardAmber}`}>
          <div className={`${styles.statAccent} ${styles.accentAmber}`}/>
          <div className={`${styles.statIconWrap} ${styles.iconAmber}`}><History size={18}/></div>
          <div className={styles.statBody}>
            <span className={styles.statValue}>{loading ? "—" : totalMenunggu}</span>
            <span className={styles.statLabel}>Menunggu Verifikasi</span>
          </div>
        </div>

        {/* ICP stat card */}
        <div className={styles.statCard}
          style={{ borderLeft: "4px solid transparent", outline: `1px solid ${icpLevel.border}` }}>
          <div className={styles.statAccent} style={{ background: icpLevel.color }}/>
          <div className={styles.statIconWrap} style={{ background: icpLevel.bg, color: icpLevel.color }}>
            <IcpIcon size={18}/>
          </div>
          <div className={styles.statBody}>
            <span className={styles.statValue} style={{ color: icpLevel.color }}>
              {loading ? "—" : icpTotal}
            </span>
            <span className={styles.statLabel}>Total Poin ICP</span>
          </div>
        </div>

        <div className={`${styles.statCard} ${syaratTerpenuhi ? styles.statCardGreen : styles.statCardRed}`}>
          <div className={`${styles.statAccent} ${syaratTerpenuhi ? styles.accentGreen : styles.accentRed}`}/>
          <div className={`${styles.statIconWrap} ${syaratTerpenuhi ? styles.iconGreen : styles.iconRed}`}>
            <Shield size={18}/>
          </div>
          <div className={styles.statBody}>
            <span className={`${styles.statValue} ${syaratTerpenuhi ? styles.valGreen : styles.valRed}`}>
              {loading ? "—" : syaratTerpenuhi ? "Terpenuhi" : "Belum"}
            </span>
            <span className={styles.statLabel}>Syarat Pengajuan</span>
          </div>
        </div>
      </div>

      {/* ── Step Indicator ── */}
      <div className={styles.stepCard}>
        <h3 className={styles.stepCardTitle}>Alur Pengajuan SKPI</h3>
        <div className={styles.stepsRow}>
          <div className={styles.stepItem}>
            <div className={`${styles.stepCircle} ${step1Done ? styles.stepDone : styles.stepPending}`}>
              {step1Done ? <CheckCircle size={16}/> : <span>1</span>}
            </div>
            <span className={`${styles.stepLabel} ${step1Done ? styles.stepLabelDone : ""}`}>Persyaratan</span>
          </div>
          <div className={`${styles.stepLine} ${step2Done ? styles.stepLineDone : ""}`}/>
          <div className={styles.stepItem}>
            <div className={`${styles.stepCircle} ${step2Done ? styles.stepDone : styles.stepPending}`}>
              {step2Done ? <ClipboardCheck size={16}/> : <span>2</span>}
            </div>
            <span className={`${styles.stepLabel} ${step2Done ? styles.stepLabelDone : ""}`}>Pengajuan Dikirim</span>
          </div>
          <div className={`${styles.stepLine} ${step3Done ? styles.stepLineDone : ""}`}/>
          <div className={styles.stepItem}>
            <div className={`${styles.stepCircle} ${step3Done ? styles.stepDone : styles.stepPending}`}>
              {step3Done ? <FileCheck size={16}/> : <span>3</span>}
            </div>
            <span className={`${styles.stepLabel} ${step3Done ? styles.stepLabelDone : ""}`}>SKPI Terbit</span>
          </div>
        </div>

        <div className={styles.stepFooter}>
          <div className={styles.statusRow}>
            <span className={styles.statusLabel}>Status Pengajuan</span>
            <span className={`${styles.statusBadge}
              ${displayStatus === "Diproses" ? styles.badgeAmber
              : displayStatus === "Selesai"  ? styles.badgeGreen
              : displayStatus === "Ditolak"  ? styles.badgeRed
              : styles.badgeNeutral}`}>
              {loading ? "Memuat…" : displayStatus}
            </span>
          </div>

          {pengajuan?.catatan_admin && (
            <div className={styles.catatanBox}>
              <AlertCircle size={14}/>
              <span>Catatan Admin: {pengajuan.catatan_admin}</span>
            </div>
          )}

          {!loading && displayStatus === "Diproses" && !syaratTerpenuhi && (
            <div className={styles.catatanBox} style={{ borderColor: "#fca5a5", background: "#fff5f5", color: "#b91c1c" }}>
              <AlertCircle size={14}/>
              <span>
                Pengajuan Anda dikirim namun persyaratan belum lengkap
                {!syaratIcp ? ` (ICP ${icpTotal} poin, minimal 100 poin)` : ""}
                . Hubungi admin untuk klarifikasi.
              </span>
            </div>
          )}

          {!loading && displayStatus === "Diproses" && syaratTerpenuhi && (
            <p className={styles.processingNote}>
              Pengajuan sedang diproses oleh admin. Pantau status secara berkala.
            </p>
          )}

          {!loading && displayStatus === "Selesai" && (
            <div className={styles.successNote}>
              <CheckCircle size={14}/>
              <span>SKPI telah diterbitkan. Lihat di halaman Riwayat untuk mengunduh.</span>
            </div>
          )}

          {!loading && canSubmit && !syaratTerpenuhi && (
            <div className={styles.syaratBelumTerpenuhi}>
              <AlertCircle size={13}/>
              <span>
                {!syaratKegiatan && !syaratIcp
                  ? "Belum ada kegiatan yang disetujui dan total ICP belum mencapai 100 poin."
                  : !syaratKegiatan
                  ? "Minimal 1 kegiatan harus disetujui admin sebelum dapat mengajukan SKPI."
                  : `Total ICP Anda ${icpTotal} poin — minimal 100 poin (Bronze) untuk mengajukan SKPI.`}
              </span>
            </div>
          )}

          {!loading && canSubmit && (
            <button
              className={`${styles.ajukanBtn} ${!syaratTerpenuhi ? styles.ajukanBtnLocked : ""}`}
              onClick={handleAjukan}
              disabled={submitting}>
              {submitting
                ? <><RefreshCw size={15} className={styles.spinIcon}/> Memproses…</>
                : <><Send size={15}/> Ajukan SKPI</>}
            </button>
          )}
        </div>
      </div>

      {/* ── Progress Cards Row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

        {/* Kegiatan progress */}
        <div className={styles.progressCard}>
          <div className={styles.progressHeader}>
            <span className={styles.progressTitle}>Kegiatan Terverifikasi</span>
            <span className={styles.progressFraction}>{kegiatanDisetujui.length} / {totalKegiatan}</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill}
              style={{ width: totalKegiatan > 0 ? `${Math.round((kegiatanDisetujui.length / totalKegiatan) * 100)}%` : "0%" }}/>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
            <span className={styles.reqIcon}
              style={{ background: syaratKegiatan ? "#dcfce7" : "#fee2e2", color: syaratKegiatan ? "#047857" : "#b91c1c", width: 22, height: 22, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              {syaratKegiatan ? <CheckCircle size={13}/> : <AlertCircle size={13}/>}
            </span>
            <p className={styles.progressNote} style={{ margin: 0 }}>
              {syaratKegiatan
                ? "Syarat kegiatan terpenuhi"
                : "Minimal 1 kegiatan harus disetujui admin"}
            </p>
          </div>
          {totalRevisi > 0 && (
            <div className={styles.revisiWarning}>
              <AlertCircle size={13}/>
              <span>{totalRevisi} kegiatan perlu direvisi</span>
            </div>
          )}
        </div>

        {/* ICP progress */}
        <div className={styles.progressCard}>
          <div className={styles.progressHeader}>
            <span className={styles.progressTitle}>
              <TrendingUp size={13} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }}/>
              Total Poin ICP
            </span>
            <span className={styles.progressFraction}
              style={{ color: icpLevel.color, fontWeight: 700 }}>
              {icpTotal} / {MIN_ICP} poin
            </span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill}
              style={{ width: `${icpPct}%`, background: icpLevel.color, transition: "width 0.5s ease" }}/>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className={styles.reqIcon}
                style={{ background: syaratIcp ? "#dcfce7" : "#fee2e2", color: syaratIcp ? "#047857" : "#b91c1c", width: 22, height: 22, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                {syaratIcp ? <CheckCircle size={13}/> : <AlertCircle size={13}/>}
              </span>
              <p className={styles.progressNote} style={{ margin: 0 }}>
                {syaratIcp ? "Syarat ICP terpenuhi" : `Kurang ${MIN_ICP - icpTotal} poin lagi`}
              </p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
              background: icpLevel.bg, color: icpLevel.color, border: `1px solid ${icpLevel.border}` }}>
              <IcpIcon size={10} style={{ display: "inline", marginRight: 3 }}/>{icpLevel.label}
            </span>
          </div>
          {!loading && icpTotal === 0 && (
            <div className={styles.revisiWarning} style={{ marginTop: 8 }}>
              <AlertCircle size={13}/>
              <span>Poin ICP belum tersedia. Hubungi admin untuk verifikasi ICP.</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Requirements Card ── */}
      <div className={styles.reqCard}>
        <div className={styles.reqHeader}>
          <ClipboardCheck size={16}/>
          <h3 className={styles.reqTitle}>Persyaratan Pengajuan SKPI</h3>
        </div>
        <div className={styles.reqList}>
          <div className={styles.reqItem}>
            <span className={`${styles.reqIcon} ${syaratKegiatan ? styles.reqIconGreen : styles.reqIconAmber}`}>
              {syaratKegiatan ? <CheckCircle size={15}/> : <AlertCircle size={15}/>}
            </span>
            <span>Minimal <strong>1 kegiatan</strong> berstatus <strong>Disetujui</strong> oleh admin
              {" "}
              <span style={{ color: syaratKegiatan ? "#047857" : "#b45309", fontWeight: 700 }}>
                ({kegiatanDisetujui.length} terpenuhi)
              </span>
            </span>
          </div>
          <div className={styles.reqItem}>
            <span className={`${styles.reqIcon} ${syaratIcp ? styles.reqIconGreen : styles.reqIconAmber}`}>
              {syaratIcp ? <CheckCircle size={15}/> : <AlertCircle size={15}/>}
            </span>
            <span>Total ICP minimal <strong>100 poin</strong> (Bronze Achievement)
              {" "}
              <span style={{ color: syaratIcp ? "#047857" : "#b45309", fontWeight: 700 }}>
                ({icpTotal} poin)
              </span>
            </span>
          </div>
          <div className={styles.reqItem}>
            <span className={`${styles.reqIcon} ${styles.reqIconGreen}`}><CheckCircle size={15}/></span>
            <span>Data profil (NIM, nama, prodi) sudah lengkap</span>
          </div>
          <div className={styles.reqItem}>
            <span className={`${styles.reqIcon} ${styles.reqIconAmber}`}><Shield size={15}/></span>
            <span>Pengajuan akan diverifikasi oleh admin. Pantau status di halaman ini.</span>
          </div>
          <div className={styles.reqItem}>
            <span className={`${styles.reqIcon} ${styles.reqIconAmber}`}><RefreshCw size={15}/></span>
            <span>Jika pengajuan ditolak, Anda dapat mengajukan kembali setelah melengkapi persyaratan.</span>
          </div>
        </div>
      </div>

      {/* ── Toast ── */}
      {message && (
        <div className={`${styles.toast} ${message.type === "success" ? styles.toastSuccess : styles.toastError}`}>
          {message.type === "success" ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
          <span>{message.text}</span>
          <button className={styles.toastClose} onClick={() => setMessage(null)}>×</button>
        </div>
      )}
    </div>
  );
}
