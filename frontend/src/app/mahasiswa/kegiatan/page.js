"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useMahasiswa } from "@/context/MahasiswaContext";
import {
  Plus, Edit2, Trash2, Upload, FileImage, X, CheckCircle2, AlertCircle,
  Eye, Calendar, MapPin, Building, Award, TrendingUp
} from "lucide-react";
import styles from "./kegiatan.module.css";

// ========== IMPORT MASTER DATA ==========
import { 
  getJenisAktivitas, 
  getKategoriAktivitas, 
  getKelompokAktivitas, 
  getLevelKegiatan, 
  getTingkatPrestasi 
} from "@/lib/masterData";

// ========== MOCK DATA KEGIATAN ==========
const MOCK_KEGIATAN = [
  {
    id: 1,
    nama_id: "Workshop React.js",
    nama_en: "React.js Workshop",
    jenis_aktivitas: "Peningkatan Keterampilan Profesional",
    kategori: "Workshop",
    kelompok: "Akademik",
    level: "Nasional",
    periode: "Semester Genap 2025/2026",
    tingkat_prestasi: "Peserta",
    lokasi: "Kampus TI",
    penyelenggara: "Himpunan Mahasiswa TI",
    tanggal: "2026-03-20",
    status: "Disetujui",
    bukti: "bukti1.pdf",
    created_at: "2026-03-01",
  },
  {
    id: 2,
    nama_id: "Seminar AI",
    nama_en: "AI Seminar",
    jenis_aktivitas: "Prestasi dan Kegiatan",
    kategori: "Seminar",
    kelompok: "Non-Akademik",
    level: "Internasional",
    periode: "Semester Ganjil 2025/2026",
    tingkat_prestasi: "Peserta",
    lokasi: "Online",
    penyelenggara: "Tech Corp",
    tanggal: "2026-03-25",
    status: "Menunggu",
    bukti: null,
    created_at: "2026-03-10",
  },
  {
    id: 3,
    nama_id: "Magang Startup",
    nama_en: "Startup Internship",
    jenis_aktivitas: "Praktik Kerja",
    kategori: "Magang",
    kelompok: "Profesional",
    level: "Lokal",
    periode: "Liburan Semester",
    tingkat_prestasi: "",
    lokasi: "Jakarta",
    penyelenggara: "Startup.id",
    tanggal: "2026-03-10",
    status: "Ditolak",
    bukti: "bukti3.pdf",
    created_at: "2026-02-20",
  },
];

// ========== AMBIL DATA DARI MASTER ==========
const JENIS_AKTIVITAS = getJenisAktivitas();
const KATEGORI_OPTIONS = getKategoriAktivitas();
const KELOMPOK_OPTIONS = getKelompokAktivitas();
const LEVEL_OPTIONS = getLevelKegiatan();
const TINGKAT_PRESTASI = getTingkatPrestasi();

// ========== TOAST COMPONENT ==========
function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div className={`${styles.toast} ${styles[message.type]}`}>
      {message.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      <span>{message.text}</span>
      <button onClick={onClose}><X size={14} /></button>
    </div>
  );
}

