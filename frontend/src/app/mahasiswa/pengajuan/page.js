"use client";

import { useEffect, useState, useCallback } from "react";
import { useMahasiswa } from "@/context/MahasiswaContext";
import { getMahasiswaKegiatan, getPengajuanStatus, submitPengajuanSkpi } from "@/lib/api";
import {
  Send, CheckCircle, AlertCircle, Award, Shield,
  RefreshCw, History, ClipboardCheck, FileCheck,
} from "lucide-react";
import styles from "./pengajuan.module.css";

const STATUS_MAP = {
  menunggu:  "Diproses",
  disetujui: "Selesai",
  ditolak:   "Ditolak",
};

export default function PengajuanPage() {
  const { prodiConfig } = useMahasiswa();

  const [pengajuan, setPengajuan]   = useState(null);
  const [kegiatan, setKegiatan]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage]       = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dataKeg, dataPengajuan] = await Promise.all([
        getMahasiswaKegiatan(),
        getPengajuanStatus(),
      ]);
      setKegiatan(dataKeg?.rows ?? []);
      setPengajuan(dataPengajuan);
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
  const syaratTerpenuhi   = kegiatanDisetujui.length >= 1;

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
      showMsg("Syarat belum terpenuhi: minimal 1 kegiatan harus disetujui.", "error");
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
  const step2Done = pengajuan?.status_pengajuan === "menunggu" || pengajuan?.status_pengajuan === "disetujui";
  const step3Done = pengajuan?.status_pengajuan === "disetujui";

  return (
    <div className={styles.container}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerBadge}>
            <Send size={18} />
          </div>
          <div>
            <h1 className={styles.title}>Pengajuan SKPI</h1>
            <p className={styles.subtitle}>
              Ajukan Surat Keterangan Pendamping Ijazah setelah memenuhi syarat
            </p>
          </div>
        </div>
        <button
          className={styles.refreshIconBtn}
          onClick={loadData}
          disabled={loading}
          title="Refresh data"
        >
          <RefreshCw size={15} className={loading ? styles.spinIcon : ""} />
        </button>
      </div>

      {/* ── 3 Stat Cards ── */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statCardGreen}`}>
          <div className={`${styles.statAccent} ${styles.accentGreen}`} />
          <div className={`${styles.statIconWrap} ${styles.iconGreen}`}>
            <Award size={18} />
          </div>
          <div className={styles.statBody}>
            <span className={styles.statValue}>{loading ? "—" : kegiatanDisetujui.length}</span>
            <span className={styles.statLabel}>Kegiatan Disetujui</span>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCardAmber}`}>
          <div className={`${styles.statAccent} ${styles.accentAmber}`} />
          <div className={`${styles.statIconWrap} ${styles.iconAmber}`}>
            <History size={18} />
          </div>
          <div className={styles.statBody}>
            <span className={styles.statValue}>{loading ? "—" : totalMenunggu}</span>
            <span className={styles.statLabel}>Menunggu Verifikasi</span>
          </div>
        </div>

        <div className={`${styles.statCard} ${syaratTerpenuhi ? styles.statCardGreen : styles.statCardRed}`}>
          <div className={`${styles.statAccent} ${syaratTerpenuhi ? styles.accentGreen : styles.accentRed}`} />
          <div className={`${styles.statIconWrap} ${syaratTerpenuhi ? styles.iconGreen : styles.iconRed}`}>
            <Shield size={18} />
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
              {step1Done ? <CheckCircle size={16} /> : <span>1</span>}
            </div>
            <span className={`${styles.stepLabel} ${step1Done ? styles.stepLabelDone : ""}`}>
              Persyaratan
            </span>
          </div>
          <div className={`${styles.stepLine} ${step2Done ? styles.stepLineDone : ""}`} />
          <div className={styles.stepItem}>
            <div className={`${styles.stepCircle} ${step2Done ? styles.stepDone : styles.stepPending}`}>
              {step2Done ? <ClipboardCheck size={16} /> : <span>2</span>}
            </div>
            <span className={`${styles.stepLabel} ${step2Done ? styles.stepLabelDone : ""}`}>
              Pengajuan Dikirim
            </span>
          </div>
          <div className={`${styles.stepLine} ${step3Done ? styles.stepLineDone : ""}`} />
          <div className={styles.stepItem}>
            <div className={`${styles.stepCircle} ${step3Done ? styles.stepDone : styles.stepPending}`}>
              {step3Done ? <FileCheck size={16} /> : <span>3</span>}
            </div>
            <span className={`${styles.stepLabel} ${step3Done ? styles.stepLabelDone : ""}`}>
              SKPI Terbit
            </span>
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
              <AlertCircle size={14} />
              <span>Catatan Admin: {pengajuan.catatan_admin}</span>
            </div>
          )}

          {!loading && displayStatus === "Diproses" && (
            <p className={styles.processingNote}>
              Pengajuan sedang diproses oleh admin. Pantau status secara berkala.
            </p>
          )}

          {!loading && displayStatus === "Selesai" && (
            <div className={styles.successNote}>
              <CheckCircle size={14} />
              <span>SKPI telah diterbitkan. Lihat di halaman Riwayat untuk mengunduh.</span>
            </div>
          )}

          {!loading && canSubmit && (
            <button
              className={styles.ajukanBtn}
              onClick={handleAjukan}
              disabled={submitting || !syaratTerpenuhi}
            >
              {submitting
                ? <><RefreshCw size={15} className={styles.spinIcon} /> Memproses…</>
                : <><Send size={15} /> Ajukan SKPI</>}
            </button>
          )}
        </div>
      </div>

      {/* ── Progress Card ── */}
      <div className={styles.progressCard}>
        <div className={styles.progressHeader}>
          <span className={styles.progressTitle}>Kegiatan Terverifikasi</span>
          <span className={styles.progressFraction}>
            {kegiatanDisetujui.length} / {totalKegiatan} kegiatan
          </span>
        </div>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{
              width: totalKegiatan > 0
                ? `${Math.round((kegiatanDisetujui.length / totalKegiatan) * 100)}%`
                : "0%",
            }}
          />
        </div>
        <p className={styles.progressNote}>
          {syaratTerpenuhi
            ? "Syarat terpenuhi — kamu dapat mengajukan SKPI."
            : "Belum ada kegiatan yang disetujui. Ajukan kegiatan dan tunggu verifikasi admin."}
        </p>
        {totalRevisi > 0 && (
          <div className={styles.revisiWarning}>
            <AlertCircle size={13} />
            <span>{totalRevisi} kegiatan perlu direvisi — perbaiki agar dapat disetujui.</span>
          </div>
        )}
      </div>

      {/* ── Requirements Card ── */}
      <div className={styles.reqCard}>
        <div className={styles.reqHeader}>
          <ClipboardCheck size={16} />
          <h3 className={styles.reqTitle}>Persyaratan Pengajuan SKPI</h3>
        </div>
        <div className={styles.reqList}>
          <div className={styles.reqItem}>
            <span className={`${styles.reqIcon} ${styles.reqIconGreen}`}>
              <CheckCircle size={15} />
            </span>
            <span>Minimal <strong>1 kegiatan</strong> harus berstatus <strong>Disetujui</strong></span>
          </div>
          <div className={styles.reqItem}>
            <span className={`${styles.reqIcon} ${styles.reqIconGreen}`}>
              <CheckCircle size={15} />
            </span>
            <span>Data profil (NIM, nama, prodi) sudah lengkap</span>
          </div>
          <div className={styles.reqItem}>
            <span className={`${styles.reqIcon} ${styles.reqIconAmber}`}>
              <Shield size={15} />
            </span>
            <span>Pengajuan akan diverifikasi oleh admin. Pantau status di halaman ini dan di Riwayat.</span>
          </div>
          <div className={styles.reqItem}>
            <span className={`${styles.reqIcon} ${styles.reqIconAmber}`}>
              <RefreshCw size={15} />
            </span>
            <span>Jika pengajuan ditolak, Anda dapat mengajukan kembali setelah melengkapi persyaratan.</span>
          </div>
        </div>
      </div>

      {/* ── Toast ── */}
      {message && (
        <div className={`${styles.toast} ${message.type === "success" ? styles.toastSuccess : styles.toastError}`}>
          {message.type === "success"
            ? <CheckCircle size={16} />
            : <AlertCircle size={16} />}
          <span>{message.text}</span>
          <button className={styles.toastClose} onClick={() => setMessage(null)}>×</button>
        </div>
      )}

    </div>
  );
}
