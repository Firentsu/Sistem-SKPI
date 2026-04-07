"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, Plus, Upload, Download, Edit2, KeyRound,
  ToggleLeft, ToggleRight, ChevronLeft, ChevronRight,
  X, Check, AlertCircle, Users, FileSpreadsheet,
  GraduationCap, Activity, Filter, MoreVertical,
  Eye, EyeOff, RefreshCw, CheckCircle2, XCircle,
  TrendingUp, Award, ChevronDown, Trash2, UserCheck,
  UserX, Mail, Calendar, BookOpen, Shield
} from "lucide-react";
import styles from "./page.module.css";

/* ------------------------------------------------------------------
  CONSTANTS & MOCK DATA (sementara, nanti diganti dengan API)
------------------------------------------------------------------ */
const PER_PAGE = 10;
const PRODI_LIST = ["Semua", "Teknik Informatika", "Manajemen", "Akuntansi", "Sistem Informasi", "Ilmu Komunikasi"];
const ANGKATAN_LIST = ["Semua", "2025", "2024", "2023", "2022", "2021", "2020"];
const STATUS_SKPI = ["Semua", "Belum", "Proses", "Selesai"];

// Generate mock data (untuk demo)
function generateMock() {
  const prodiList = PRODI_LIST.filter(p => p !== "Semua");
  const statusList = ["Belum", "Proses", "Selesai"];
  const names = [
    "Andi Pratama", "Budi Santoso", "Citra Dewi", "Dian Pertiwi", "Eko Wibowo",
    "Fitri Handayani", "Galuh Pramesti", "Hendra Kusuma", "Indah Permata", "Joko Widodo",
    "Kartika Sari", "Luthfi Hakim", "Maya Sari", "Nando Pratama", "Oktavia Putri",
    "Prima Yudha", "Riani Astuti", "Surya Darma", "Tania Lestari", "Umar Said",
    "Vera Kusuma", "Wahyu Ramadan", "Xena Pratiwi", "Yoga Santoso", "Zahra Nadia",
  ];
  return names.map((nama, i) => ({
    id: i + 1,
    nama,
    nim: `20${String(20 + (i % 5)).slice(-2)}${String(1001 + i).padStart(6, "0")}`,
    id_prodi: prodiList[i % prodiList.length],
    angkatan: String(2019 + (i % 6)),
    email: `${nama.split(" ")[0].toLowerCase()}@student.isb.ac.id`,
    status_skpi: statusList[i % statusList.length],
    jumlah_kegiatan: Math.floor(Math.random() * 25) + 1,
    total_icp: Math.floor(Math.random() * 180) + 20,
    aktif: i % 7 !== 0,
  }));
}

let MOCK_DATA = generateMock();