// ========== MODAL EDIT KEGIATAN (hanya untuk edit, tidak untuk tambah) ==========
function EditKegiatanModal({ isOpen, onClose, onSave, kegiatan, prodiColor }) {
  const [form, setForm] = useState(
    kegiatan || {
      nama_id: "", nama_en: "", jenis_aktivitas: "", kategori: "", kelompok: "",
      level: "", periode: "", tingkat_prestasi: "", lokasi: "",
      penyelenggara: "", tanggal: "", bukti: null
    }
  );
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef();
  const MAX_SIZE = 2 * 1024 * 1024;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setUploadError("");
    if (!["application/pdf", "image/jpeg", "image/png"].includes(selected.type)) {
      setUploadError("Format harus PDF, JPG, atau PNG");
      return;
    }
    if (selected.size > MAX_SIZE) {
      setUploadError("Ukuran file maksimal 2 MB");
      return;
    }
    setFile(selected);
    if (selected.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(selected);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nama_id || !form.nama_en || !form.jenis_aktivitas || !form.kategori ||
        !form.kelompok || !form.level || !form.periode || !form.lokasi ||
        !form.penyelenggara || !form.tanggal) {
      alert("Lengkapi semua field yang bertanda *");
      return;
    }
    if (!file && !kegiatan?.bukti) {
      alert("Upload bukti kegiatan (wajib)");
      return;
    }
    const newData = { ...form, bukti: file ? file.name : kegiatan.bukti };
    onSave(newData);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setPreviewUrl(null);
      setUploadError("");
    }
    // Reset form saat kegiatan berubah
    if (kegiatan) {
      setForm(kegiatan);
    }
  }, [isOpen, kegiatan]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Edit Kegiatan</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {/* Form sama seperti sebelumnya, hanya untuk edit */}
            <div className={styles.formRow}>
              <input className={styles.input} placeholder="Nama Kegiatan (Indonesia) *" value={form.nama_id} onChange={e => setForm({...form, nama_id: e.target.value})} />
              <input className={styles.input} placeholder="Nama Kegiatan (English) *" value={form.nama_en} onChange={e => setForm({...form, nama_en: e.target.value})} />
            </div>
            <div className={styles.formRow}>
              <select className={styles.input} value={form.jenis_aktivitas} onChange={e => setForm({...form, jenis_aktivitas: e.target.value})}>
                <option value="">Pilih Jenis Aktivitas *</option>
                {JENIS_AKTIVITAS.map(j => <option key={j}>{j}</option>)}
              </select>
              <select className={styles.input} value={form.kategori} onChange={e => setForm({...form, kategori: e.target.value})}>
                <option value="">Pilih Kategori *</option>
                {KATEGORI_OPTIONS.map(k => <option key={k}>{k}</option>)}
              </select>
            </div>
            <div className={styles.formRow}>
              <select className={styles.input} value={form.kelompok} onChange={e => setForm({...form, kelompok: e.target.value})}>
                <option value="">Pilih Kelompok Aktivitas *</option>
                {KELOMPOK_OPTIONS.map(g => <option key={g}>{g}</option>)}
              </select>
              <select className={styles.input} value={form.level} onChange={e => setForm({...form, level: e.target.value})}>
                <option value="">Pilih Level *</option>
                {LEVEL_OPTIONS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div className={styles.formRow}>
              <input className={styles.input} placeholder="Periode (contoh: Semester Ganjil 2025) *" value={form.periode} onChange={e => setForm({...form, periode: e.target.value})} />
              <select className={styles.input} value={form.tingkat_prestasi} onChange={e => setForm({...form, tingkat_prestasi: e.target.value})}>
                <option value="">Tingkat Prestasi (Opsional)</option>
                {TINGKAT_PRESTASI.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className={styles.formRow}>
              <input className={styles.input} placeholder="Lokasi *" value={form.lokasi} onChange={e => setForm({...form, lokasi: e.target.value})} />
              <input className={styles.input} placeholder="Penyelenggara *" value={form.penyelenggara} onChange={e => setForm({...form, penyelenggara: e.target.value})} />
            </div>
            <div className={styles.formRow}>
              <input type="date" className={styles.input} value={form.tanggal} onChange={e => setForm({...form, tanggal: e.target.value})} />
            </div>
            <div className={styles.uploadSection}>
              <div className={styles.uploadArea} style={{ borderColor: prodiColor }} onClick={() => fileRef.current.click()}>
                <input type="file" ref={fileRef} hidden accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
                {file ? (
                  <>
                    {previewUrl ? <img src={previewUrl} alt="preview" className={styles.previewImg} /> : <FileImage size={24} />}
                    <span>{file.name}</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); setPreviewUrl(null); }}><X size={14} /></button>
                  </>
                ) : (
                  <>
                    <Upload size={24} />
                    <span>Upload Bukti Kegiatan (Wajib, maks 2MB, PDF/JPG/PNG)</span>
                  </>
                )}
              </div>
              {uploadError && <p className={styles.errorText}>{uploadError}</p>}
              {kegiatan?.bukti && !file && <p className={styles.infoText}>Bukti saat ini: {kegiatan.bukti}</p>}
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Batal</button>
            <button type="submit" className={styles.saveBtn} style={{ background: prodiColor }}>Update</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ========== HALAMAN UTAMA ==========
