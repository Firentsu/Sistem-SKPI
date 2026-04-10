"use client";

import { useState } from "react";
import { useMahasiswa } from "@/context/MahasiswaContext";
import { Eye, FileText, Search } from "lucide-react";
import styles from "./riwayat.module.css";

// Mock data riwayat (bisa dari API)
const MOCK_RIWAYAT = [
  { id: 1, nama: "Workshop React", jenis: "Workshop", tanggal: "2026-03-20", poin: 15, status: "Disetujui", catatan: "-" },
  { id: 2, nama: "Seminar AI", jenis: "Seminar", tanggal: "2026-03-25", poin: 10, status: "Ditolak", catatan: "Bukti kurang jelas" },
  { id: 3, nama: "Magang Startup", jenis: "Magang", tanggal: "2026-03-10", poin: 20, status: "Revisi", catatan: "Lengkapi surat keterangan" },
];

export default function RiwayatPage() {
  const { prodiConfig } = useMahasiswa();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = MOCK_RIWAYAT.filter(r => r.nama.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Riwayat Kegiatan</h1>
      <div className={styles.searchBar}>
        <Search size={16} />
        <input type="text" placeholder="Cari kegiatan..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr><th>Nama Kegiatan</th><th>Jenis</th><th>Tanggal</th><th>Poin</th><th>Status</th><th>Aksi</th></tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id}>
                <td><strong>{r.nama}</strong></td>
                <td>{r.jenis}</td>
                <td>{r.tanggal}</td>
                <td>{r.poin}</td>
                <td><span className={`${styles.status} ${styles[r.status.toLowerCase()]}`}>{r.status}</span></td>
                <td><button className={styles.detailBtn} onClick={() => setSelected(r)}><Eye size={14} /> Detail</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className={styles.modalOverlay} onClick={() => setSelected(null)}>
          <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
            <h3>Detail Kegiatan</h3>
            <p><strong>Nama:</strong> {selected.nama}</p>
            <p><strong>Jenis:</strong> {selected.jenis}</p>
            <p><strong>Tanggal:</strong> {selected.tanggal}</p>
            <p><strong>Poin:</strong> {selected.poin}</p>
            <p><strong>Status:</strong> {selected.status}</p>
            {selected.catatan && <p><strong>Catatan:</strong> {selected.catatan}</p>}
            <button onClick={() => setSelected(null)}>Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}