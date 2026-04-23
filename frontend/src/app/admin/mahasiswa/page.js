"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  Search, Plus, Upload, Download, Edit2, KeyRound,
  ToggleLeft, ToggleRight, ChevronLeft, ChevronRight,
  X, Check, AlertCircle, Users, FileSpreadsheet,
  GraduationCap, Filter, MoreVertical,
  Eye, EyeOff, RefreshCw, CheckCircle2,
  TrendingUp, UserCheck, ChevronDown,
} from "lucide-react";
import styles from "./page.module.css";

/* ─────────────────────────────────────────
   CONSTANTS & MOCK DATA
───────────────────────────────────────── */
const PER_PAGE = 10;
const PRODI_LIST    = ["Semua", "Teknik Informatika", "Manajemen", "Akuntansi", "Sistem Informasi", "Ilmu Komunikasi"];
const ANGKATAN_LIST = ["Semua", "2025", "2024", "2023", "2022", "2021", "2020"];
const STATUS_SKPI   = ["Semua", "Belum", "Proses", "Selesai"];

// Warna untuk setiap program studi
const PRODI_COLORS = {
  "Teknik Informatika": "#ff7f00",
  "Manajemen": "#0099cc",
  "Akuntansi": "#10b981",
  "Sistem Informasi": "#1a0909",
  "Ilmu Komunikasi": "#3b82f6",
};

