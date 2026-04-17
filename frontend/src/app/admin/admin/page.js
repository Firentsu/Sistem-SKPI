"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, Plus, Edit2, KeyRound, ToggleLeft, ToggleRight,
  ChevronLeft, ChevronRight, X, Check, AlertCircle, Users,
  Filter, MoreVertical, Eye, EyeOff, RefreshCw, CheckCircle2,
  Shield, UserCog, Mail, AtSign, Trash2, ShieldCheck, ShieldOff,
  ChevronDown,
} from "lucide-react";
import styles from "./page.module.css";

/* ─────────────────────────────────────────
   CONSTANTS & MOCK DATA
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
   MODAL TAMBAH ADMIN
───────────────────────────────────────── */
function AdminFormModal({ mode, data, onClose, onSave }) {
  const initial = data || {
    nama: "", username: "", email: "",
    password: "", password_confirm: "",
    aktif: true,
  };
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
              <p className={styles.modalSub}>Kirim password baru ke email admin</p>
            </div>
          </div>
          <button className={styles.modalCloseBtn} onClick={onClose}><X size={17} /></button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.confirmBox}>
            <p>Reset password untuk <strong>{admin.nama}</strong>?</p>
            <p className={styles.confirmNote}>Password baru dikirim ke <strong>{admin.email}</strong></p>
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
    await new Promise(r => setTimeout(r, 700));
    onDone();
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
  const [data, setData] = useState(MOCK_ADMINS);
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalAdd, setModalAdd] = useState(false);
  const [modalEdit, setModalEdit] = useState(null);
  const [modalReset, setModalReset] = useState(null);
  const [modalDelete, setModalDelete] = useState(null);
  const { toasts, add: toast, remove } = useToast();

  const filtered = data.filter(row =>
    !search || 
    row.nama.toLowerCase().includes(search.toLowerCase()) ||
    row.username.toLowerCase().includes(search.toLowerCase()) ||
    row.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const safePage = Math.min(currentPage, totalPages || 1);
  const start = (safePage - 1) * PER_PAGE;
  const paged = filtered.slice(start, start + PER_PAGE);

  const total = data.length;
  const aktifCount = data.filter(r => r.aktif).length;

  const handleAddSave = d => {
    setData(prev => [{ ...d, id: Math.max(0, ...prev.map(x => x.id)) + 1, created_at: new Date().toISOString().split("T")[0], last_login: "-" }, ...prev]);
    setModalAdd(false);
    toast("Admin baru berhasil ditambahkan");
  };

  const handleEditSave = d => {
    setData(prev => prev.map(r => r.id === d.id ? { ...r, ...d } : r));
    setModalEdit(null);
    toast("Data admin diperbarui");
  };

  const handleResetDone = () => {
    setModalReset(null);
    toast("Password direset, email telah dikirim");
  };

  const handleDeleteDone = () => {
    setData(prev => prev.filter(r => r.id !== modalDelete.id));
    setModalDelete(null);
    toast("Admin berhasil dihapus", "error");
  };

  const handleToggleActive = row => {
    setData(prev => prev.map(r => r.id === row.id ? { ...r, aktif: !r.aktif } : r));
    toast(`Akun ${row.nama} ${row.aktif ? "dinonaktifkan" : "diaktifkan"}`);
  };

  const resetFilter = () => {
    setSearch("");
    setCurrentPage(1);
  };

  const activeFilters = search ? 1 : 0;

  return (
    <div className={styles.page}>
      <Toast toasts={toasts} remove={remove} />

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Manajemen Administrator</h1>
          <p className={styles.pageSub}>Kelola akun admin, reset password, dan status akun</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnPrimary} onClick={() => setModalAdd(true)}>
            <Plus size={15} /> Tambah Admin
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className={styles.statsGrid}>
        <StatCard icon={UserCog} title="Total Admin" value={total} subtitle={`${aktifCount} akun aktif`} color="blue" />
        <StatCard icon={Shield} title="Admin Aktif" value={aktifCount} subtitle="dapat mengakses sistem" color="green" />
        <StatCard icon={RefreshCw} title="Nonaktif" value={total - aktifCount} subtitle="akun dibekukan" color="orange" />
      </div>

      {/* Search & Filter */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Cari nama, username, atau email…"
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
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
          <span className={styles.resultCount}>{filtered.length} admin</span>
        </div>
      </div>

      {/* Filter Panel (hanya untuk info, tanpa role filter) */}
      {filterOpen && (
        <div className={styles.filterPanel}>
          <div className={styles.filterGroup}>
            <p className={styles.filterLabel}>Pencarian aktif</p>
            <div className={styles.chipRow}>
              <span className={styles.filterInfo}>Menampilkan admin yang sesuai dengan kata kunci "{search || '-'}"</span>
            </div>
          </div>
          {activeFilters > 0 && (
            <button className={styles.btnResetFilter} onClick={resetFilter}>
              <RefreshCw size={13} /> Reset Filter
            </button>
          )}
        </div>
      )}

      {/* Table */}
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
            {paged.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.emptyTd}>
                  <div className={styles.emptyState}>
                    <UserCog size={44} />
                    <p>Tidak ada data administrator</p>
                    <span>Tambah admin baru dengan klik tombol di atas</span>
                  </div>
                </td>
              </tr>
            ) : paged.map((row, idx) => (
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <span className={styles.paginInfo}>
            {filtered.length === 0 ? 0 : start + 1}–{Math.min(start + PER_PAGE, filtered.length)} dari {filtered.length}
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

      {/* Modals */}
      {modalAdd && <AdminFormModal mode="add" onClose={() => setModalAdd(false)} onSave={handleAddSave} />}
      {modalEdit && <AdminFormModal mode="edit" data={modalEdit} onClose={() => setModalEdit(null)} onSave={handleEditSave} />}
      {modalReset && <ResetPasswordModal admin={modalReset} onClose={() => setModalReset(null)} onDone={handleResetDone} />}
      {modalDelete && <DeleteAdminModal admin={modalDelete} onClose={() => setModalDelete(null)} onDone={handleDeleteDone} />}
    </div>
  );
}