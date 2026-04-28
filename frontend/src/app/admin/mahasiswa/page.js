"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  Search, Plus, Upload, Download, Edit2, KeyRound,
  ToggleLeft, ToggleRight, ChevronLeft, ChevronRight,
  X, Check, AlertCircle, Users, FileSpreadsheet,
  GraduationCap, Filter, MoreVertical,
  Eye, EyeOff, RefreshCw, CheckCircle2,
  TrendingUp, UserCheck, ChevronDown, Loader2,
} from "lucide-react";
import styles from "./page.module.css";
import {
  getMahasiswaList,
  createMahasiswa,
  updateMahasiswa,
  resetMahasiswaPassword,
  toggleMahasiswaAkun,
  importMahasiswaBulk,
  getProdiList,
} from "@/lib/api";

/* ─────────────────────────────────────────
   KONSTANTA & MOCK DATA
───────────────────────────────────────── */
const PER_PAGE      = 10;
const ANGKATAN_LIST = ["Semua", "2025", "2024", "2023", "2022", "2021", "2020"];
const STATUS_SKPI   = ["Semua", "Belum", "Proses", "Selesai"];

const PRODI_COLORS = {
  "Teknologi Informasi":           { primary: "#ff7f00", light: "#fff3e6" },
  "Manajemen":                     { primary: "#0099cc", light: "#e6f5fa" },
  "Kewirausahaan":                 { primary: "#ff3300", light: "#ffe6e0" },
  "Pendidikan Guru Sekolah Dasar": { primary: "#800080", light: "#f3e6f3" },
  "Agroekoteknologi":              { primary: "#00bfb3", light: "#e6faf8" },
  "Sistem Informasi":              { primary: "#1a0909", light: "#f0ecec" },
};

const MOCK_MAHASISWA = [
  { id:1, nim:"2021001", nama:"Ahmad Rizki",   nama_prodi:"Teknologi Informasi",           angkatan:"2021", email:"ahmad@student.isb.ac.id",   status_skpi:"Belum",  aktif:true,  has_akun:true },
  { id:2, nim:"2021002", nama:"Budi Santoso",  nama_prodi:"Manajemen",                     angkatan:"2021", email:"budi@student.isb.ac.id",    status_skpi:"Proses", aktif:true,  has_akun:true },
  { id:3, nim:"2021003", nama:"Citra Dewi",    nama_prodi:"Pendidikan Guru Sekolah Dasar", angkatan:"2022", email:"citra@student.isb.ac.id",   status_skpi:"Selesai",aktif:true,  has_akun:true },
  { id:4, nim:"2021004", nama:"Dedi Wijaya",   nama_prodi:"Kewirausahaan",                 angkatan:"2023", email:"dedi@student.isb.ac.id",    status_skpi:"Belum",  aktif:false, has_akun:true },
  { id:5, nim:"2021005", nama:"Eka Putri",     nama_prodi:"Sistem Informasi",              angkatan:"2022", email:"eka@student.isb.ac.id",     status_skpi:"Proses", aktif:true,  has_akun:true },
];