export default function KegiatanPage() {
  const { prodiConfig } = useMahasiswa();
  const [kegiatan, setKegiatan] = useState(MOCK_KEGIATAN);
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");

  useEffect(() => {
    document.title = "Kegiatan Saya | Mahasiswa SKPI";
  }, []);

  const showToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveEdit = (data) => {
    setKegiatan(prev => prev.map(k => k.id === editing.id ? { ...k, ...data } : k));
    showToast("Kegiatan berhasil diupdate");
    setModalEditOpen(false);
    setEditing(null);
  };

  const handleDelete = (id) => {
    const item = kegiatan.find(k => k.id === id);
    if (item.status !== "Menunggu") {
      showToast("Hanya kegiatan dengan status 'Menunggu' yang dapat dihapus", "error");
      return;
    }
    if (confirm("Hapus kegiatan ini?")) {
      setKegiatan(prev => prev.filter(k => k.id !== id));
      showToast("Kegiatan dihapus", "error");
    }
  };

  const handleEdit = (k) => {
    if (k.status !== "Menunggu") {
      showToast("Hanya kegiatan dengan status 'Menunggu' yang dapat diedit", "error");
      return;
    }
    setEditing(k);
    setModalEditOpen(true);
  };

  const filtered = kegiatan.filter(k => {
    const matchSearch = k.nama_id.toLowerCase().includes(search.toLowerCase()) || 
                        k.nama_en.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "Semua" || k.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className={styles.container}>
      <Toast message={toast} onClose={() => setToast(null)} />

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Kegiatan Saya</h1>
          <p className={styles.subtitle}>Catat seluruh aktivitas Anda selama masa studi</p>
        </div>
        <Link href="/mahasiswa/kegiatan/tambah-kegiatan" className={styles.addBtn} style={{ background: prodiConfig.primary }}>
          <Plus size={16} /> Tambah Kegiatan
        </Link>
      </div>

      <div className={styles.filterBar}>
        <input 
          type="text" 
          placeholder="Cari kegiatan (Indonesia/Inggris)..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          className={styles.searchInput} 
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={styles.filterSelect}>
          <option value="Semua">Semua Status</option>
          <option value="Menunggu">Menunggu</option>
          <option value="Disetujui">Disetujui</option>
          <option value="Ditolak">Ditolak</option>
          <option value="Revisi">Revisi</option>
        </select>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nama Kegiatan (ID/EN)</th>
              <th>Jenis</th>
              <th>Kategori</th>
              <th>Tanggal</th>
              <th>Status</th>
              <th>Bukti</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(k => (
              <tr key={k.id}>
                <td>
                  <div className={styles.namaCell}>
                    <strong>{k.nama_id}</strong>
                    <small>{k.nama_en}</small>
                  </div>
                </td>
                <td>{k.jenis_aktivitas}</td>
                <td>{k.kategori}</td>
                <td>{k.tanggal}</td>
                <td><span className={`${styles.status} ${styles[k.status.toLowerCase()]}`}>{k.status}</span></td>
                <td>{k.bukti ? <a href="#" className={styles.link}>Lihat</a> : "-"}</td>
                <td className={styles.actions}>
                  <button onClick={() => handleEdit(k)} disabled={k.status !== "Menunggu"} className={styles.actionBtn}>
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(k.id)} disabled={k.status !== "Menunggu"} className={`${styles.actionBtn} ${styles.danger}`}>
                    <Trash2 size={14} />
                  </button>
                </td>
               </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="7" className={styles.emptyRow}>
                  Belum ada kegiatan. Klik "Tambah Kegiatan" untuk mencatat aktivitas Anda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Edit */}
      <EditKegiatanModal
        isOpen={modalEditOpen}
        onClose={() => { setModalEditOpen(false); setEditing(null); }}
        onSave={handleSaveEdit}
        kegiatan={editing}
        prodiColor={prodiConfig.primary}
      />
    </div>
  );
}