function generateMock() {
  const prodiList  = PRODI_LIST.filter(p => p !== "Semua");
  const statusList = ["Belum", "Proses", "Selesai"];
  const names = [
    "Andi Pratama","Budi Santoso","Citra Dewi","Dian Pertiwi","Eko Wibowo",
    "Fitri Handayani","Galuh Pramesti","Hendra Kusuma","Indah Permata","Joko Widodo",
    "Kartika Sari","Luthfi Hakim","Maya Sari","Nando Pratama","Oktavia Putri",
    "Prima Yudha","Riani Astuti","Surya Darma","Tania Lestari","Umar Said",
    "Vera Kusuma","Wahyu Ramadan","Xena Pratiwi","Yoga Santoso","Zahra Nadia",
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

const MOCK_DATA = generateMock();

/* ─────────────────────────────────────────
   TOAST
───────────────────────────────────────── */
function Toast({ toasts, remove }) {
  return (
    <div className={styles.toastStack}>
      {toasts.map(t => (
        <div key={t.id} className={`${styles.toast} ${styles[`toast_${t.type}`]}`}>
          {t.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          <span>{t.msg}</span>
          <button onClick={() => remove(t.id)} className={styles.toastClose}><X size={13} /></button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);
  const remove = useCallback(id => setToasts(prev => prev.filter(t => t.id !== id)), []);
  return { toasts, add, remove };
}

/* ─────────────────────────────────────────
   STATUS BADGE
───────────────────────────────────────── */
function StatusBadge({ status }) {
  const cfg = {
    Selesai: { cls: styles.badgeSelesai, icon: <CheckCircle2 size={11} /> },
    Proses:  { cls: styles.badgeProses,  icon: <RefreshCw size={11} />    },
    Belum:   { cls: styles.badgeBelum,   icon: <AlertCircle size={11} />  },
  };
  const { cls, icon } = cfg[status] || cfg.Belum;
  return <span className={`${styles.badge} ${cls}`}>{icon}{status}</span>;
}

/* ─────────────────────────────────────────
   STAT CARD
───────────────────────────────────────── */
function StatCard({ icon: Icon, title, value, subtitle, color }) {
  return (
    <div className={`${styles.statCard} ${styles[`stat_${color}`]}`}>
      <div className={styles.statIconWrap}><Icon size={20} /></div>
      <div>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statTitle}>{title}</div>
        {subtitle && <div className={styles.statSub}>{subtitle}</div>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   INPUT PASSWORD
───────────────────────────────────────── */
function PasswordInput({ value, onChange, placeholder, id }) {
  const [show, setShow] = useState(false);
  return (
    <div className={styles.pwWrap}>
      <input
        id={id}
        type={show ? "text" : "password"}
        className={styles.input}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="new-password"
      />
      <button type="button" className={styles.pwEye} onClick={() => setShow(v => !v)} tabIndex={-1}>
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────
   MODAL TAMBAH / EDIT MAHASISWA
───────────────────────────────────────── */
function MahasiswaFormModal({ mode, data, onClose, onSave }) {
  const initial = data || {
    nama: "", nim: "", id_prodi: PRODI_LIST[1], angkatan: "2024",
    email: "", password: "", password_confirm: "",
    status_skpi: "Belum", aktif: true,
  };
  const [form, setForm]     = useState(initial);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }));
  };

  const validate = () => {
    const err = {};
    if (!form.nama.trim())  err.nama  = "Nama wajib diisi.";
    if (!form.nim.trim())   err.nim   = "NIM wajib diisi.";
    if (!form.email.trim()) err.email = "Email wajib diisi.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) err.email = "Format email tidak valid.";
    if (mode === "add") {
      if (!form.password)           err.password = "Password wajib diisi.";
      else if (form.password.length < 8) err.password = "Minimal 8 karakter.";
      if (form.password !== form.password_confirm) err.password_confirm = "Konfirmasi tidak cocok.";
    }
    return err;
  };

  const handleSave = async () => {
    const err = validate();
    if (Object.keys(err).length) { setErrors(err); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    const { password_confirm, ...toSave } = form;
    onSave(toSave);
    setSaving(false);
  };

  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalHeaderIcon}>
              {mode === "add" ? <Plus size={16} /> : <Edit2 size={16} />}
            </div>
            <div>
              <h3 className={styles.modalTitle}>{mode === "add" ? "Tambah Mahasiswa" : "Edit Data Mahasiswa"}</h3>
              <p className={styles.modalSub}>Isi data akun mahasiswa dengan benar</p>
            </div>
          </div>
          <button className={styles.modalCloseBtn} onClick={onClose}><X size={17} /></button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formSection}>DATA PRIBADI</div>
          <div className={styles.formGrid2}>
            <div className={styles.fg}>
              <label className={styles.fl}>Nama Lengkap <span className={styles.req}>*</span></label>
              <input className={`${styles.input} ${errors.nama ? styles.inputErr : ""}`}
                value={form.nama} onChange={e => set("nama", e.target.value)}
                placeholder="Nama lengkap sesuai KTP" />
              {errors.nama && <small className={styles.errMsg}>{errors.nama}</small>}
            </div>
            <div className={styles.fg}>
              <label className={styles.fl}>NIM <span className={styles.req}>*</span></label>
              <input className={`${styles.input} ${errors.nim ? styles.inputErr : ""}`}
                value={form.nim} onChange={e => set("nim", e.target.value)}
                placeholder="Contoh: 202200001001" />
              {errors.nim && <small className={styles.errMsg}>{errors.nim}</small>}
            </div>
            <div className={styles.fg}>
              <label className={styles.fl}>Program Studi</label>
              <select className={styles.input} value={form.id_prodi} onChange={e => set("id_prodi", e.target.value)}>
                {PRODI_LIST.filter(p => p !== "Semua").map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className={styles.fg}>
              <label className={styles.fl}>Angkatan</label>
              <select className={styles.input} value={form.angkatan} onChange={e => set("angkatan", e.target.value)}>
                {ANGKATAN_LIST.filter(a => a !== "Semua").map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div className={`${styles.fg} ${styles.fullSpan}`}>
              <label className={styles.fl}>Email <span className={styles.req}>*</span></label>
              <input type="email" className={`${styles.input} ${errors.email ? styles.inputErr : ""}`}
                value={form.email} onChange={e => set("email", e.target.value)}
                placeholder="email@student.isb.ac.id" />
              {errors.email && <small className={styles.errMsg}>{errors.email}</small>}
            </div>
          </div>

          {mode === "add" && (
            <>
              <div className={styles.formSection}>KATA SANDI AKUN</div>
              <div className={styles.formGrid2}>
                <div className={styles.fg}>
                  <label className={styles.fl}>Password <span className={styles.req}>*</span></label>
                  <PasswordInput value={form.password}
                    onChange={e => set("password", e.target.value)}
                    placeholder="Minimal 8 karakter" />
                  {errors.password && <small className={styles.errMsg}>{errors.password}</small>}
                </div>
                <div className={styles.fg}>
                  <label className={styles.fl}>Konfirmasi Password <span className={styles.req}>*</span></label>
                  <PasswordInput value={form.password_confirm}
                    onChange={e => set("password_confirm", e.target.value)}
                    placeholder="Ulangi password" />
                  {errors.password_confirm && <small className={styles.errMsg}>{errors.password_confirm}</small>}
                </div>
              </div>
            </>
          )}

          <div className={styles.formSection}>STATUS AKUN</div>
          <div className={styles.formGrid2}>
            <div className={styles.fg}>
              <label className={styles.fl}>Status SKPI</label>
              <select className={styles.input} value={form.status_skpi} onChange={e => set("status_skpi", e.target.value)}>
                {["Belum", "Proses", "Selesai"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className={styles.fg}>
              <label className={styles.fl}>Status Akun</label>
              <button type="button"
                className={`${styles.toggleBtn} ${form.aktif ? styles.toggleOn : styles.toggleOff}`}
                onClick={() => set("aktif", !form.aktif)}>
                {form.aktif ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                {form.aktif ? "Aktif" : "Nonaktif"}
              </button>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btnGhost} onClick={onClose}>Batal</button>
          <button className={styles.btnSave} onClick={handleSave} disabled={saving}>
            {saving ? <span className={styles.spin} /> : <Check size={15} />}
            {saving ? "Menyimpan…" : mode === "add" ? "Tambah Mahasiswa" : "Simpan Perubahan"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MODAL RESET PASSWORD
───────────────────────────────────────── */
function ResetPasswordModal({ mahasiswa, onClose, onDone }) {
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    onDone();
  };
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modalBox} ${styles.modalSm}`} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={`${styles.modalHeaderIcon} ${styles.iconWarn}`}><KeyRound size={16} /></div>
            <div>
              <h3 className={styles.modalTitle}>Reset Password</h3>
              <p className={styles.modalSub}>Kirim password baru ke email mahasiswa</p>
            </div>
          </div>
          <button className={styles.modalCloseBtn} onClick={onClose}><X size={17} /></button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.confirmBox}>
            <p>Reset password untuk <strong>{mahasiswa.nama}</strong>?</p>
            <p className={styles.confirmNote}>Password baru akan dikirim ke <strong>{mahasiswa.email}</strong></p>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.btnGhost} onClick={onClose}>Batal</button>
          <button className={`${styles.btnSave} ${styles.btnWarn}`} onClick={handle} disabled={loading}>
            {loading ? <span className={styles.spin} /> : <KeyRound size={15} />}
            {loading ? "Memproses…" : "Reset Password"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MODAL IMPORT EXCEL
───────────────────────────────────────── */
function ImportExcelModal({ onClose, onDone }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const handleFile = f => {
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext)) {
      setError("Format harus .xlsx, .xls, atau .csv");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("Ukuran maksimal 5 MB");
      return;
    }
    setError("");
    setFile(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);
      if (rows.length === 0) throw new Error("File kosong");

      const requiredColumns = ["Nama", "NIM", "Program Studi", "Angkatan", "Email", "Status SKPI", "Jumlah Kegiatan", "Total ICP", "Status Akun"];
      const firstRow = rows[0];
      const missing = requiredColumns.filter(col => !(col in firstRow));
      if (missing.length) {
        throw new Error(`Kolom tidak lengkap: ${missing.join(", ")}`);
      }

      const newMahasiswa = rows.map((row, idx) => ({
        id: Date.now() + idx,
        nama: row["Nama"],
        nim: row["NIM"].toString(),
        id_prodi: row["Program Studi"],
        angkatan: row["Angkatan"].toString(),
        email: row["Email"],
        status_skpi: row["Status SKPI"],
        jumlah_kegiatan: parseInt(row["Jumlah Kegiatan"]) || 0,
        total_icp: parseInt(row["Total ICP"]) || 0,
        aktif: row["Status Akun"] === "Aktif",
        password: row["Password"] || row["NIM"].toString(),
      }));

      onDone(newMahasiswa);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalHeaderIcon}><FileSpreadsheet size={16} /></div>
            <div>
              <h3 className={styles.modalTitle}>Import Data Excel</h3>
              <p className={styles.modalSub}>Unggah file .xlsx, .xls, atau .csv</p>
            </div>
          </div>
          <button className={styles.modalCloseBtn} onClick={onClose}><X size={17} /></button>
        </div>
        <div className={styles.modalBody}>
          <div
            className={`${styles.dropZone} ${dragging ? styles.dropActive : ""} ${file ? styles.dropFilled : ""}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => inputRef.current?.click()}
            role="button" tabIndex={0}
          >
            <input type="file" ref={inputRef} hidden accept=".xlsx,.xls,.csv"
              onChange={e => handleFile(e.target.files[0])} />
            {file ? (
              <>
                <FileSpreadsheet size={32} color="#16a34a" />
                <p className={styles.dropFileName}>{file.name}</p>
                <p className={styles.dropFileSize}>{(file.size / 1024).toFixed(1)} KB</p>
              </>
            ) : (
              <>
                <Upload size={32} />
                <p>{dragging ? "Lepaskan file di sini" : "Klik atau seret file ke sini"}</p>
                <small>.xlsx · .xls · .csv — maks. 5 MB</small>
              </>
            )}
          </div>
          {error && <p className={styles.errMsg}>{error}</p>}
          <div className={styles.importNote}>
            <AlertCircle size={13} />
            <span>Pastikan kolom sesuai template. Kolom Password opsional, default = NIM.</span>
            <button className={styles.linkBtn} onClick={() => window.downloadTemplate?.()}>Unduh template</button>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.btnGhost} onClick={onClose}>Batal</button>
          <button className={styles.btnSave} onClick={handleImport} disabled={!file || loading}>
            {loading ? <span className={styles.spin} /> : <Upload size={15} />}
            {loading ? "Mengimport…" : "Import Data"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   ROW ACTION DROPDOWN
───────────────────────────────────────── */
function RowActions({ row, onEdit, onResetPw, onToggleActive }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  return (
    <div className={styles.ddWrap} ref={ref}>
      <button className={styles.ddTrigger} onClick={() => setOpen(o => !o)}>
        <MoreVertical size={15} />
      </button>
      {open && (
        <div className={styles.ddMenu}>
          <button onClick={() => { onEdit(); setOpen(false); }}><Edit2 size={13} /> Edit Data</button>
          <button onClick={() => { onResetPw(); setOpen(false); }}><KeyRound size={13} /> Reset Password</button>
          <div className={styles.ddDivider} />
          <button
            className={row.aktif ? styles.ddDanger : styles.ddSuccess}
            onClick={() => { onToggleActive(); setOpen(false); }}
          >
            {row.aktif ? <EyeOff size={13} /> : <Eye size={13} />}
            {row.aktif ? "Nonaktifkan" : "Aktifkan"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   HALAMAN UTAMA
───────────────────────────────────────── */
export default function MahasiswaPage() {
  const [data, setData] = useState(MOCK_DATA);
  const [search, setSearch] = useState("");
  const [filterProdi, setFilterProdi] = useState("Semua");
  const [filterAngkatan, setFilterAngkatan] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [modalAdd, setModalAdd] = useState(false);
  const [modalEdit, setModalEdit] = useState(null);
  const [modalReset, setModalReset] = useState(null);
  const [modalImport, setModalImport] = useState(false);
  const { toasts, add: toast, remove } = useToast();

  useEffect(() => {
    document.title = "Manajemen Mahasiswa | Admin SKPI";
  }, []);

  const downloadTemplate = () => {
    const templateData = [
      {
        "Nama": "Contoh Mahasiswa",
        "NIM": "202200001001",
        "Program Studi": "Teknik Informatika",
        "Angkatan": "2024",
        "Email": "contoh@student.isb.ac.id",
        "Status SKPI": "Belum",
        "Jumlah Kegiatan": 0,
        "Total ICP": 0,
        "Status Akun": "Aktif",
        "Password": "contoh123"
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Mahasiswa");
    XLSX.writeFile(wb, "template_mahasiswa.xlsx");
    toast("Template berhasil diunduh");
  };

  if (typeof window !== "undefined") {
    window.downloadTemplate = downloadTemplate;
  }

  const filtered = data.filter(row => {
    const q = search.toLowerCase();
    return (
      (!search || row.nama.toLowerCase().includes(q) || row.nim.includes(q)) &&
      (filterProdi    === "Semua" || row.id_prodi    === filterProdi) &&
      (filterAngkatan === "Semua" || row.angkatan    === filterAngkatan) &&
      (filterStatus   === "Semua" || row.status_skpi === filterStatus)
    );
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const safePage   = Math.min(currentPage, totalPages || 1);
  const start      = (safePage - 1) * PER_PAGE;
  const paged      = filtered.slice(start, start + PER_PAGE);

  const totalM   = data.length;
  const aktifC   = data.filter(r => r.aktif).length;
  const selesaiC = data.filter(r => r.status_skpi === "Selesai").length;
  const avgICP   = Math.round(data.reduce((s, r) => s + r.total_icp, 0) / totalM);

  const handleAddSave = d => {
    setData(prev => [{ ...d, id: Math.max(0,...prev.map(x=>x.id))+1, jumlah_kegiatan:0, total_icp:0 }, ...prev]);
    setModalAdd(false);
    toast("Mahasiswa berhasil ditambahkan");
  };

  const handleEditSave = d => {
    setData(prev => prev.map(r => r.id === d.id ? { ...r, ...d } : r));
    setModalEdit(null);
    toast("Data mahasiswa diperbarui");
  };

  const handleResetDone = () => {
    setModalReset(null);
    toast("Password direset, email telah dikirim");
  };

  const handleToggle = row => {
    setData(prev => prev.map(r => r.id === row.id ? { ...r, aktif: !r.aktif } : r));
    toast(`Akun ${row.nama} ${row.aktif ? "dinonaktifkan" : "diaktifkan"}`);
  };

  const handleImportDone = (newMahasiswa) => {
    setData(prev => [...newMahasiswa, ...prev]);
    setModalImport(false);
    toast(`Berhasil mengimport ${newMahasiswa.length} data mahasiswa`);
  };

  const resetFilter = () => {
    setFilterProdi("Semua"); setFilterAngkatan("Semua");
    setFilterStatus("Semua"); setSearch(""); setCurrentPage(1);
  };

  const activeFilters =
    (filterProdi !== "Semua" ? 1 : 0) +
    (filterAngkatan !== "Semua" ? 1 : 0) +
    (filterStatus !== "Semua" ? 1 : 0) +
    (search ? 1 : 0);

  return (
    <div className={styles.page}>
      <Toast toasts={toasts} remove={remove} />

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Manajemen Mahasiswa</h1>
          <p className={styles.pageSub}>Kelola data mahasiswa, reset password, dan status akun</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnOutline} onClick={downloadTemplate}>
            <Download size={15} /> Cetak
          </button>
          <button className={styles.btnOutline} onClick={() => setModalImport(true)}>
            <Upload size={15} /> Import Excel
          </button>
          <button className={styles.btnPrimary} onClick={() => setModalAdd(true)}>
            <Plus size={15} /> Tambah Mahasiswa
          </button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <StatCard icon={Users}         title="Total Mahasiswa"  value={totalM}   subtitle={`${aktifC} akun aktif`}       color="blue"   />
        <StatCard icon={CheckCircle2}  title="SKPI Selesai"     value={selesaiC} subtitle={`${Math.round(selesaiC/totalM*100)}%`} color="green"  />
        <StatCard icon={TrendingUp}    title="Rata-rata ICP"    value={avgICP}   subtitle="poin integritas"               color="purple" />
        <StatCard icon={UserCheck}     title="Akun Aktif"       value={aktifC}   subtitle={`${totalM-aktifC} nonaktif`}   color="orange" />
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input className={styles.searchInput} placeholder="Cari nama atau NIM…"
            value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} />
          {search && <button className={styles.searchClear} onClick={() => setSearch("")}><X size={14} /></button>}
        </div>
        <div className={styles.toolbarRight}>
          <button className={`${styles.btnFilter} ${filterOpen || activeFilters ? styles.btnFilterActive : ""}`}
            onClick={() => setFilterOpen(o => !o)}>
            <Filter size={14} /> Filter
            {activeFilters > 0 && <span className={styles.filterBadge}>{activeFilters}</span>}
            <ChevronDown size={13} className={filterOpen ? styles.chevUp : ""} />
          </button>
          <span className={styles.resultCount}>{filtered.length} mahasiswa</span>
        </div>
      </div>

      {filterOpen && (
        <div className={styles.filterPanel}>
          {[
            { label: "Program Studi", list: PRODI_LIST, val: filterProdi, set: v => { setFilterProdi(v); setCurrentPage(1); } },
            { label: "Angkatan",      list: ANGKATAN_LIST, val: filterAngkatan, set: v => { setFilterAngkatan(v); setCurrentPage(1); } },
            { label: "Status SKPI",   list: STATUS_SKPI,   val: filterStatus,   set: v => { setFilterStatus(v);   setCurrentPage(1); } },
          ].map(({ label, list, val, set: setVal }) => (
            <div className={styles.filterGroup} key={label}>
              <p className={styles.filterLabel}>{label}</p>
              <div className={styles.chipRow}>
                {list.map(item => (
                  <button key={item} onClick={() => setVal(item)}
                    className={`${styles.chip} ${val === item ? styles.chipActive : ""}`}>{item}</button>
                ))}
              </div>
            </div>
          ))}
          {activeFilters > 0 && (
            <button className={styles.btnResetFilter} onClick={resetFilter}>
              <RefreshCw size={13} /> Reset Filter
            </button>
          )}
        </div>
      )}

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thNo}>#</th>
              <th>Nama Mahasiswa</th>
              <th>NIM</th>
              <th>Program Studi</th>
              <th className={styles.thCenter}>Angkatan</th>
              <th>Email</th>
              <th className={styles.thCenter}>Status SKPI</th>
              <th className={styles.thCenter}>Kegiatan</th>
              <th className={styles.thCenter}>ICP</th>
              <th className={styles.thCenter}>Akun</th>
              <th className={styles.thCenter}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={11} className={styles.emptyTd}>
                  <div className={styles.emptyState}>
                    <GraduationCap size={44} />
                    <p>Tidak ada data mahasiswa</p>
                    <span>Coba ubah filter atau tambah data baru</span>
                  </div>
                </td>
              </tr>
            ) : paged.map((row, idx) => {
              const prodiColor = PRODI_COLORS[row.id_prodi] || "#6b7280";
              return (
                <tr key={row.id} className={!row.aktif ? styles.rowInactive : ""}>
                  <td className={styles.tdNo}>{start + idx + 1}</td>
                  <td>
                    <div className={styles.nameCell}>
                      <div className={styles.avatar}>{row.nama.charAt(0)}</div>
                      <span className={styles.nameText}>{row.nama}</span>
                    </div>
                  </td>
                  <td><span className={styles.nimBadge}>{row.nim}</span></td>
                  <td>
                    <span className={styles.prodiBadge} style={{ 
                      backgroundColor: `${prodiColor}20`,
                      color: prodiColor,
                      borderLeft: `3px solid ${prodiColor}`
                    }}>
                      {row.id_prodi}
                    </span>
                  </td>
                  <td className={styles.tdCenter}>{row.angkatan}</td>
                  <td className={styles.emailCell}>{row.email}</td>
                  <td className={styles.tdCenter}><StatusBadge status={row.status_skpi} /></td>
                  <td className={styles.tdCenter}><span className={styles.numChip}>{row.jumlah_kegiatan}</span></td>
                  <td className={styles.tdCenter}><span className={`${styles.numChip} ${styles.icpChip}`}>{row.total_icp}</span></td>
                  <td className={styles.tdCenter}>
                    <span className={`${styles.akunDot} ${row.aktif ? styles.dotOn : styles.dotOff}`}>
                      {row.aktif ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className={styles.tdCenter}>
                    <RowActions row={row}
                      onEdit={() => setModalEdit(row)}
                      onResetPw={() => setModalReset(row)}
                      onToggleActive={() => handleToggle(row)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <span className={styles.paginInfo}>
            {filtered.length === 0 ? 0 : start+1}–{Math.min(start+PER_PAGE, filtered.length)} dari {filtered.length}
          </span>
          <div className={styles.paginBtns}>
            <button className={styles.pBtn} onClick={() => setCurrentPage(1)} disabled={safePage===1}>«</button>
            <button className={styles.pBtn} onClick={() => setCurrentPage(p=>Math.max(1,p-1))} disabled={safePage===1}>
              <ChevronLeft size={13} />
            </button>
            {Array.from({length:totalPages},(_,i)=>i+1)
              .filter(p=>p===1||p===totalPages||Math.abs(p-safePage)<=1)
              .reduce((acc,p,i,arr)=>{ if(i>0&&arr[i-1]!==p-1) acc.push("…"); acc.push(p); return acc; },[])
              .map((p,i) => p==="…"
                ? <span key={`d${i}`} className={styles.pDots}>…</span>
                : <button key={p} className={`${styles.pBtn} ${safePage===p?styles.pBtnActive:""}`} onClick={()=>setCurrentPage(p)}>{p}</button>
              )}
            <button className={styles.pBtn} onClick={() => setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={safePage===totalPages}>
              <ChevronRight size={13} />
            </button>
            <button className={styles.pBtn} onClick={() => setCurrentPage(totalPages)} disabled={safePage===totalPages}>»</button>
          </div>
        </div>
      )}

      {modalAdd    && <MahasiswaFormModal mode="add"  onClose={() => setModalAdd(false)}  onSave={handleAddSave} />}
      {modalEdit   && <MahasiswaFormModal mode="edit" data={modalEdit} onClose={() => setModalEdit(null)}  onSave={handleEditSave} />}
      {modalReset  && <ResetPasswordModal mahasiswa={modalReset} onClose={() => setModalReset(null)} onDone={handleResetDone} />}
      {modalImport && <ImportExcelModal onClose={() => setModalImport(false)} onDone={handleImportDone} />}
    </div>
  );
}