let toastIdCounter = 0;
let backendWarningShown = false;

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
    const id = ++toastIdCounter;
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
function PasswordInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className={styles.pwWrap}>
      <input
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
function MahasiswaFormModal({ mode, data, onClose, onSave, prodiList }) {
  const initial = data || {
    nama: "", nim: "", id_prodi: "", angkatan: "2024",
    email: "", password: "", password_confirm: "",
    status_skpi: "Belum", aktif: true,
  };
  const [form,   setForm]   = useState(initial);
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
      if (!form.password)                err.password = "Password wajib diisi.";
      else if (form.password.length < 8) err.password = "Minimal 8 karakter.";
      if (form.password !== form.password_confirm) err.password_confirm = "Konfirmasi tidak cocok.";
    }
    return err;
  };

  const handleSave = async () => {
    const err = validate();
    if (Object.keys(err).length) { setErrors(err); return; }
    setSaving(true);
    const { password_confirm, ...toSave } = form;
    await onSave(toSave);
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
                placeholder="Contoh: 202200001001"
                disabled={mode === "edit"} />
              {errors.nim && <small className={styles.errMsg}>{errors.nim}</small>}
            </div>
            <div className={styles.fg}>
              <label className={styles.fl}>Program Studi</label>
              <select className={styles.input} value={form.id_prodi} onChange={e => set("id_prodi", e.target.value)}>
                <option value="">-- Pilih Prodi --</option>
                {prodiList.map(p => (
                  <option key={p.id_prodi} value={p.id_prodi}>{p.nama_prodi}</option>
                ))}
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

          <div className={styles.formSection}>STATUS</div>
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
    await onDone();
    setLoading(false);
  };
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modalBox} ${styles.modalSm}`} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={`${styles.modalHeaderIcon} ${styles.iconWarn}`}><KeyRound size={16} /></div>
            <div>
              <h3 className={styles.modalTitle}>Reset Password</h3>
              <p className={styles.modalSub}>Reset password ke default (NIM mahasiswa)</p>
            </div>
          </div>
          <button className={styles.modalCloseBtn} onClick={onClose}><X size={17} /></button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.confirmBox}>
            <p>Reset password untuk <strong>{mahasiswa.nama}</strong>?</p>
            <p className={styles.confirmNote}>Password baru: <strong>{mahasiswa.nim}</strong> (NIM mahasiswa)</p>
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
  const [file,     setFile]     = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const inputRef = useRef(null);

  const handleFile = f => {
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["xlsx","xls","csv"].includes(ext)) { setError("Format harus .xlsx, .xls, atau .csv"); return; }
    if (f.size > 5 * 1024 * 1024)            { setError("Ukuran maksimal 5 MB"); return; }
    setError(""); setFile(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const data     = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const rows     = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
      if (rows.length === 0) throw new Error("File kosong");

      const required = ["Nama","NIM","Program Studi","Angkatan","Email"];
      const missing  = required.filter(col => !(col in rows[0]));
      if (missing.length) throw new Error(`Kolom tidak lengkap: ${missing.join(", ")}`);

      const list = rows.map(row => ({
        nama:     row["Nama"],
        nim:      row["NIM"].toString(),
        id_prodi: row["Program Studi"],
        angkatan: row["Angkatan"].toString(),
        email:    row["Email"],
        password: row["Password"] || row["NIM"].toString(),
      }));

      await onDone(list);
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
            <span>Kolom wajib: Nama, NIM, Program Studi, Angkatan, Email. Password opsional (default = NIM).</span>
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
  const [data,        setData]        = useState([]);
  const [total,       setTotal]       = useState(0);
  const [totalPages,  setTotalPages]  = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [prodiList,   setProdiList]   = useState([]);

  const [search,          setSearch]          = useState("");
  const [filterProdi,     setFilterProdi]     = useState("Semua");
  const [filterAngkatan,  setFilterAngkatan]  = useState("Semua");
  const [filterStatus,    setFilterStatus]    = useState("Semua");
  const [currentPage,     setCurrentPage]     = useState(1);
  const [filterOpen,      setFilterOpen]      = useState(false);
  const [modalAdd,        setModalAdd]        = useState(false);
  const [modalEdit,       setModalEdit]       = useState(null);
  const [modalReset,      setModalReset]      = useState(null);
  const [modalImport,     setModalImport]     = useState(false);
  const { toasts, add: toast, remove }        = useToast();

  useEffect(() => {
    getProdiList().then(list => { if (list) setProdiList(list); });
    document.title = "Manajemen Mahasiswa | Admin SKPI";
  }, []);

  const loadData = useCallback(async (q = search, prodi = filterProdi, page = currentPage) => {
    setLoading(true);
    try {
      const result = await getMahasiswaList({ q, prodi, page });
      if (result && result.rows && result.rows.length > 0) {
        const rows = result.rows.map(m => ({
          id:              m.id_mahasiswa,
          nama:            m.nama,
          nim:             m.nim,
          id_prodi:        m.id_prodi,
          nama_prodi:      m.programstudi?.nama_prodi ?? "-",
          angkatan:        m.angkatan ?? "-",
          email:           m.email ?? "-",
          status_skpi:     m.status_skpi ?? "Belum",
          jumlah_kegiatan: m._count?.kegiatanmahasiswa ?? m.jumlah_kegiatan ?? 0,
          total_icp:       m.total_icp ?? 0,
          aktif:           m.users ? m.users.status_akun === "aktif" : false,
          has_akun:        !!m.id_user,
        }));
        setData(rows);
        setTotal(result.total ?? rows.length);
        setTotalPages(Math.ceil((result.total ?? rows.length) / PER_PAGE) || 1);
        if (backendWarningShown) backendWarningShown = false;
      } else {
        setData(MOCK_MAHASISWA);
        setTotal(MOCK_MAHASISWA.length);
        setTotalPages(1);
        if (!backendWarningShown) {
          toast("Backend tidak tersedia, menggunakan data demo", "error");
          backendWarningShown = true;
        }
      }
    } catch {
      setData(MOCK_MAHASISWA);
      setTotal(MOCK_MAHASISWA.length);
      setTotalPages(1);
      if (!backendWarningShown) {
        toast("Gagal memuat data, menggunakan data demo", "error");
        backendWarningShown = true;
      }
    } finally {
      setLoading(false);
    }
  }, [search, filterProdi, currentPage, toast]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const t = setTimeout(() => { setCurrentPage(1); loadData(search, filterProdi, 1); }, 400);
    return () => clearTimeout(t);
  }, [search]);  // eslint-disable-line

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{
      "Nama": "Contoh Mahasiswa", "NIM": "202200001001",
      "Program Studi": "Teknik Informatika", "Angkatan": "2024",
      "Email": "contoh@student.isb.ac.id", "Password": "contoh123",
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Mahasiswa");
    XLSX.writeFile(wb, "template_mahasiswa.xlsx");
    toast("Template berhasil diunduh");
  };

  const handleAddSave = async (form) => {
    const res = await createMahasiswa(form);
    if (res.ok) {
      toast("Mahasiswa berhasil ditambahkan");
      setModalAdd(false);
      setCurrentPage(1);
      loadData(search, filterProdi, 1);
    } else {
      toast(res.data?.error || "Gagal menambah mahasiswa", "error");
    }
  };

  const handleEditSave = async (form) => {
    const res = await updateMahasiswa(modalEdit.id, form);
    if (res.ok) {
      toast("Data mahasiswa diperbarui");
      setModalEdit(null);
      loadData();
    } else {
      toast(res.data?.error || "Gagal update data", "error");
    }
  };

  const handleResetDone = async () => {
    const res = await resetMahasiswaPassword(modalReset.id);
    if (res.ok) {
      toast(`Password ${modalReset.nama} berhasil direset ke NIM`);
    } else {
      toast(res.data?.error || "Gagal reset password", "error");
    }
    setModalReset(null);
  };

  const handleToggle = async (row) => {
    const res = await toggleMahasiswaAkun(row.id);
    if (res.ok) {
      toast(`Akun ${row.nama} ${row.aktif ? "dinonaktifkan" : "diaktifkan"}`);
      loadData();
    } else {
      toast(res.data?.error || "Gagal mengubah status akun", "error");
    }
  };

  const handleImportDone = async (list) => {
    const res = await importMahasiswaBulk(list);
    setModalImport(false);
    if (res.ok) {
      toast(`Import selesai: ${res.data?.success ?? list.length} berhasil${res.data?.failed ? `, ${res.data.failed} gagal` : ""}`);
      loadData(search, filterProdi, 1);
    } else {
      toast(res.data?.error || "Gagal import data", "error");
    }
  };

  const resetFilter = () => {
    setFilterProdi("Semua"); setFilterAngkatan("Semua");
    setFilterStatus("Semua"); setSearch(""); setCurrentPage(1);
  };

  const activeFilters =
    (filterProdi    !== "Semua" ? 1 : 0) +
    (filterAngkatan !== "Semua" ? 1 : 0) +
    (filterStatus   !== "Semua" ? 1 : 0) +
    (search ? 1 : 0);

  // Filter client-side untuk angkatan & status (prodi & search dihandle server)
  const filtered = data.filter(row =>
    (filterAngkatan === "Semua" || row.angkatan    === filterAngkatan) &&
    (filterStatus   === "Semua" || row.status_skpi === filterStatus)
  );

  const aktifC   = data.filter(r => r.aktif).length;
  const selesaiC = data.filter(r => r.status_skpi === "Selesai").length;
  const avgICP   = data.length ? Math.round(data.reduce((s, r) => s + (r.total_icp || 0), 0) / data.length) : 0;
  const start    = (currentPage - 1) * PER_PAGE;

  return (
    <div className={styles.page}>
      <Toast toasts={toasts} remove={remove} />

      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Manajemen Mahasiswa</h1>
          <p className={styles.pageSub}>Kelola data mahasiswa, reset password, dan status akun</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnOutline} onClick={downloadTemplate}>
            <Download size={15} /> Template
          </button>
          <button className={styles.btnOutline} onClick={() => setModalImport(true)}>
            <Upload size={15} /> Import Excel
          </button>
          <button className={styles.btnPrimary} onClick={() => setModalAdd(true)}>
            <Plus size={15} /> Tambah Mahasiswa
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className={styles.statsGrid}>
        <StatCard icon={Users}        title="Total Mahasiswa" value={total}   subtitle={`${aktifC} akun aktif`}          color="blue"   />
        <StatCard icon={UserCheck}    title="Akun Aktif"      value={aktifC}  subtitle="dapat login sistem"               color="green"  />
        <StatCard icon={GraduationCap}title="SKPI Selesai"    value={selesaiC}subtitle="SKPI sudah diterbitkan"           color="teal"   />
        <StatCard icon={TrendingUp}   title="Rata-rata ICP"   value={avgICP}  subtitle="poin kegiatan mahasiswa"          color="orange" />
      </div>

      {/* ── Toolbar ── */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input className={styles.searchInput} placeholder="Cari nama atau NIM…"
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className={styles.searchClear} onClick={() => setSearch("")}><X size={14} /></button>}
        </div>
        <div className={styles.toolbarRight}>
          <button
            className={`${styles.btnFilter} ${filterOpen || activeFilters ? styles.btnFilterActive : ""}`}
            onClick={() => setFilterOpen(o => !o)}
          >
            <Filter size={14} /> Filter
            {activeFilters > 0 && <span className={styles.filterBadge}>{activeFilters}</span>}
            <ChevronDown size={13} className={filterOpen ? styles.chevUp : ""} />
          </button>
          <span className={styles.resultCount}>{total} mahasiswa</span>
          <button className={styles.btnOutline} onClick={() => loadData()} title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* ── Filter Panel ── */}
      {filterOpen && (
        <div className={styles.filterPanel}>
          <div className={styles.filterGroup}>
            <p className={styles.filterLabel}>Program Studi</p>
            <div className={styles.chipRow}>
              {["Semua", ...prodiList.map(p => p.nama_prodi)].map(p => (
                <button key={p}
                  className={`${styles.chip} ${filterProdi === p ? styles.chipActive : ""}`}
                  onClick={() => { setFilterProdi(p); setCurrentPage(1); loadData(search, p, 1); }}
                >{p}</button>
              ))}
            </div>
          </div>
          <div className={styles.filterGroup}>
            <p className={styles.filterLabel}>Angkatan</p>
            <div className={styles.chipRow}>
              {ANGKATAN_LIST.map(a => (
                <button key={a}
                  className={`${styles.chip} ${filterAngkatan === a ? styles.chipActive : ""}`}
                  onClick={() => { setFilterAngkatan(a); setCurrentPage(1); }}
                >{a}</button>
              ))}
            </div>
          </div>
          <div className={styles.filterGroup}>
            <p className={styles.filterLabel}>Status SKPI</p>
            <div className={styles.chipRow}>
              {STATUS_SKPI.map(s => (
                <button key={s}
                  className={`${styles.chip} ${filterStatus === s ? styles.chipActive : ""}`}
                  onClick={() => { setFilterStatus(s); setCurrentPage(1); }}
                >{s}</button>
              ))}
            </div>
          </div>
          {activeFilters > 0 && (
            <button className={styles.btnResetFilter} onClick={resetFilter}>
              <RefreshCw size={13} /> Reset Filter
            </button>
          )}
        </div>
      )}

      {/* ── Table ── */}
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
              <th className={styles.thCenter}>Akun</th>
              <th className={styles.thCenter}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {/* Loading state */}
            {loading && (
              <tr>
                <td colSpan={9} className={styles.emptyTd}>
                  <div className={styles.emptyState}>
                    <Loader2 size={32} className={styles.spin} />
                    <p>Memuat data...</p>
                  </div>
                </td>
              </tr>
            )}

            {/* Empty state */}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={9} className={styles.emptyTd}>
                  <div className={styles.emptyState}>
                    <Users size={44} />
                    <p>Tidak ada data mahasiswa</p>
                    <span>Coba ubah filter atau tambah mahasiswa baru</span>
                  </div>
                </td>
              </tr>
            )}

            {/* Data rows */}
            {!loading && filtered.map((row, idx) => {
              const prodiColor = PRODI_COLORS[row.nama_prodi]?.primary || "#6b7280";
              const prodiLight = PRODI_COLORS[row.nama_prodi]?.light   || "#f1f5f9";
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
                    <span className={styles.prodiBadge}
                      style={{ backgroundColor: prodiLight, color: prodiColor, borderLeft: `3px solid ${prodiColor}` }}>
                      {row.nama_prodi}
                    </span>
                  </td>
                  <td className={styles.tdCenter}>{row.angkatan}</td>
                  <td className={styles.emailCell}>{row.email}</td>
                  <td className={styles.tdCenter}><StatusBadge status={row.status_skpi} /></td>
                  <td className={styles.tdCenter}>
                    <span className={`${styles.akunDot} ${row.aktif ? styles.dotOn : (row.has_akun ? styles.dotOff : styles.dotNone)}`}>
                      {row.aktif ? "Aktif" : row.has_akun ? "Nonaktif" : "Belum ada"}
                    </span>
                  </td>
                  <td className={styles.tdCenter}>
                    <RowActions
                      row={row}
                      onEdit={() => setModalEdit(row)}
                      onResetPw={() => setModalReset(row)}
                      onToggleActive={() => handleToggle(row)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <span className={styles.paginInfo}>
            {total === 0 ? 0 : start + 1}–{Math.min(start + PER_PAGE, total)} dari {total}
          </span>
          <div className={styles.paginBtns}>
            <button className={styles.pBtn} onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>«</button>
            <button className={styles.pBtn} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
              <ChevronLeft size={13} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce((acc, p, i, arr) => {
                if (i > 0 && arr[i-1] !== p - 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) => p === "…"
                ? <span key={`d${i}`} className={styles.pDots}>…</span>
                : <button key={p}
                    className={`${styles.pBtn} ${currentPage === p ? styles.pBtnActive : ""}`}
                    onClick={() => setCurrentPage(p)}>{p}</button>
              )}
            <button className={styles.pBtn} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              <ChevronRight size={13} />
            </button>
            <button className={styles.pBtn} onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>»</button>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {modalAdd    && <MahasiswaFormModal mode="add"  prodiList={prodiList} onClose={() => setModalAdd(false)}   onSave={handleAddSave} />}
      {modalEdit   && <MahasiswaFormModal mode="edit" data={modalEdit} prodiList={prodiList} onClose={() => setModalEdit(null)}  onSave={handleEditSave} />}
      {modalReset  && <ResetPasswordModal mahasiswa={modalReset} onClose={() => setModalReset(null)} onDone={handleResetDone} />}
      {modalImport && <ImportExcelModal   onClose={() => setModalImport(false)} onDone={handleImportDone} />}
    </div>
  );
}