// frontend/src/app/admin/admin/page.js
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  Search, Plus, Edit2, KeyRound, ToggleLeft, ToggleRight,
  ChevronLeft, ChevronRight, X, Check, AlertCircle, Users,
  Filter, MoreVertical, Eye, EyeOff, RefreshCw, CheckCircle2,
  Shield, UserCog, Mail, AtSign, Trash2, ShieldCheck, ShieldOff,
  ChevronDown, Upload, Download, FileSpreadsheet, Loader2,
} from "lucide-react";
import styles from "./page.module.css";
import {
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  resetAdminPassword,
  isMockMode,
} from "@/lib/api";

/* ─────────────────────────────────────────
   CONSTANTS & MOCK DATA (fallback)
───────────────────────────────────────── */
const PER_PAGE = 10;

const MOCK_ADMINS = [
  { id: 1, nama: "Dr. Antonius Wibowo", username: "antonius", email: "antonius@isb.ac.id", aktif: true, created_at: "2022-01-10", last_login: "2026-04-17" },
  { id: 2, nama: "Maria Goreti, S.Kom", username: "maria_g", email: "mariag@isb.ac.id", aktif: true, created_at: "2022-03-05", last_login: "2026-04-16" },
  { id: 3, nama: "Benediktus Hartono", username: "bene_h", email: "benediktus@isb.ac.id", aktif: true, created_at: "2023-07-14", last_login: "2026-04-10" },
  { id: 4, nama: "Theresia Lestari", username: "theresia", email: "theresia@isb.ac.id", aktif: true, created_at: "2024-01-20", last_login: "2026-03-28" },
  { id: 5, nama: "Fransiskus Daud", username: "fran_d", email: "fransiskus@isb.ac.id", aktif: false, created_at: "2023-09-01", last_login: "2025-12-01" },
];

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
   PASSWORD INPUT
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
   MODAL TAMBAH / EDIT ADMIN
