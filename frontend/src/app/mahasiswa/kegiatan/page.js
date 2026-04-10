"use client";

import { useState, useRef } from "react";
import { useMahasiswa } from "@/context/MahasiswaContext";
import { Plus, Edit2, Trash2, Upload, FileImage, X, CheckCircle2, AlertCircle } from "lucide-react";
import styles from "./kegiatan.module.css";

// Mock data kegiatan
const MOCK_KEGIATAN = [
  { id: 1, nama: "Workshop React", jenis: "Workshop", kategori: "Akademik", tanggal: "2026-03-20", poin: 15, status: "Disetujui", bukti: "bukti1.pdf" },
  { id: 2, nama: "Seminar AI", jenis: "Seminar", kategori: "Non-Akademik", tanggal: "2026-03-25", poin: 10, status: "Menunggu", bukti: null },
  { id: 3, nama: "Magang Startup", jenis: "Magang", kategori: "Profesional", tanggal: "2026-03-10", poin: 20, status: "Ditolak", bukti: "bukti3.pdf" },
];

const JENIS_OPTIONS = ["Workshop", "Seminar", "Kompetisi", "Training", "Magang", "Organisasi", "Lainnya"];
const KATEGORI_OPTIONS = ["Akademik", "Non-Akademik", "Profesional", "Pengembangan Diri"];

function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div className={styles.toast}>
      {message.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      <span>{message.text}</span>
      <button onClick={onClose}><X size={14} /></button>
    </div>
  );
}

function KegiatanModal({ isOpen, onClose, onSave, kegiatan, prodiColor }) {
  const [form, setForm] = useState(kegiatan || { nama: "", jenis: "", kategori: "", tanggal: "", poin: "", bukti: null });
  const [file, setFile] = useState(null);
  const fileRef = useRef();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nama || !form.jenis || !form.kategori || !form.tanggal || !form.poin) {
      alert("Lengkapi semua field wajib");
      return;
    }
    onSave({ ...form, bukti: file ? file.name : kegiatan?.bukti });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{kegiatan ? "Edit Kegiatan" : "Tambah Kegiatan"}</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <input className={styles.input} placeholder="Nama Kegiatan *" value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} />
            <select className={styles.input} value={form.jenis} onChange={e => setForm({...form, jenis: e.target.value})}>
              <option value="">Pilih Jenis *</option>
              {JENIS_OPTIONS.map(j => <option key={j}>{j}</option>)}
            </select>
            <select className={styles.input} value={form.kategori} onChange={e => setForm({...form, kategori: e.target.value})}>
              <option value="">Pilih Kategori *</option>
              {KATEGORI_OPTIONS.map(k => <option key={k}>{k}</option>)}
            </select>
            <input type="date" className={styles.input} value={form.tanggal} onChange={e => setForm({...form, tanggal: e.target.value})} />
            <input type="number" className={styles.input} placeholder="Poin *" value={form.poin} onChange={e => setForm({...form, poin: e.target.value})} />
            <div className={styles.uploadArea} style={{ borderColor: prodiColor }} onClick={() => fileRef.current.click()}>
              <input type="file" ref={fileRef} hidden onChange={e => setFile(e.target.files[0])} />
              {file ? <><FileImage size={24} /> {file.name}</> : <><Upload size={24} /> Upload Bukti (PDF/JPG)</>}
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Batal</button>
            <button type="submit" className={styles.saveBtn} style={{ background: prodiColor }}>Simpan</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function KegiatanPage() {
  const { prodiConfig } = useMahasiswa();
  const [kegiatan, setKegiatan] = useState(MOCK_KEGIATAN);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = (data) => {
    if (editing) {
      setKegiatan(prev => prev.map(k => k.id === editing.id ? { ...k, ...data } : k));
      showToast("Kegiatan berhasil diupdate");
    } else {
      const newId = Math.max(...kegiatan.map(k => k.id), 0) + 1;
      setKegiatan(prev => [{ id: newId, status: "Menunggu", ...data }, ...prev]);
      showToast("Kegiatan berhasil ditambahkan");
    }
    setModalOpen(false);
    setEditing(null);
  };

  const handleDelete = (id) => {
    if (confirm("Hapus kegiatan ini?")) {
      setKegiatan(prev => prev.filter(k => k.id !== id));
      showToast("Kegiatan dihapus", "error");
    }
  };

  const handleEdit = (k) => {
    setEditing(k);
    setModalOpen(true);
  };

  return (
    <div className={styles.container}>
      <Toast message={toast} onClose={() => setToast(null)} />
      <div className={styles.header}>
        <h1 className={styles.title}>Kegiatan Saya</h1>
        <button className={styles.addBtn} onClick={() => { setEditing(null); setModalOpen(true); }} style={{ background: prodiConfig.primary }}>
          <Plus size={16} /> Tambah Kegiatan
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr><th>Nama Kegiatan</th><th>Jenis</th><th>Kategori</th><th>Tanggal</th><th>Poin</th><th>Status</th><th>Bukti</th><th>Aksi</th></tr>
          </thead>
          <tbody>
            {kegiatan.map(k => (
              <tr key={k.id}>
                <td><strong>{k.nama}</strong></td>
                <td>{k.jenis}</td>
                <td>{k.kategori}</td>
                <td>{k.tanggal}</td>
                <td>{k.poin}</td>
                <td><span className={`${styles.status} ${styles[k.status.toLowerCase()]}`}>{k.status}</span></td>
                <td>{k.bukti ? <a href="#" className={styles.link}>Lihat</a> : "-"}</td>
                <td className={styles.actions}>
                  <button onClick={() => handleEdit(k)} disabled={k.status !== "Menunggu"} className={styles.actionBtn}><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(k.id)} disabled={k.status !== "Menunggu"} className={`${styles.actionBtn} ${styles.danger}`}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <KegiatanModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} onSave={handleSave} kegiatan={editing} prodiColor={prodiConfig.primary} />
    </div>
  );
}