/* ------------------------------------------------------------------
  KOMPONEN TOAST NOTIFIKASI
------------------------------------------------------------------ */
function Toast({ toasts, remove }) {
  return (
    <div className={styles.toastStack}>
      {toasts.map((t) => (
        <div key={t.id} className={`${styles.toast} ${styles[`toast_${t.type}`]}`}>
          {t.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{t.msg}</span>
          <button onClick={() => remove(t.id)} className={styles.toastClose}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);
  const remove = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);
  return { toasts, add, remove };
}

/* ------------------------------------------------------------------
  BADGE STATUS SKPI
------------------------------------------------------------------ */
function StatusBadge({ status }) {
  const config = {
    Selesai: { label: "Selesai", class: styles.badgeSelesai, icon: <CheckCircle2 size={12} /> },
    Proses: { label: "Proses", class: styles.badgeProses, icon: <RefreshCw size={12} /> },
    Belum: { label: "Belum", class: styles.badgeBelum, icon: <AlertCircle size={12} /> },
  };
  const { label, class: cls, icon } = config[status] || config.Belum;
  return (
    <span className={`${styles.badge} ${cls}`}>
      {icon}
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------
  STAT CARD (untuk dashboard kecil)
------------------------------------------------------------------ */
function StatCard({ icon: Icon, title, value, subtitle, color }) {
  return (
    <div className={`${styles.statCard} ${styles[`stat_${color}`]}`}>
      <div className={styles.statIcon}>
        <Icon size={22} />
      </div>
      <div className={styles.statContent}>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statTitle}>{title}</div>
        {subtitle && <div className={styles.statSub}>{subtitle}</div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
  MODAL TAMBAH / EDIT MAHASISWA
------------------------------------------------------------------ */
function MahasiswaFormModal({ mode, data, onClose, onSave }) {
  const initial = data || {
    nama: "", nim: "", id_prodi: PRODI_LIST[1], angkatan: "2024",
    email: "", status_skpi: "Belum", jumlah_kegiatan: 0, total_icp: 0, aktif: true,
  };
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const err = {};
    if (!form.nama.trim()) err.nama = "Nama wajib diisi";
    if (!form.nim.trim()) err.nim = "NIM wajib diisi";
    if (!form.email.trim()) err.email = "Email wajib diisi";
    else if (!/\S+@\S+\.\S+/.test(form.email)) err.email = "Format email tidak valid";
    return err;
  };

  const handleSave = async () => {
    const err = validate();
    if (Object.keys(err).length) {
      setErrors(err);
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    onSave(form);
    setSaving(false);
  };

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            {mode === "add" ? <Plus size={18} /> : <Edit2 size={18} />}
            <span>{mode === "add" ? "Tambah Mahasiswa" : "Edit Mahasiswa"}</span>
          </div>
          <button onClick={onClose} className={styles.modalClose}>
            <X size={18} />
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Nama Lengkap <span className={styles.required}>*</span></label>
              <input
                className={`${styles.input} ${errors.nama ? styles.inputError : ""}`}
                value={form.nama}
                onChange={(e) => setField("nama", e.target.value)}
                placeholder="Nama lengkap mahasiswa"
              />
              {errors.nama && <small className={styles.errorText}>{errors.nama}</small>}
            </div>
            <div className={styles.formGroup}>
              <label>NIM <span className={styles.required}>*</span></label>
              <input
                className={`${styles.input} ${errors.nim ? styles.inputError : ""}`}
                value={form.nim}
                onChange={(e) => setField("nim", e.target.value)}
                placeholder="Contoh: 202200001001"
              />
              {errors.nim && <small className={styles.errorText}>{errors.nim}</small>}
            </div>
            <div className={styles.formGroup}>
              <label>Program Studi</label>
              <select
                className={styles.input}
                value={form.id_prodi}
                onChange={(e) => setField("id_prodi", e.target.value)}
              >
                {PRODI_LIST.filter((p) => p !== "Semua").map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Angkatan</label>
              <select
                className={styles.input}
                value={form.angkatan}
                onChange={(e) => setField("angkatan", e.target.value)}
              >
                {ANGKATAN_LIST.filter((a) => a !== "Semua").map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </div>
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label>Email <span className={styles.required}>*</span></label>
              <input
                type="email"
                className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="email@student.isb.ac.id"
              />
              {errors.email && <small className={styles.errorText}>{errors.email}</small>}
            </div>
            <div className={styles.formGroup}>
              <label>Status SKPI</label>
              <select
                className={styles.input}
                value={form.status_skpi}
                onChange={(e) => setField("status_skpi", e.target.value)}
              >
                {["Belum", "Proses", "Selesai"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Status Akun</label>
              <button
                type="button"
                className={`${styles.toggleButton} ${form.aktif ? styles.toggleActive : styles.toggleInactive}`}
                onClick={() => setField("aktif", !form.aktif)}
              >
                {form.aktif ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                {form.aktif ? "Aktif" : "Nonaktif"}
              </button>
            </div>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.btnOutline} onClick={onClose}>
            Batal
          </button>
          <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
            {saving ? <span className={styles.spinner} /> : <Check size={16} />}
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
  MODAL RESET PASSWORD
------------------------------------------------------------------ */
function ResetPasswordModal({ mahasiswa, onClose, onDone }) {
  const [loading, setLoading] = useState(false);
  const handleReset = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    onDone();
    setLoading(false);
  };
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modalContainer} ${styles.modalSmall}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <KeyRound size={18} />
            <span>Reset Password</span>
          </div>
          <button onClick={onClose} className={styles.modalClose}>
            <X size={18} />
          </button>
        </div>
        <div className={styles.modalBody}>
          <p>
            Reset password untuk <strong>{mahasiswa.nama}</strong> ({mahasiswa.nim})?
          </p>
          <p className={styles.modalNote}>
            Password baru akan dikirim ke <strong>{mahasiswa.email}</strong>.
          </p>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.btnOutline} onClick={onClose}>
            Batal
          </button>
          <button className={`${styles.btnPrimary} ${styles.btnWarning}`} onClick={handleReset} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : <KeyRound size={16} />}
            {loading ? "Memproses..." : "Reset Password"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
  MODAL IMPORT EXCEL
------------------------------------------------------------------ */
function ImportExcelModal({ onClose, onDone }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext)) {
      setError("Format tidak didukung. Gunakan .xlsx, .xls, atau .csv");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("Ukuran file maksimal 5 MB");
      return;
    }
    setError("");
    setFile(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    const importedCount = Math.floor(Math.random() * 20) + 5;
    onDone(importedCount);
    setLoading(false);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <FileSpreadsheet size={18} />
            <span>Import Data Excel</span>
          </div>
          <button onClick={onClose} className={styles.modalClose}>
            <X size={18} />
          </button>
        </div>
        <div className={styles.modalBody}>
          <div
            className={`${styles.dropzone} ${dragging ? styles.dropzoneActive : ""} ${file ? styles.dropzoneFilled : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFile(e.dataTransfer.files[0]);
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              className={styles.hiddenInput}
              accept=".xlsx,.xls,.csv"
              onChange={(e) => handleFile(e.target.files[0])}
            />
            {file ? (
              <>
                <FileSpreadsheet size={36} />
                <p className={styles.dropFileName}>{file.name}</p>
                <p className={styles.dropFileSize}>{(file.size / 1024).toFixed(1)} KB</p>
              </>
            ) : (
              <>
                <Upload size={36} />
                <p>{dragging ? "Lepaskan file di sini" : "Klik atau seret file Excel ke sini"}</p>
                <small>.xlsx, .xls, .csv (max 5 MB)</small>
              </>
            )}
          </div>
          {error && <p className={styles.errorText}>{error}</p>}
          <div className={styles.importNote}>
            <AlertCircle size={14} />
            <span>
              Pastikan format kolom sesuai template.{" "}
              <button
                className={styles.linkButton}
                onClick={() => alert("Download template Excel (mock)")}
              >
                Download template
              </button>
            </span>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.btnOutline} onClick={onClose}>
            Batal
          </button>
          <button className={styles.btnPrimary} onClick={handleImport} disabled={!file || loading}>
            {loading ? <span className={styles.spinner} /> : <Upload size={16} />}
            {loading ? "Mengimport..." : "Import Data"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
  ACTION DROPDOWN (untuk setiap baris)
------------------------------------------------------------------ */
function RowActions({ row, onEdit, onResetPw, onToggleActive }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={styles.dropdown} ref={menuRef}>
      <button className={styles.dropdownTrigger} onClick={() => setOpen((o) => !o)}>
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className={styles.dropdownMenu}>
          <button onClick={() => { onEdit(); setOpen(false); }}>
            <Edit2 size={14} /> Edit Data
          </button>
          <button onClick={() => { onResetPw(); setOpen(false); }}>
            <KeyRound size={14} /> Reset Password
          </button>
          <hr className={styles.dropdownDivider} />
          <button
            className={row.aktif ? styles.dropdownDanger : styles.dropdownSuccess}
            onClick={() => { onToggleActive(); setOpen(false); }}
          >
            {row.aktif ? <EyeOff size={14} /> : <Eye size={14} />}
            {row.aktif ? "Nonaktifkan Akun" : "Aktifkan Akun"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
  HALAMAN UTAMA MANAJEMEN MAHASISWA
------------------------------------------------------------------ */
export default function MahasiswaPage() {
  const [data, setData] = useState(MOCK_DATA);
  const [search, setSearch] = useState("");
  const [filterProdi, setFilterProdi] = useState("Semua");
  const [filterAngkatan, setFilterAngkatan] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [modalAdd, setModalAdd] = useState(false);
  const [modalEdit, setModalEdit] = useState(null);
  const [modalReset, setModalReset] = useState(null);
  const [modalImport, setModalImport] = useState(false);
  const { toasts, add: toast, remove: removeToast } = useToast();

  // Filtering data
  const filteredData = data.filter((row) => {
    const matchSearch =
      !search ||
      row.nama.toLowerCase().includes(search.toLowerCase()) ||
      row.nim.includes(search);
    const matchProdi = filterProdi === "Semua" || row.id_prodi === filterProdi;
    const matchAngkatan = filterAngkatan === "Semua" || row.angkatan === filterAngkatan;
    const matchStatus = filterStatus === "Semua" || row.status_skpi === filterStatus;
    return matchSearch && matchProdi && matchAngkatan && matchStatus;
  });

  const totalPages = Math.ceil(filteredData.length / PER_PAGE);
  const safePage = Math.min(currentPage, totalPages || 1);
  const startIndex = (safePage - 1) * PER_PAGE;
  const paginatedData = filteredData.slice(startIndex, startIndex + PER_PAGE);

  // Statistik
  const totalMahasiswa = data.length;
  const aktifCount = data.filter((r) => r.aktif).length;
  const selesaiCount = data.filter((r) => r.status_skpi === "Selesai").length;
  const avgICP = Math.round(data.reduce((sum, r) => sum + r.total_icp, 0) / totalMahasiswa);

  // Handlers
  const handleAddSave = (newData) => {
    const newId = Math.max(...data.map((d) => d.id), 0) + 1;
    setData((prev) => [
      { ...newData, id: newId, jumlah_kegiatan: 0, total_icp: 0 },
      ...prev,
    ]);
    setModalAdd(false);
    toast("Mahasiswa berhasil ditambahkan");
  };

  const handleEditSave = (updated) => {
    setData((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
    setModalEdit(null);
    toast("Data mahasiswa diperbarui");
  };

  const handleResetDone = () => {
    setModalReset(null);
    toast("Password berhasil direset, email telah dikirim");
  };

  const handleToggleActive = (row) => {
    setData((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, aktif: !r.aktif } : r))
    );
    toast(`Akun ${row.nama} ${row.aktif ? "dinonaktifkan" : "diaktifkan"}`);
  };

  const handleImportDone = (count) => {
    setModalImport(false);
    toast(`Berhasil mengimport ${count} data mahasiswa`);
  };

  const downloadTemplate = () => {
    toast("Template Excel berhasil diunduh", "success");
    // Implementasi download file .xlsx template bisa ditambahkan
  };

  const resetFilters = () => {
    setFilterProdi("Semua");
    setFilterAngkatan("Semua");
    setFilterStatus("Semua");
    setSearch("");
    setCurrentPage(1);
  };

  const activeFilterCount =
    (filterProdi !== "Semua" ? 1 : 0) +
    (filterAngkatan !== "Semua" ? 1 : 0) +
    (filterStatus !== "Semua" ? 1 : 0) +
    (search ? 1 : 0);

  return (
    <div className={styles.container}>
      <Toast toasts={toasts} remove={removeToast} />

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Manajemen Mahasiswa</h1>
          <p className={styles.subtitle}>
            Kelola seluruh data mahasiswa, reset password, import/export, dan status akun.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnOutline} onClick={downloadTemplate}>
            <Download size={16} /> Template
          </button>
          <button className={styles.btnOutline} onClick={() => setModalImport(true)}>
            <Upload size={16} /> Import Excel
          </button>
          <button className={styles.btnPrimary} onClick={() => setModalAdd(true)}>
            <Plus size={16} /> Tambah Mahasiswa
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className={styles.statsGrid}>
        <StatCard icon={Users} title="Total Mahasiswa" value={totalMahasiswa} subtitle={`${aktifCount} akun aktif`} color="blue" />
        <StatCard icon={CheckCircle2} title="SKPI Selesai" value={selesaiCount} subtitle={`${Math.round((selesaiCount / totalMahasiswa) * 100)}%`} color="green" />
        <StatCard icon={TrendingUp} title="Rata-rata ICP" value={avgICP} subtitle="poin integritas" color="purple" />
        <StatCard icon={UserCheck} title="Mahasiswa Aktif" value={aktifCount} subtitle={`${totalMahasiswa - aktifCount} nonaktif`} color="orange" />
      </div>

      {/* Search & Filter Bar */}
      <div className={styles.searchBar}>
        <div className={styles.searchInput}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Cari berdasarkan Nama atau NIM..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
          {search && (
            <button className={styles.clearSearch} onClick={() => setSearch("")}>
              <X size={16} />
            </button>
          )}
        </div>
        <div className={styles.filterActions}>
          <button
            className={`${styles.filterButton} ${showFilterPanel || activeFilterCount > 0 ? styles.filterButtonActive : ""}`}
            onClick={() => setShowFilterPanel(!showFilterPanel)}
          >
            <Filter size={16} />
            Filter
            {activeFilterCount > 0 && <span className={styles.filterBadge}>{activeFilterCount}</span>}
            <ChevronDown size={14} className={showFilterPanel ? styles.chevronUp : ""} />
          </button>
          <div className={styles.resultCount}>
            {filteredData.length} mahasiswa
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilterPanel && (
        <div className={styles.filterPanel}>
          <div className={styles.filterGroup}>
            <label>Program Studi</label>
            <div className={styles.chipGroup}>
              {PRODI_LIST.map((p) => (
                <button
                  key={p}
                  className={`${styles.chip} ${filterProdi === p ? styles.chipActive : ""}`}
                  onClick={() => {
                    setFilterProdi(p);
                    setCurrentPage(1);
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.filterGroup}>
            <label>Angkatan</label>
            <div className={styles.chipGroup}>
              {ANGKATAN_LIST.map((a) => (
                <button
                  key={a}
                  className={`${styles.chip} ${filterAngkatan === a ? styles.chipActive : ""}`}
                  onClick={() => {
                    setFilterAngkatan(a);
                    setCurrentPage(1);
                  }}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.filterGroup}>
            <label>Status SKPI</label>
            <div className={styles.chipGroup}>
              {STATUS_SKPI.map((s) => (
                <button
                  key={s}
                  className={`${styles.chip} ${filterStatus === s ? styles.chipActive : ""}`}
                  onClick={() => {
                    setFilterStatus(s);
                    setCurrentPage(1);
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          {activeFilterCount > 0 && (
            <button className={styles.resetFilter} onClick={resetFilters}>
              <RefreshCw size={14} /> Reset Filter
            </button>
          )}
        </div>
      )}

      {/* Tabel Mahasiswa */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.colNo}>#</th>
              <th>Nama</th>
              <th>NIM</th>
              <th>Program Studi</th>
              <th>Angkatan</th>
              <th>Email</th>
              <th>Status SKPI</th>
              <th className={styles.colCenter}>Kegiatan</th>
              <th className={styles.colCenter}>ICP</th>
              <th className={styles.colCenter}>Akun</th>
              <th className={styles.colCenter}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={11} className={styles.emptyRow}>
                  <div className={styles.emptyState}>
                    <GraduationCap size={48} />
                    <p>Tidak ada data mahasiswa</p>
                    <span>Coba ubah filter atau tambah data baru</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr key={row.id} className={!row.aktif ? styles.rowInactive : ""}>
                  <td className={styles.colNo}>{startIndex + idx + 1}</td>
                  <td>
                    <div className={styles.nameCell}>
                      <div className={styles.avatar}>{row.nama.charAt(0)}</div>
                      <span>{row.nama}</span>
                    </div>
                  </td>
                  <td className={styles.nimCell}>{row.nim}</td>
                  <td>
                    <span className={styles.prodiBadge}>{row.id_prodi}</span>
                  </td>
                  <td className={styles.colCenter}>{row.angkatan}</td>
                  <td className={styles.emailCell}>{row.email}</td>
                  <td className={styles.colCenter}>
                    <StatusBadge status={row.status_skpi} />
                  </td>
                  <td className={styles.colCenter}>
                    <span className={styles.numberChip}>{row.jumlah_kegiatan}</span>
                  </td>
                  <td className={styles.colCenter}>
                    <span className={`${styles.numberChip} ${styles.icpChip}`}>{row.total_icp}</span>
                  </td>
                  <td className={styles.colCenter}>
                    <span className={`${styles.statusDot} ${row.aktif ? styles.dotActive : styles.dotInactive}`}>
                      {row.aktif ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className={styles.colCenter}>
                    <RowActions
                      row={row}
                      onEdit={() => setModalEdit(row)}
                      onResetPw={() => setModalReset(row)}
                      onToggleActive={() => handleToggleActive(row)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            Menampilkan {filteredData.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + PER_PAGE, filteredData.length)} dari {filteredData.length} mahasiswa
          </div>
          <div className={styles.paginationControls}>
            <button
              className={styles.pageBtn}
              onClick={() => setCurrentPage(1)}
              disabled={safePage === 1}
            >
              «
            </button>
            <button
              className={styles.pageBtn}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
            >
              <ChevronLeft size={14} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && arr[idx - 1] !== p - 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`dots-${i}`} className={styles.pageDots}>
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    className={`${styles.pageBtn} ${safePage === p ? styles.pageBtnActive : ""}`}
                    onClick={() => setCurrentPage(p)}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              className={styles.pageBtn}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
            >
              <ChevronRight size={14} />
            </button>
            <button
              className={styles.pageBtn}
              onClick={() => setCurrentPage(totalPages)}
              disabled={safePage === totalPages}
            >
              »
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {modalAdd && (
        <MahasiswaFormModal
          mode="add"
          onClose={() => setModalAdd(false)}
          onSave={handleAddSave}
        />
      )}
      {modalEdit && (
        <MahasiswaFormModal
          mode="edit"
          data={modalEdit}
          onClose={() => setModalEdit(null)}
          onSave={handleEditSave}
        />
      )}
      {modalReset && (
        <ResetPasswordModal
          mahasiswa={modalReset}
          onClose={() => setModalReset(null)}
          onDone={handleResetDone}
        />
      )}
      {modalImport && (
        <ImportExcelModal
          onClose={() => setModalImport(false)}
          onDone={handleImportDone}
        />
      )}
    </div>
  );
}