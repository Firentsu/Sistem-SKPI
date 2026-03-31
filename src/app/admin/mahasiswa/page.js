"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Search, Plus, Upload, Download, Edit2, KeyRound,
  ToggleLeft, ToggleRight, ChevronLeft, ChevronRight,
  X, Check, AlertCircle, Users, FileSpreadsheet,
  GraduationCap, Activity, Filter, MoreVertical,
  Eye, EyeOff, RefreshCw, CheckCircle2, XCircle,
  TrendingUp, Award, ChevronDown,
} from "lucide-react";
import styles from "./mahasiswa.module.css";

/* ─── Constants ─── */
const PER_PAGE = 10;
const PRODI_LIST = ["Semua", "Teknik Informatika", "Manajemen", "Akuntansi", "Sistem Informasi"];
const ANGKATAN_LIST = ["Semua", "2024", "2023", "2022", "2021", "2020", "2019"];
const STATUS_SKPI = ["Semua", "Belum", "Proses", "Selesai"];

/* ─── Mock data ─── */
function generateMock() {
  const prodiList = ["Teknik Informatika", "Manajemen", "Akuntansi", "Sistem Informasi"];
  const statusList = ["Belum", "Proses", "Selesai"];
  const names = [
    "Andi Pratama", "Budi Santoso", "Citra Dewi", "Dian Pertiwi", "Eko Wibowo",
    "Fitri Handayani", "Galuh Pramesti", "Hendra Kusuma", "Indah Permata", "Joko Widodo",
    "Kartika Sari", "Luthfi Hakim", "Maya Sari", "Nando Pratama", "Oktavia Putri",
    "Prima Yudha", "Riani Astuti", "Surya Darma", "Tania Lestari", "Umar Said",
    "Vera Kusuma", "Wahyu Ramadan", "Xena Pratiwi", "Yoga Santoso", "Zahra Nadia",
    "Arif Rahman", "Bella Sondang", "Cahya Nugroho", "Dedy Hardiansyah", "Elisa Putri",
  ];
  return names.map((nama, i) => ({
    id: i + 1,
    nama,
    nim: `20${String(20 + (i % 5)).padStart(2, "0")}${String(1001 + i).padStart(6, "0")}`,
    id_prodi: prodiList[i % prodiList.length],
    angkatan: String(2019 + (i % 6)),
    email: `${nama.split(" ")[0].toLowerCase()}@student.isb.ac.id`,
    status_skpi: statusList[i % statusList.length],
    jumlah_kegiatan: Math.floor(Math.random() * 15) + 1,
    total_icp: Math.floor(Math.random() * 120) + 20,
    aktif: i % 7 !== 0,
  }));
}

const ALL_DATA = generateMock();

