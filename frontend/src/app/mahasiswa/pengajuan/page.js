"use client";

import { useEffect, useState } from "react";
import { useMahasiswa } from "@/context/MahasiswaContext";
import { Send, Download, History, CheckCircle, AlertCircle } from "lucide-react";
import styles from "./pengajuan.module.css";

export default function PengajuanPage() {
  const { user, prodiConfig } = useMahasiswa();
  const [status, setStatus] = useState("Belum Diajukan"); // Belum Diajukan, Diproses, Selesai
  const [riwayat, setRiwayat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

        // Set document title
  useEffect(() => {
    document.title = "Dashboard Pengajuan | Mahasiswa SKPI";
  }, []);

  const handleAjukan = () => {
    if (status !== "Belum Diajukan") return;
    setLoading(true);
    setTimeout(() => {
      setStatus("Diproses");
      setRiwayat(prev => [{ tanggal: new Date().toLocaleDateString(), status: "Diproses" }, ...prev]);
      setMessage("Pengajuan SKPI berhasil dikirim, menunggu verifikasi admin.");
      setLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }, 1500);
  };

  const handleDownload = () => {
    alert("Download SKPI (simulasi)");
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Pengajuan SKPI</h1>

      <div className={styles.statusCard} style={{ borderColor: prodiConfig.primary }}>
        <div className={styles.statusHeader}>
          <span className={styles.statusLabel}>Status Pengajuan:</span>
          <span className={`${styles.statusValue} ${styles[status.toLowerCase().replace(" ", "")]}`} style={{ color: prodiConfig.primary }}>
            {status}
          </span>
        </div>
        {status === "Belum Diajukan" && (
          <button className={styles.ajukanBtn} onClick={handleAjukan} disabled={loading} style={{ background: prodiConfig.primary }}>
            {loading ? "Memproses..." : <><Send size={16} /> Ajukan SKPI</>}
          </button>
        )}
        {status === "Selesai" && (
          <button className={styles.downloadBtn} onClick={handleDownload} style={{ borderColor: prodiConfig.primary, color: prodiConfig.primary }}>
            <Download size={16} /> Download SKPI
          </button>
        )}
      </div>

      {message && <div className={styles.toast} style={{ background: prodiConfig.primary }}>{message}</div>}

      <div className={styles.riwayatCard}>
        <h3><History size={18} /> Riwayat Pengajuan</h3>
        {riwayat.length === 0 ? (
          <p>Belum ada pengajuan SKPI.</p>
        ) : (
          <table className={styles.table}>
            <thead><tr><th>Tanggal</th><th>Status</th></tr></thead>
            <tbody>
              {riwayat.map((r, idx) => (
                <tr key={idx}><td>{r.tanggal}</td><td>{r.status}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.infoCard}>
        <h3><CheckCircle size={18} /> Persyaratan SKPI</h3>
        <ul>
          <li>Minimal 100 poin ICP</li>
          <li>Semua kegiatan wajib telah disetujui</li>
          <li>Mengisi data profil lengkap</li>
        </ul>
      </div>
    </div>
  );
}