───────────────────────────────────────── */
function AdminFormModal({ mode, data, onClose, onSave }) {
  const initial = data
    ? { nama: data.nama, username: data.username, email: data.email, aktif: data.aktif, password: "", password_confirm: "" }
    : { nama: "", username: "", email: "", password: "", password_confirm: "", aktif: true };

  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const setField = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }));
  };

  const validate = () => {
    const err = {};
    if (!form.nama.trim()) err.nama = "Nama wajib diisi.";
    if (!form.username.trim()) err.username = "Username wajib diisi.";
    else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) err.username = "Hanya huruf, angka, underscore.";
    if (!form.email.trim()) err.email = "Email wajib diisi.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) err.email = "Format email tidak valid.";
    if (mode === "add") {
      if (!form.password) err.password = "Password wajib diisi.";
      else if (form.password.length < 8) err.password = "Minimal 8 karakter.";
      if (form.password !== form.password_confirm) err.password_confirm = "Konfirmasi tidak cocok.";
    }
    return err;
  };

  const handleSave = async () => {
    const err = validate();
    if (Object.keys(err).length) { setErrors(err); return; }
    setSaving(true);
    const { password_confirm, ...payload } = form;
    await onSave(payload);
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
              <h3 className={styles.modalTitle}>{mode === "add" ? "Tambah Admin" : "Edit Data Admin"}</h3>
              <p className={styles.modalSub}>Isi data akun administrator sistem</p>
            </div>
          </div>
          <button className={styles.modalCloseBtn} onClick={onClose}><X size={17} /></button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formSection}>DATA ADMINISTRATOR</div>
          <div className={styles.formGrid2}>
            <div className={`${styles.fg} ${styles.fullSpan}`}>
              <label className={styles.fl}>Nama Lengkap <span className={styles.req}>*</span></label>
              <input
                className={`${styles.input} ${errors.nama ? styles.inputErr : ""}`}
                value={form.nama}
                onChange={e => setField("nama", e.target.value)}
                placeholder="Nama lengkap admin"
              />
              {errors.nama && <small className={styles.errMsg}>{errors.nama}</small>}
            </div>
            <div className={styles.fg}>
              <label className={styles.fl}>Username <span className={styles.req}>*</span></label>
              <div className={styles.inputIconWrap}>
                <AtSign size={14} className={styles.inputIcon} />
                <input
                  className={`${styles.input} ${styles.inputWithIcon} ${errors.username ? styles.inputErr : ""}`}
                  value={form.username}
                  onChange={e => setField("username", e.target.value)}
                  placeholder="contoh: admin_isb"
                  disabled={mode === "edit"}
                />
              </div>
              {errors.username && <small className={styles.errMsg}>{errors.username}</small>}
            </div>
            <div className={styles.fg}>
              <label className={styles.fl}>Email <span className={styles.req}>*</span></label>
              <div className={styles.inputIconWrap}>
                <Mail size={14} className={styles.inputIcon} />
                <input
                  type="email"
                  className={`${styles.input} ${styles.inputWithIcon} ${errors.email ? styles.inputErr : ""}`}
                  value={form.email}
                  onChange={e => setField("email", e.target.value)}
                  placeholder="admin@isb.ac.id"
                />
              </div>
              {errors.email && <small className={styles.errMsg}>{errors.email}</small>}
            </div>
          </div>

          {mode === "add" && (
            <>
              <div className={styles.formSection}>KATA SANDI</div>
              <div className={styles.formGrid2}>
                <div className={styles.fg}>
                  <label className={styles.fl}>Password <span className={styles.req}>*</span></label>
                  <PasswordInput
                    value={form.password}
                    onChange={e => setField("password", e.target.value)}
                    placeholder="Minimal 8 karakter"
                  />
                  {errors.password && <small className={styles.errMsg}>{errors.password}</small>}
                </div>
                <div className={styles.fg}>
                  <label className={styles.fl}>Konfirmasi Password <span className={styles.req}>*</span></label>
                  <PasswordInput
                    value={form.password_confirm}
                    onChange={e => setField("password_confirm", e.target.value)}
                    placeholder="Ulangi password"
                  />
                  {errors.password_confirm && <small className={styles.errMsg}>{errors.password_confirm}</small>}
                </div>
              </div>
            </>
          )}

          <div className={styles.formSection}>STATUS AKUN</div>
          <div className={styles.formGrid2}>
            <div className={styles.fg}>
              <label className={styles.fl}>Status Akun</label>
              <button
                type="button"
                className={`${styles.toggleBtn} ${form.aktif ? styles.toggleOn : styles.toggleOff}`}
                onClick={() => setField("aktif", !form.aktif)}
              >
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
            {saving ? "Menyimpan…" : mode === "add" ? "Tambah Admin" : "Simpan Perubahan"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MODAL RESET PASSWORD
───────────────────────────────────────── */
function ResetPasswordModal({ admin, onClose, onDone }) {
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
              <p className={styles.modalSub}>Reset password admin ke default</p>
            </div>
          </div>
          <button className={styles.modalCloseBtn} onClick={onClose}><X size={17} /></button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.confirmBox}>
            <p>Reset password untuk <strong>{admin.nama}</strong>?</p>
            <p className={styles.confirmNote}>Password baru: <strong>Admin1234!</strong></p>
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
   MODAL HAPUS ADMIN
───────────────────────────────────────── */
function DeleteAdminModal({ admin, onClose, onDone }) {
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
            <div className={`${styles.modalHeaderIcon} ${styles.iconDanger}`}><Trash2 size={16} /></div>
            <div>
              <h3 className={styles.modalTitle}>Hapus Admin</h3>
              <p className={styles.modalSub}>Tindakan ini tidak dapat dibatalkan</p>
            </div>
          </div>
          <button className={styles.modalCloseBtn} onClick={onClose}><X size={17} /></button>
        </div>
        <div className={styles.modalBody}>
          <div className={`${styles.confirmBox} ${styles.confirmBoxDanger}`}>
            <p>Hapus akun <strong>{admin.nama}</strong> ({admin.username})?</p>
            <p className={styles.confirmNote}>Seluruh data akses admin ini akan dihapus permanen.</p>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.btnGhost} onClick={onClose}>Batal</button>
          <button className={`${styles.btnSave} ${styles.btnDanger}`} onClick={handle} disabled={loading}>
            {loading ? <span className={styles.spin} /> : <Trash2 size={15} />}
            {loading ? "Menghapus…" : "Hapus Admin"}
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
    if (!["xlsx", "xls", "csv"].includes(ext)) { setError("Format harus .xlsx, .xls, atau .csv"); return; }
    if (f.size > 5 * 1024 * 1024) { setError("Ukuran maksimal 5 MB"); return; }
    setError("");
    setFile(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      if (rows.length === 0) throw new Error("File kosong");

      const required = ["Nama", "Username", "Email", "Status Akun"];
      const missing = required.filter(col => !(col in rows[0]));
      if (missing.length) throw new Error(`Kolom tidak lengkap: ${missing.join(", ")}`);

      const admins = rows.map(row => ({
        nama: row["Nama"],
        username: row["Username"],
        email: row["Email"],
        aktif: row["Status Akun"] === "Aktif",
        password: row["Password"] || row["Username"],
      }));

      onDone(admins);
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
              <h3 className={styles.modalTitle}>Import Data Admin (Excel)</h3>
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
            <span>Pastikan kolom sesuai template. Kolom Password opsional, default = Username.</span>
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
function RowActions({ row, onEdit, onResetPw, onToggleActive, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  return (
    <div className={styles.ddWrap} ref={ref}>
      <button className={styles.ddTrigger} onClick={() => setOpen(o => !o)}><MoreVertical size={15} /></button>
      {open && (
        <div className={styles.ddMenu}>
          <button onClick={() => { onEdit(); setOpen(false); }}><Edit2 size={13} /> Edit Data</button>
          <button onClick={() => { onResetPw(); setOpen(false); }}><KeyRound size={13} /> Reset Password</button>
          <div className={styles.ddDivider} />
          <button
            className={row.aktif ? styles.ddWarn : styles.ddSuccess}
            onClick={() => { onToggleActive(); setOpen(false); }}>
            {row.aktif ? <ShieldOff size={13} /> : <ShieldCheck size={13} />}
            {row.aktif ? "Nonaktifkan" : "Aktifkan"}
          </button>
          <div className={styles.ddDivider} />
          <button className={styles.ddDanger} onClick={() => { onDelete(); setOpen(false); }}>
            <Trash2 size={13} /> Hapus Admin
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   HALAMAN UTAMA
───────────────────────────────────────── */
export default function AdminManagementPage() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalAdd, setModalAdd] = useState(false);
  const [modalEdit, setModalEdit] = useState(null);
  const [modalReset, setModalReset] = useState(null);
  const [modalDelete, setModalDelete] = useState(null);
  const [modalImport, setModalImport] = useState(false);
  const { toasts, add: toast, remove } = useToast();

<<<<<<< HEAD
  useEffect (() => {
    document.title = "Manajemen Admin | Admin SKPI";
  }, []);

  const downloadTemplateAdmin = () => {
    const templateData = [
      {
        "Nama": "Contoh Admin",
        "Username": "admin_example",
        "Email": "admin@isb.ac.id",
        "Status Akun": "Aktif",
        "Password": "admin123"
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
=======
  // ── Load data dari API ──────────────────────────────────
  const loadData = useCallback(async (q = search, page = currentPage) => {
    setLoading(true);
    const result = await getAdmins({ q, page });
    if (result?.rows) {
      setData(result.rows);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } else if (isMockMode()) {
      // Fallback mock (backend tidak aktif)
      const filtered = MOCK_ADMINS.filter(a =>
        !q || a.nama.toLowerCase().includes(q.toLowerCase()) ||
        a.username.toLowerCase().includes(q.toLowerCase()) ||
        a.email.toLowerCase().includes(q.toLowerCase())
      );
      const start = (page - 1) * PER_PAGE;
      setData(filtered.slice(start, start + PER_PAGE));
      setTotal(filtered.length);
      setTotalPages(Math.ceil(filtered.length / PER_PAGE));
    }
    setLoading(false);
  }, [search, currentPage]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    document.title = "Manajemen Admin | SKPI";
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setCurrentPage(1); loadData(search, 1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // ── Download template Excel ──────────────────────────────
  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{
      "Nama": "Contoh Admin", "Username": "admin_example",
      "Email": "admin@isb.ac.id", "Status Akun": "Aktif", "Password": "admin123",
    }]);
>>>>>>> 75f95f147ac7d3064c6d328a782a6045e64cc6b4
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Admin");
    XLSX.writeFile(wb, "template_admin.xlsx");
    toast("Template berhasil diunduh");
  };

  // ── CRUD handlers ────────────────────────────────────────
  const handleAddSave = async (payload) => {
    const res = await createAdmin(payload);
    if (res.ok) {
      toast("Admin baru berhasil ditambahkan");
      setModalAdd(false);
      setCurrentPage(1);
      loadData(search, 1);
    } else {
      toast(res.data?.error || "Gagal menambah admin", "error");
    }
  };

  const handleEditSave = async (payload) => {
    const res = await updateAdmin(modalEdit.id, payload);
    if (res.ok) {
      toast("Data admin diperbarui");
      setModalEdit(null);
      loadData();
    } else {
      toast(res.data?.error || "Gagal update admin", "error");
    }
  };

  const handleResetDone = async () => {
    const res = await resetAdminPassword(modalReset.id);
    if (res.ok) {
      toast("Password direset ke Admin1234!");
    } else {
      toast(res.data?.error || "Gagal reset password", "error");
    }
    setModalReset(null);
  };

  const handleDeleteDone = async () => {
    const res = await deleteAdmin(modalDelete.id);
    if (res.ok) {
      toast("Admin berhasil dihapus", "error");
      setModalDelete(null);
      loadData(search, Math.max(1, currentPage));
    } else {
      toast(res.data?.error || "Gagal menghapus admin", "error");
      setModalDelete(null);
    }
  };

  const handleToggleActive = async (row) => {
    const res = await updateAdmin(row.id, { aktif: !row.aktif });
    if (res.ok) {
      toast(`Akun ${row.nama} ${row.aktif ? "dinonaktifkan" : "diaktifkan"}`);
      loadData();
    } else {
      toast(res.data?.error || "Gagal mengubah status", "error");
    }
  };

  const handleImportDone = async (admins) => {
    setModalImport(false);
    let success = 0, failed = 0;
    for (const a of admins) {
      const res = await createAdmin(a);
      res.ok ? success++ : failed++;
    }
    toast(`Import selesai: ${success} berhasil${failed ? `, ${failed} gagal` : ""}`,
      failed > 0 ? "error" : "success");
    loadData(search, 1);
  };

  // ── Stats ────────────────────────────────────────────────
  const aktifCount = data.filter(r => r.aktif).length;
  const activeFilters = search ? 1 : 0;

  const safePage = currentPage;
  const start = (safePage - 1) * PER_PAGE;

  return (
    <div className={styles.page}>
      <Toast toasts={toasts} remove={remove} />

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Manajemen Administrator</h1>
          <p className={styles.pageSub}>Kelola akun admin, reset password, dan status akun</p>
        </div>
        <div className={styles.headerActions}>
<<<<<<< HEAD
          <button className={styles.btnOutline} onClick={downloadTemplateAdmin}>
            <Download size={15} /> Cetak
=======
          <button className={styles.btnOutline} onClick={downloadTemplate}>
            <Download size={15} /> Template
>>>>>>> 75f95f147ac7d3064c6d328a782a6045e64cc6b4
          </button>
          <button className={styles.btnOutline} onClick={() => setModalImport(true)}>
            <Upload size={15} /> Import Excel
          </button>
          <button className={styles.btnPrimary} onClick={() => setModalAdd(true)}>
            <Plus size={15} /> Tambah Admin
          </button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <StatCard icon={UserCog} title="Total Admin" value={total} subtitle={`${aktifCount} akun aktif`} color="blue" />
        <StatCard icon={Shield} title="Admin Aktif" value={aktifCount} subtitle="dapat mengakses sistem" color="green" />
        <StatCard icon={RefreshCw} title="Nonaktif" value={total - aktifCount} subtitle="akun dibekukan" color="orange" />
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Cari nama, username, atau email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
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
          <span className={styles.resultCount}>{total} admin</span>
          <button className={styles.btnOutline} onClick={() => loadData()} title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {filterOpen && (
        <div className={styles.filterPanel}>
          <div className={styles.filterGroup}>
            <p className={styles.filterLabel}>Pencarian aktif</p>
            <div className={styles.chipRow}>
              <span className={styles.filterInfo}>Kata kunci: "{search || '-'}"</span>
            </div>
          </div>
          {activeFilters > 0 && (
            <button className={styles.btnResetFilter} onClick={() => setSearch("")}>
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
              <th>Nama Administrator</th>
              <th>Username</th>
              <th>Email</th>
              <th className={styles.thCenter}>Akun</th>
              <th className={styles.thCenter}>Dibuat</th>
              <th className={styles.thCenter}>Login Terakhir</th>
              <th className={styles.thCenter}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className={styles.emptyTd}>
                  <div className={styles.emptyState}>
                    <Loader2 size={32} className={styles.spin} />
                    <p>Memuat data...</p>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.emptyTd}>
                  <div className={styles.emptyState}>
                    <UserCog size={44} />
                    <p>Tidak ada data administrator</p>
                    <span>Tambah admin baru dengan klik tombol di atas</span>
                  </div>
                </td>
              </tr>
            ) : data.map((row, idx) => (
              <tr key={row.id} className={!row.aktif ? styles.rowInactive : ""}>
                <td className={styles.tdNo}>{start + idx + 1}</td>
                <td>
                  <div className={styles.nameCell}>
                    <div className={styles.avatar}>{row.nama.charAt(0)}</div>
                    <span className={styles.nameText}>{row.nama}</span>
                  </div>
                </td>
                <td><span className={styles.nimBadge}>@{row.username}</span></td>
                <td className={styles.emailCell}>{row.email}</td>
                <td className={styles.tdCenter}>
                  <span className={`${styles.akunDot} ${row.aktif ? styles.dotOn : styles.dotOff}`}>
                    {row.aktif ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className={styles.tdCenter}><span className={styles.dateText}>{row.created_at}</span></td>
                <td className={styles.tdCenter}><span className={styles.dateText}>{row.last_login}</span></td>
                <td className={styles.tdCenter}>
                  <RowActions
                    row={row}
                    onEdit={() => setModalEdit(row)}
                    onResetPw={() => setModalReset(row)}
                    onToggleActive={() => handleToggleActive(row)}
                    onDelete={() => setModalDelete(row)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <span className={styles.paginInfo}>
            {total === 0 ? 0 : start + 1}–{Math.min(start + PER_PAGE, total)} dari {total}
          </span>
          <div className={styles.paginBtns}>
            <button className={styles.pBtn} onClick={() => setCurrentPage(1)} disabled={safePage === 1}>«</button>
            <button className={styles.pBtn} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>
              <ChevronLeft size={13} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .reduce((acc, p, i, arr) => {
                if (i > 0 && arr[i - 1] !== p - 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) => p === "…"
                ? <span key={`d${i}`} className={styles.pDots}>…</span>
                : <button key={p} className={`${styles.pBtn} ${safePage === p ? styles.pBtnActive : ""}`} onClick={() => setCurrentPage(p)}>{p}</button>
              )}
            <button className={styles.pBtn} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>
              <ChevronRight size={13} />
            </button>
            <button className={styles.pBtn} onClick={() => setCurrentPage(totalPages)} disabled={safePage === totalPages}>»</button>
          </div>
        </div>
      )}

      {modalAdd && <AdminFormModal mode="add" onClose={() => setModalAdd(false)} onSave={handleAddSave} />}
      {modalEdit && <AdminFormModal mode="edit" data={modalEdit} onClose={() => setModalEdit(null)} onSave={handleEditSave} />}
      {modalReset && <ResetPasswordModal admin={modalReset} onClose={() => setModalReset(null)} onDone={handleResetDone} />}
      {modalDelete && <DeleteAdminModal admin={modalDelete} onClose={() => setModalDelete(null)} onDone={handleDeleteDone} />}
      {modalImport && <ImportExcelModal onClose={() => setModalImport(false)} onDone={handleImportDone} />}
    </div>
  );
}