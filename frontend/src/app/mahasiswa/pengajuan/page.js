"use client";

import { useEffect, useState, useCallback } from "react";
import { useMahasiswa } from "@/context/MahasiswaContext";
import { Send, Download, History, CheckCircle, AlertCircle, Award, Shield, TrendingUp } from "lucide-react";
import styles from "./pengajuan.module.css";

// Hitung total ICP (bobot sementara: setiap kegiatan disetujui = 10 poin)
const hitungTotalICP = (kegiatan) => {
  const disetujui = kegiatan.filter(k => k.status === "Disetujui");
  return disetujui.length * 10;
};

export default function PengajuanPage() {
  const { user, prodiConfig, kegiatan } = useMahasiswa();
  const [status, setStatus] = useState("Belum Diajukan");
  const [riwayat, setRiwayat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [totalICP, setTotalICP] = useState(0);
  const [kegiatanDisetujui, setKegiatanDisetujui] = useState([]);
  const [syaratTerpenuhi, setSyaratTerpenuhi] = useState(false);

  // Load status dari localStorage (simulasi)
  useEffect(() => {
    const savedStatus = localStorage.getItem("skpi_pengajuan_status");
    const savedRiwayat = localStorage.getItem("skpi_pengajuan_riwayat");
    if (savedStatus) setStatus(savedStatus);
    if (savedRiwayat) setRiwayat(JSON.parse(savedRiwayat));
    document.title = "Pengajuan SKPI | Mahasiswa SKPI";
  }, []);

  // Hitung kegiatan dan ICP
  useEffect(() => {
    if (!kegiatan) return;
    const disetujui = kegiatan.filter(k => k.status === "Disetujui");
    setKegiatanDisetujui(disetujui);
    const icp = hitungTotalICP(kegiatan);
    setTotalICP(icp);
    setSyaratTerpenuhi(icp >= 100);
  }, [kegiatan]);

  const handleAjukan = useCallback(() => {
    if (status !== "Belum Diajukan") return;
    if (!syaratTerpenuhi) {
      setMessage({ type: "error", text: "Syarat ICP belum terpenuhi (minimal 100 poin)." });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const newStatus = "Diproses";
      const newRiwayat = [{ tanggal: new Date().toLocaleDateString(), status: newStatus }, ...riwayat];
      setStatus(newStatus);
      setRiwayat(newRiwayat);
      localStorage.setItem("skpi_pengajuan_status", newStatus);
      localStorage.setItem("skpi_pengajuan_riwayat", JSON.stringify(newRiwayat));
      setMessage({ type: "success", text: "Pengajuan SKPI berhasil dikirim! Menunggu verifikasi admin." });
      setLoading(false);
      setTimeout(() => setMessage(null), 4000);
    }, 1500);
  }, [status, syaratTerpenuhi, riwayat]);

  const handleDownload = () => {
    alert("Fitur download SKPI akan tersedia setelah pengajuan disetujui.");
  };

  const targetICP = 100;
  const progressICP = Math.min(100, Math.floor((totalICP / targetICP) * 100));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Pengajuan SKPI</h1>
        <p className={styles.subtitle}>Ajukan Surat Keterangan Pendamping Ijazah setelah memenuhi syarat</p>
      </div>

      {/* Ringkasan */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard} style={{ borderColor: prodiConfig.primary }}>
          <div className={styles.summaryIcon}><Award size={24} style={{ color: prodiConfig.primary }} /></div>
          <div className={styles.summaryInfo}>
            <span className={styles.summaryValue}>{kegiatanDisetujui.length}</span>
            <span className={styles.summaryLabel}>Kegiatan Disetujui</span>
          </div>
        </div>
        <div className={styles.summaryCard} style={{ borderColor: prodiConfig.primary }}>
          <div className={styles.summaryIcon}><TrendingUp size={24} style={{ color: prodiConfig.primary }} /></div>
          <div className={styles.summaryInfo}>
            <span className={styles.summaryValue}>{totalICP}</span>
            <span className={styles.summaryLabel}>Poin ICP</span>
          </div>
        </div>
        <div className={styles.summaryCard} style={{ borderColor: prodiConfig.primary }}>
          <div className={styles.summaryIcon}><Shield size={24} style={{ color: prodiConfig.primary }} /></div>
          <div className={styles.summaryInfo}>
            <span className={styles.summaryValue}>{syaratTerpenuhi ? "✓ Terpenuhi" : "Belum"}</span>
            <span className={styles.summaryLabel}>Syarat ICP (≥100)</span>
          </div>
        </div>
      </div>

      {/* Progress ICP */}
      <div className={styles.progressCard}>
        <div className={styles.progressHeader}>
          <span>Progress ICP</span>
          <span>{totalICP} / {targetICP} poin</span>
        </div>
        <div className={styles.progressBarTrack}>
          <div className={styles.progressBarFill} style={{ width: `${progressICP}%`, background: prodiConfig.primary }} />
        </div>
        <p className={styles.progressNote}>
          {syaratTerpenuhi
            ? "✅ Syarat ICP terpenuhi, kamu dapat mengajukan SKPI."
            : "⚠️ Masih perlu mencapai 100 poin ICP untuk dapat mengajukan SKPI."}
        </p>
      </div>

      {/* Status & tombol */}
      <div className={styles.statusCard} style={{ borderColor: prodiConfig.primary }}>
        <div className={styles.statusHeader}>
          <span className={styles.statusLabel}>Status Pengajuan:</span>
          <span className={`${styles.statusValue} ${styles[status.toLowerCase().replace(/\s/g, "")]}`} style={{ color: prodiConfig.primary }}>
            {status}
          </span>
        </div>
        {status === "Belum Diajukan" && (
          <button className={styles.ajukanBtn} onClick={handleAjukan} disabled={loading || !syaratTerpenuhi} style={{ background: prodiConfig.primary }}>
            {loading ? "Memproses..." : <><Send size={16} /> Ajukan SKPI</>}
          </button>
        )}
        {status === "Selesai" && (
          <button className={styles.downloadBtn} onClick={handleDownload} style={{ borderColor: prodiConfig.primary, color: prodiConfig.primary }}>
            <Download size={16} /> Download SKPI
          </button>
        )}
      </div>

      {/* Toast */}
      {message && (
        <div className={`${styles.toast} ${message.type === "success" ? styles.toastSuccess : styles.toastError}`}>
          {message.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      {/* Riwayat */}
      <div className={styles.riwayatCard}>
        <h3><History size={18} /> Riwayat Pengajuan</h3>
        {riwayat.length === 0 ? (
          <p className={styles.emptyRiwayat}>Belum ada pengajuan SKPI.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {riwayat.map((r, idx) => (
                  <tr key={idx}>
                    <td>{r.tanggal}</td>
                    <td className={styles.statusCell}>{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info persyaratan */}
      <div className={styles.infoCard}>
        <h3><CheckCircle size={18} /> Persyaratan SKPI</h3>
        <ul>
          <li>✅ Minimal <strong>100 poin ICP</strong> (Integrity Credit Points)</li>
          <li>✅ Semua kegiatan yang diajukan harus berstatus <strong>Disetujui</strong></li>
          <li>✅ Data profil (NIM, nama, prodi) sudah lengkap</li>
          <li>📌 Pengajuan akan diverifikasi oleh admin. Status dapat dilihat di halaman ini.</li>
        </ul>
      </div>
    </div>
  );
}