/* ─── Toast ─── */
function Toast({ toasts, remove }) {
  return (
    <div className={styles.toastStack}>
      {toasts.map((t) => (
        <div key={t.id} className={`${styles.toast} ${styles[`toast_${t.type}`]}`}>
          {t.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          <span>{t.msg}</span>
          <button className={styles.toastClose} onClick={() => remove(t.id)}><X size={12} /></button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);
  const remove = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);
  return { toasts, add, remove };
}

/* ─── Status Badge ─── */
function StatusBadge({ status }) {
  const map = {
    Selesai: styles.badgeSelesai,
    Proses: styles.badgeProses,
    Belum: styles.badgeBelum,
  };
  return <span className={`${styles.badge} ${map[status] ?? styles.badgeBelum}`}>{status}</span>;
}

/* ─── Modal: Tambah / Edit ─── */
function FormModal({ mode, data, onClose, onSave }) {
  const initial = data ?? {
    nama: "", nim: "", id_prodi: "Teknik Informatika",
    angkatan: "2024", email: "", status_skpi: "Belum",
    jumlah_kegiatan: 0, total_icp: 0, aktif: true,
  };
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function validate() {
    const e = {};
    if (!form.nama.trim()) e.nama = "Nama wajib diisi";
    if (!form.nim.trim()) e.nim = "NIM wajib diisi";
    if (!form.email.trim()) e.email = "Email wajib diisi";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Format email tidak valid";
    return e;
  }

  async function handleSave() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 700)); // simulate API
    onSave(form);
    setSaving(false);
  }

  function set(k, v) {
    setForm(p => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(p => { const n = { ...p }; delete n[k]; return n; });
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <div className={styles.modalHeadIcon}>
            {mode === "add" ? <Plus size={15} /> : <Edit2 size={15} />}
          </div>
          <span className={styles.modalTitle}>{mode === "add" ? "Tambah Mahasiswa" : "Edit Mahasiswa"}</span>
          <button className={styles.modalX} onClick={onClose}><X size={14} /></button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nama Lengkap <span className={styles.req}>*</span></label>
              <input className={`${styles.input} ${errors.nama ? styles.inputError : ""}`}
                value={form.nama} onChange={e => set("nama", e.target.value)} placeholder="Masukkan nama lengkap" />
              {errors.nama && <p className={styles.errMsg}><AlertCircle size={11} />{errors.nama}</p>}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>NIM <span className={styles.req}>*</span></label>
              <input className={`${styles.input} ${errors.nim ? styles.inputError : ""}`}
                value={form.nim} onChange={e => set("nim", e.target.value)} placeholder="Contoh: 202200001001" />
              {errors.nim && <p className={styles.errMsg}><AlertCircle size={11} />{errors.nim}</p>}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Program Studi</label>
              <select className={styles.input} value={form.id_prodi} onChange={e => set("id_prodi", e.target.value)}>
                {PRODI_LIST.filter(p => p !== "Semua").map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Angkatan</label>
              <select className={styles.input} value={form.angkatan} onChange={e => set("angkatan", e.target.value)}>
                {ANGKATAN_LIST.filter(a => a !== "Semua").map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div className={`${styles.formGroup} ${styles.fullCol}`}>
              <label className={styles.label}>Email <span className={styles.req}>*</span></label>
              <input className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                value={form.email} onChange={e => set("email", e.target.value)} placeholder="nama@student.isb.ac.id" type="email" />
              {errors.email && <p className={styles.errMsg}><AlertCircle size={11} />{errors.email}</p>}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Status SKPI</label>
              <select className={styles.input} value={form.status_skpi} onChange={e => set("status_skpi", e.target.value)}>
                {["Belum", "Proses", "Selesai"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Status Akun</label>
              <div className={styles.toggleRow}>
                <button type="button"
                  className={`${styles.toggleBtn} ${form.aktif ? styles.toggleOn : styles.toggleOff}`}
                  onClick={() => set("aktif", !form.aktif)}>
                  {form.aktif ? <><ToggleRight size={18} />Aktif</> : <><ToggleLeft size={18} />Nonaktif</>}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.modalFoot}>
          <button className={styles.btnOutline} onClick={onClose}>Batal</button>
          <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
            {saving ? <><span className={styles.spin} />Menyimpan...</> : <><Check size={14} />Simpan</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Modal: Reset Password ─── */
function ResetPwModal({ mahasiswa, onClose, onDone }) {
  const [loading, setLoading] = useState(false);
  async function handle() {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    onDone();
    setLoading(false);
  }
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.modal} ${styles.modalSm}`} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <div className={`${styles.modalHeadIcon} ${styles.iconWarn}`}><KeyRound size={15} /></div>
          <span className={styles.modalTitle}>Reset Password</span>
          <button className={styles.modalX} onClick={onClose}><X size={14} /></button>
        </div>
        <div className={styles.modalBody}>
          <p className={styles.confirmText}>
            Reset password untuk <strong>{mahasiswa.nama}</strong> ({mahasiswa.nim})?<br />
            Password baru akan dikirim ke <strong>{mahasiswa.email}</strong>.
          </p>
        </div>
        <div className={styles.modalFoot}>
          <button className={styles.btnOutline} onClick={onClose}>Batal</button>
          <button className={`${styles.btnPrimary} ${styles.btnWarn}`} onClick={handle} disabled={loading}>
            {loading ? <><span className={styles.spin} />Mereset...</> : <><KeyRound size={14} />Reset Password</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Modal: Import Excel ─── */
function ImportModal({ onClose, onDone }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  function processFile(f) {
    setError("");
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext)) {
      setError("Format tidak didukung. Gunakan .xlsx, .xls, atau .csv");
      return;
    }
    if (f.size > 5 * 1024 * 1024) { setError("Ukuran file maksimal 5 MB."); return; }
    setFile(f);
  }

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    onDone(Math.floor(Math.random() * 20) + 5);
    setLoading(false);
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <div className={styles.modalHeadIcon}><FileSpreadsheet size={15} /></div>
          <span className={styles.modalTitle}>Import Data Excel</span>
          <button className={styles.modalX} onClick={onClose}><X size={14} /></button>
        </div>
        <div className={styles.modalBody}>
          <div
            className={`${styles.dropZone} ${dragging ? styles.dropActive : ""} ${file ? styles.dropDone : ""}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]); }}
            onClick={() => inputRef.current?.click()}
            role="button" tabIndex={0}
            onKeyDown={e => e.key === "Enter" && inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv"
              className={styles.fileInput} onChange={e => processFile(e.target.files[0])} />
            {file
              ? <><FileSpreadsheet size={32} className={styles.dropIconGreen} />
                  <p className={styles.dropFileName}>{file.name}</p>
                  <p className={styles.dropSub}>{(file.size / 1024).toFixed(1)} KB · Siap diimport</p></>
              : <><Upload size={32} className={styles.dropIcon} />
                  <p className={styles.dropText}>{dragging ? "Lepaskan di sini..." : "Klik atau seret file ke sini"}</p>
                  <p className={styles.dropSub}>.xlsx, .xls, .csv · maks 5 MB</p></>
            }
          </div>
          {error && <p className={styles.errMsg}><AlertCircle size={12} />{error}</p>}
          <div className={styles.importNote}>
            <AlertCircle size={13} />
            <span>Pastikan format kolom sesuai template. <button className={styles.linkBtn} onClick={() => alert("Template didownload!")}>Download template</button></span>
          </div>
        </div>
        <div className={styles.modalFoot}>
          <button className={styles.btnOutline} onClick={onClose}>Batal</button>
          <button className={styles.btnPrimary} onClick={handleImport} disabled={!file || loading}>
            {loading ? <><span className={styles.spin} />Mengimport...</> : <><Upload size={14} />Import Data</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Action Dropdown ─── */
function ActionDropdown({ row, onEdit, onResetPw, onToggleAktif }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function close(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className={styles.dropWrap} ref={ref}>
      <button className={styles.actionBtn} onClick={() => setOpen(p => !p)}>
        <MoreVertical size={15} />
      </button>
      {open && (
        <div className={styles.dropMenu}>
          <button className={styles.dropItem} onClick={() => { onEdit(); setOpen(false); }}>
            <Edit2 size={13} />Edit Data
          </button>
          <button className={styles.dropItem} onClick={() => { onResetPw(); setOpen(false); }}>
            <KeyRound size={13} />Reset Password
          </button>
          <div className={styles.dropDivider} />
          <button className={`${styles.dropItem} ${row.aktif ? styles.dropItemDanger : styles.dropItemSuccess}`}
            onClick={() => { onToggleAktif(); setOpen(false); }}>
            {row.aktif ? <><EyeOff size={13} />Nonaktifkan</> : <><Eye size={13} />Aktifkan</>}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Stat Card ─── */
function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className={`${styles.statCard} ${styles[`stat_${color}`]}`}>
      <div className={styles.statIcon}><Icon size={18} /></div>
      <div className={styles.statBody}>
        <span className={styles.statVal}>{value}</span>
        <span className={styles.statLabel}>{label}</span>
        {sub && <span className={styles.statSub}>{sub}</span>}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function MahasiswaPage() {
  const [data, setData] = useState(ALL_DATA);
  const [q, setQ] = useState("");
  const [prodi, setProdi] = useState("Semua");
  const [angkatan, setAngkatan] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [modalAdd, setModalAdd] = useState(false);
  const [modalEdit, setModalEdit] = useState(null);   // row data
  const [modalReset, setModalReset] = useState(null); // row data
  const [modalImport, setModalImport] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const { toasts, add: toast, remove: removeToast } = useToast();

  /* ── Filtering ── */
  const filtered = data.filter(r => {
    const matchQ = !q || r.nama.toLowerCase().includes(q.toLowerCase()) || r.nim.includes(q);
    const matchProdi = prodi === "Semua" || r.id_prodi === prodi;
    const matchAngk = angkatan === "Semua" || r.angkatan === angkatan;
    const matchStatus = statusFilter === "Semua" || r.status_skpi === statusFilter;
    return matchQ && matchProdi && matchAngk && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  /* ── Stats ── */
  const stats = {
    total: data.length,
    aktif: data.filter(r => r.aktif).length,
    selesai: data.filter(r => r.status_skpi === "Selesai").length,
    avgIcp: Math.round(data.reduce((s, r) => s + r.total_icp, 0) / data.length),
  };

  /* ── Handlers ── */
  function handleSearch(v) { setQ(v); setPage(1); }
  function handleProdi(v) { setProdi(v); setPage(1); }
  function handleAngkatan(v) { setAngkatan(v); setPage(1); }
  function handleStatus(v) { setStatusFilter(v); setPage(1); }

  function handleSaveAdd(form) {
    const newRow = { ...form, id: Date.now(), jumlah_kegiatan: 0, total_icp: 0 };
    setData(p => [newRow, ...p]);
    setModalAdd(false);
    toast("Mahasiswa berhasil ditambahkan");
  }

  function handleSaveEdit(form) {
    setData(p => p.map(r => r.id === form.id ? { ...r, ...form } : r));
    setModalEdit(null);
    toast("Data berhasil diperbarui");
  }

  function handleResetDone() {
    setModalReset(null);
    toast("Password berhasil direset, email telah dikirim");
  }

  function handleToggleAktif(row) {
    setData(p => p.map(r => r.id === row.id ? { ...r, aktif: !r.aktif } : r));
    toast(`Akun ${row.nama} ${row.aktif ? "dinonaktifkan" : "diaktifkan"}`);
  }

  function handleImportDone(count) {
    setModalImport(false);
    toast(`Berhasil mengimport ${count} data mahasiswa`);
  }

  function handleDownloadTemplate() {
    toast("Template Excel didownload", "success");
  }

  const activeFilters = [prodi, angkatan, statusFilter].filter(v => v !== "Semua").length;

  return (
    <div className={styles.page}>
      <Toast toasts={toasts} remove={removeToast} />

      {/* ── Header ── */}
      <div className={styles.pageHead}>
        <div className={styles.pageHeadLeft}>
          <div className={styles.pageIcon}><GraduationCap size={20} /></div>
          <div>
            <h1 className={styles.pageTitle}>Manajemen Mahasiswa</h1>
            <p className={styles.pageDesc}>Kelola seluruh data mahasiswa terdaftar di sistem SKPI</p>
          </div>
        </div>
        <div className={styles.pageHeadActions}>
          <button className={styles.btnOutline} onClick={handleDownloadTemplate}>
            <Download size={14} />Template
          </button>
          <button className={styles.btnOutline} onClick={() => setModalImport(true)}>
            <Upload size={14} />Import Excel
          </button>
          <button className={styles.btnPrimary} onClick={() => setModalAdd(true)}>
            <Plus size={14} />Tambah Mahasiswa
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className={styles.statsRow}>
        <StatCard icon={Users} label="Total Mahasiswa" value={stats.total} sub={`${stats.aktif} akun aktif`} color="blue" />
        <StatCard icon={CheckCircle2} label="SKPI Selesai" value={stats.selesai} sub={`${Math.round(stats.selesai / stats.total * 100)}% dari total`} color="green" />
        <StatCard icon={Activity} label="Rata-rata ICP" value={stats.avgIcp} sub="Seluruh mahasiswa" color="purple" />
        <StatCard icon={Award} label="Mahasiswa Aktif" value={stats.aktif} sub={`${data.length - stats.aktif} nonaktif`} color="orange" />
      </div>

      {/* ── Toolbar ── */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Cari nama atau NIM..."
            value={q}
            onChange={e => handleSearch(e.target.value)}
          />
          {q && <button className={styles.searchClear} onClick={() => handleSearch("")}><X size={13} /></button>}
        </div>

        <div className={styles.toolbarRight}>
          <button
            className={`${styles.filterToggle} ${filterOpen || activeFilters > 0 ? styles.filterToggleActive : ""}`}
            onClick={() => setFilterOpen(p => !p)}
          >
            <Filter size={14} />
            Filter
            {activeFilters > 0 && <span className={styles.filterBadge}>{activeFilters}</span>}
            <ChevronDown size={12} className={filterOpen ? styles.chevronUp : ""} />
          </button>
          <div className={styles.resultCount}>
            {filtered.length} mahasiswa
          </div>
        </div>
      </div>

      {/* ── Filter Panel ── */}
      {filterOpen && (
        <div className={styles.filterPanel}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Program Studi</label>
            <div className={styles.filterChips}>
              {PRODI_LIST.map(p => (
                <button key={p}
                  className={`${styles.chip} ${prodi === p ? styles.chipActive : ""}`}
                  onClick={() => handleProdi(p)}>{p}</button>
              ))}
            </div>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Angkatan</label>
            <div className={styles.filterChips}>
              {ANGKATAN_LIST.map(a => (
                <button key={a}
                  className={`${styles.chip} ${angkatan === a ? styles.chipActive : ""}`}
                  onClick={() => handleAngkatan(a)}>{a}</button>
              ))}
            </div>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Status SKPI</label>
            <div className={styles.filterChips}>
              {STATUS_SKPI.map(s => (
                <button key={s}
                  className={`${styles.chip} ${statusFilter === s ? styles.chipActive : ""}`}
                  onClick={() => handleStatus(s)}>{s}</button>
              ))}
            </div>
          </div>
          {activeFilters > 0 && (
            <button className={styles.resetFilter} onClick={() => {
              setProdi("Semua"); setAngkatan("Semua"); setStatusFilter("Semua"); setPage(1);
            }}>
              <RefreshCw size={12} />Reset Filter
            </button>
          )}
        </div>
      )}

      {/* ── Table ── */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thNo}>#</th>
              <th>Nama</th>
              <th>NIM</th>
              <th>Program Studi</th>
              <th>Angkatan</th>
              <th>Email</th>
              <th className={styles.thCenter}>Status SKPI</th>
              <th className={styles.thCenter}>Kegiatan</th>
              <th className={styles.thCenter}>Total ICP</th>
              <th className={styles.thCenter}>Akun</th>
              <th className={styles.thCenter}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={11} className={styles.emptyRow}>
                  <div className={styles.emptyState}>
                    <GraduationCap size={36} className={styles.emptyIcon} />
                    <p>Tidak ada data mahasiswa ditemukan</p>
                    <span>Coba ubah filter atau kata kunci pencarian</span>
                  </div>
                </td>
              </tr>
            ) : pageRows.map((row, idx) => (
              <tr key={row.id} className={!row.aktif ? styles.rowInactive : ""}>
                <td className={styles.tdNo}>{(safePage - 1) * PER_PAGE + idx + 1}</td>
                <td>
                  <div className={styles.nameCell}>
                    <div className={styles.avatar}>{row.nama.charAt(0)}</div>
                    <span className={styles.nameText}>{row.nama}</span>
                  </div>
                </td>
                <td><span className={styles.nimText}>{row.nim}</span></td>
                <td>
                  <span className={styles.prodiTag}>{row.id_prodi}</span>
                </td>
                <td className={styles.tdCenter}>{row.angkatan}</td>
                <td className={styles.emailText}>{row.email}</td>
                <td className={styles.tdCenter}><StatusBadge status={row.status_skpi} /></td>
                <td className={styles.tdCenter}>
                  <span className={styles.numCell}>{row.jumlah_kegiatan}</span>
                </td>
                <td className={styles.tdCenter}>
                  <span className={`${styles.numCell} ${styles.icpCell}`}>{row.total_icp}</span>
                </td>
                <td className={styles.tdCenter}>
                  <span className={`${styles.statusDot} ${row.aktif ? styles.dotActive : styles.dotInactive}`}>
                    {row.aktif ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className={styles.tdCenter}>
                  <ActionDropdown
                    row={row}
                    onEdit={() => setModalEdit(row)}
                    onResetPw={() => setModalReset(row)}
                    onToggleAktif={() => handleToggleAktif(row)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <div className={styles.pagination}>
        <div className={styles.pageInfo}>
          Menampilkan <strong>{pageRows.length > 0 ? (safePage - 1) * PER_PAGE + 1 : 0}–{Math.min(safePage * PER_PAGE, filtered.length)}</strong> dari <strong>{filtered.length}</strong> mahasiswa
        </div>
        <div className={styles.pageControls}>
          <button className={styles.pageBtn} onClick={() => setPage(1)} disabled={safePage === 1}>«</button>
          <button className={styles.pageBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>
            <ChevronLeft size={14} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
            .reduce((acc, p, i, arr) => {
              if (i > 0 && arr[i - 1] !== p - 1) acc.push("...");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "..." ? (
                <span key={`e${i}`} className={styles.pageDots}>…</span>
              ) : (
                <button key={p}
                  className={`${styles.pageBtn} ${safePage === p ? styles.pageBtnActive : ""}`}
                  onClick={() => setPage(p)}>{p}</button>
              )
            )
          }

          <button className={styles.pageBtn} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>
            <ChevronRight size={14} />
          </button>
          <button className={styles.pageBtn} onClick={() => setPage(totalPages)} disabled={safePage === totalPages}>»</button>
        </div>
        <div className={styles.pagePerPage}>
          <span className={styles.pagePerLabel}>Per halaman:</span>
          <span className={styles.pagePerVal}>{PER_PAGE}</span>
        </div>
      </div>

      {/* ── Modals ── */}
      {modalAdd && <FormModal mode="add" onClose={() => setModalAdd(false)} onSave={handleSaveAdd} />}
      {modalEdit && <FormModal mode="edit" data={modalEdit} onClose={() => setModalEdit(null)} onSave={handleSaveEdit} />}
      {modalReset && <ResetPwModal mahasiswa={modalReset} onClose={() => setModalReset(null)} onDone={handleResetDone} />}
      {modalImport && <ImportModal onClose={() => setModalImport(false)} onDone={handleImportDone} />}
    </div>
  );
}