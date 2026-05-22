"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import {
  Search, Plus, Upload, Download, Edit2, KeyRound,
  ToggleLeft, ToggleRight, ChevronLeft, ChevronRight,
  X, Check, AlertCircle, Users, FileSpreadsheet,
  GraduationCap, Filter, MoreVertical,
  Eye, EyeOff, RefreshCw, CheckCircle2,
  TrendingUp, UserCheck, ChevronDown, Loader2,
  FileText, PieChart as PieChartIcon, Shield,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import styles from "./page.module.css";
import {
  getMahasiswaList,
  createMahasiswa,
  updateMahasiswa,
  resetMahasiswaPassword,
  toggleMahasiswaAkun,
  importMahasiswaBulk,
  getProdiList,
  getAvatarUrl,
} from "@/lib/api";

// ========== MOCK DATA ==========
const USE_MOCK = false;

export const PRODI_CONFIG = {
  "Teknologi Informasi": {
    primary: "#ff7f00", light: "#fff3e6", dark: "#cc6600",
    gradient: "linear-gradient(135deg, #ff7f00, #ffaa33)",
    bg: "#fff3e6", color: "#ff7f00", border: "#ffaa33",
    bgDark: "#cc6600", bgLight: "#fff3e6", dot: "#ff7f00",
    label: "TI", fakultas: "Teknologi",
  },
  "Manajemen": {
    primary: "#0099cc", light: "#e6f5fa", dark: "#0077aa",
    gradient: "linear-gradient(135deg, #0099cc, #33ccff)",
    bg: "#e6f5fa", color: "#0099cc", border: "#33ccff",
    bgDark: "#0077aa", bgLight: "#e6f5fa", dot: "#0099cc",
    label: "MJ", fakultas: "Bisnis",
  },
  "Kewirausahaan": {
    primary: "#ff3300", light: "#ffe6e0", dark: "#cc2900",
    gradient: "linear-gradient(135deg, #ff3300, #ff7755)",
    bg: "#ffe6e0", color: "#ff3300", border: "#ff7755",
    bgDark: "#cc2900", bgLight: "#ffe6e0", dot: "#ff3300",
    label: "KW", fakultas: "Bisnis",
  },
  "Pendidikan Guru Sekolah Dasar": {
    primary: "#800080", light: "#f3e6f3", dark: "#660066",
    gradient: "linear-gradient(135deg, #800080, #b300b3)",
    bg: "#f3e6f3", color: "#800080", border: "#b300b3",
    bgDark: "#660066", bgLight: "#f3e6f3", dot: "#800080",
    label: "PGSD", fakultas: "Pendidikan",
  },
  "Agroekoteknologi": {
    primary: "#00bfb3", light: "#e6faf8", dark: "#009988",
    gradient: "linear-gradient(135deg, #00bfb3, #33ffdd)",
    bg: "#e6faf8", color: "#00bfb3", border: "#33ffdd",
    bgDark: "#009988", bgLight: "#e6faf8", dot: "#00bfb3",
    label: "AGR", fakultas: "Pertanian",
  },
  "Sistem Informasi": {
    primary: "#2563eb", light: "#eff6ff", dark: "#1d4ed8",
    gradient: "linear-gradient(135deg, #2563eb, #3b82f6)",
    bg: "#eff6ff", color: "#1d4ed8", border: "#93c5fd",
    bgDark: "#1e40af", bgLight: "#eff6ff", dot: "#2563eb",
    label: "SI", fakultas: "Teknologi",
  },
};

const PRODI_FALLBACK = [
  { bg: "#f3e8ff", color: "#7e22ce", border: "#d8b4fe", bgDark: "#9333ea", bgLight: "#fdf4ff", label: "?", gradient: "linear-gradient(135deg,#9333ea,#7e22ce)", dot: "#c084fc" },
  { bg: "#fce7f3", color: "#9d174d", border: "#f9a8d4", bgDark: "#db2777", bgLight: "#fdf2f8", label: "?", gradient: "linear-gradient(135deg,#db2777,#9d174d)", dot: "#f472b6" },
  { bg: "#ffedd5", color: "#c2410c", border: "#fdba74", bgDark: "#ea580c", bgLight: "#fff7ed", label: "?", gradient: "linear-gradient(135deg,#ea580c,#c2410c)", dot: "#fb923c" },
];

function getProdiConfig(nama) {
  if (!nama || nama === "-") return PRODI_FALLBACK[0];
  if (PRODI_CONFIG[nama]) return PRODI_CONFIG[nama];
  const hash = (nama || "").split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return PRODI_FALLBACK[hash % PRODI_FALLBACK.length];
}

const MOCK_PRODI_LIST = [
  { id_prodi: "1", nama_prodi: "Teknologi Informasi" },
  { id_prodi: "2", nama_prodi: "Sistem Informasi" },
  { id_prodi: "3", nama_prodi: "Manajemen" },
  { id_prodi: "4", nama_prodi: "Kewirausahaan" },
  { id_prodi: "5", nama_prodi: "Pendidikan Guru Sekolah Dasar" },
  { id_prodi: "6", nama_prodi: "Agroekoteknologi" },
];

const MOCK_MAHASISWA = [
  {
    id_mahasiswa: "M001", nama: "Andi Saputra", nim: "202200001001", id_prodi: "1",
    programstudi: { nama_prodi: "Teknologi Informasi" }, angkatan: "2024",
    email: "andi@student.isb.ac.id", status_skpi: "belum",
    _count: { kegiatanmahasiswa: 3 }, total_icp: 45, foto_profil: null,
    id_user: "U001", users: { status_akun: "aktif" },
  },
  {
    id_mahasiswa: "M002", nama: "Budi Wibowo", nim: "202200001002", id_prodi: "3",
    programstudi: { nama_prodi: "Manajemen" }, angkatan: "2023",
    email: "budi@student.isb.ac.id", status_skpi: "diajukan",
    _count: { kegiatanmahasiswa: 5 }, total_icp: 78, foto_profil: null,
    id_user: "U002", users: { status_akun: "aktif" },
  },
  {
    id_mahasiswa: "M003", nama: "Citra Dewi", nim: "202200001003", id_prodi: "4",
    programstudi: { nama_prodi: "Kewirausahaan" }, angkatan: "2022",
    email: "citra@student.isb.ac.id", status_skpi: "diterbitkan",
    _count: { kegiatanmahasiswa: 8 }, total_icp: 120, foto_profil: null,
    id_user: "U003", users: { status_akun: "aktif" },
  },
  {
    id_mahasiswa: "M004", nama: "Dian Permata", nim: "202200001004", id_prodi: "5",
    programstudi: { nama_prodi: "Pendidikan Guru Sekolah Dasar" }, angkatan: "2024",
    email: "dian@student.isb.ac.id", status_skpi: "direvisi",
    _count: { kegiatanmahasiswa: 2 }, total_icp: 30, foto_profil: null,
    id_user: "U004", users: { status_akun: "nonaktif" },
  },
  {
    id_mahasiswa: "M005", nama: "Eka Pratama", nim: "202200001005", id_prodi: "2",
    programstudi: { nama_prodi: "Sistem Informasi" }, angkatan: "2021",
    email: "eka@student.isb.ac.id", status_skpi: "belum",
    _count: { kegiatanmahasiswa: 1 }, total_icp: 10, foto_profil: null,
    id_user: "U005", users: { status_akun: "aktif" },
  },
  {
    id_mahasiswa: "M006", nama: "Fajar Nugroho", nim: "202200001006", id_prodi: "6",
    programstudi: { nama_prodi: "Agroekoteknologi" }, angkatan: "2023",
    email: "fajar@student.isb.ac.id", status_skpi: "diajukan",
    _count: { kegiatanmahasiswa: 4 }, total_icp: 62, foto_profil: null,
    id_user: "U006", users: { status_akun: "aktif" },
  },
];

/* ── TOAST ── */
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

/* ── PRODI CHIP ── */
function ProdiChip({ nama }) {
  const cfg = getProdiConfig(nama);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "4px 10px 4px 6px", borderRadius: "20px",
      fontSize: "11.5px", fontWeight: 700,
      background: cfg.bg, color: cfg.color,
      border: `1.5px solid ${cfg.border}`, whiteSpace: "nowrap",
    }}>
      <span style={{
        width: "18px", height: "18px", borderRadius: "50%",
        background: cfg.gradient, color: "#fff", fontSize: "8px",
        fontWeight: 800, display: "inline-flex", alignItems: "center",
        justifyContent: "center", flexShrink: 0,
      }}>
        {(cfg.label || "?").slice(0, 2)}
      </span>
      {nama || "-"}
    </span>
  );
}

/* ── PRODI FILTER CHIP ── */
function ProdiFilterChip({ nama, active, onClick }) {
  const cfg = getProdiConfig(nama === "Semua" ? null : nama);
  const isSemua = nama === "Semua";
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      padding: "5px 14px 5px 9px", borderRadius: "20px",
      fontSize: "12.5px", fontWeight: active ? 700 : 500,
      cursor: "pointer", transition: "all 0.15s",
      border: `1.5px solid ${active ? (isSemua ? "#765439" : cfg.border) : "#e8d5c4"}`,
      background: active ? (isSemua ? "#765439" : cfg.bg) : "#fff",
      color: active ? (isSemua ? "#fde68a" : cfg.color) : "#765439",
    }}>
      {!isSemua && (
        <span style={{
          width: "14px", height: "14px", borderRadius: "50%", flexShrink: 0,
          background: active ? cfg.gradient : cfg.bg,
          border: `1.5px solid ${cfg.border}`,
          display: "inline-block",
        }} />
      )}
      {nama}
    </button>
  );
}

/* ── AVATAR ── */
function MhsAvatar({ row }) {
  const cfg = getProdiConfig(row.nama_prodi);
  if (row.foto_profil) {
    return (
      <img
        src={getAvatarUrl(row.foto_profil)} alt={row.nama}
        className={styles.avatarImg}
        onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = "/img/avatar.jpg"; }}
      />
    );
  }
  return (
    <div className={styles.avatar} style={{ background: cfg.gradient }} title={row.nama_prodi}>
      {row.nama.charAt(0)}
    </div>
  );
}

/* ── STATUS BADGE ── */
function StatusBadge({ status }) {
  const cfg = {
    Selesai: { cls: styles.badgeSelesai, icon: <CheckCircle2 size={11} /> },
    Proses:  { cls: styles.badgeProses,  icon: <RefreshCw size={11} /> },
    Revisi:  { cls: styles.badgeRevisi,  icon: <AlertCircle size={11} /> },
    Belum:   { cls: styles.badgeBelum,   icon: <AlertCircle size={11} /> },
  };
  const { cls, icon } = cfg[status] || cfg.Belum;
  return <span className={`${styles.badge} ${cls}`}>{icon}{status}</span>;
}

/* ── STAT CARD ── */
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

/* ── PRODI DISTRIBUTION CHART ── */
function ProdiDistBar({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className={styles.prodiDistCard}>
        <div className={styles.prodiDistHeader}>
          <div className={styles.prodiDistHeaderIcon}><GraduationCap size={15} /></div>
          <span>Distribusi per Program Studi</span>
        </div>
        <div className={styles.chartPlaceholder}>
          <PieChartIcon size={32} style={{ color: '#d4b8a0' }} />
          <p>Data distribusi belum tersedia</p>
        </div>
      </div>
    );
  }

  const counts = {};
  data.forEach(row => {
    const k = row.nama_prodi || "-";
    counts[k] = (counts[k] || 0) + 1;
  });
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total = data.length || 1;
  const chartData = entries.map(([nama, count]) => ({ name: nama, value: count }));

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const nama = payload[0].name;
    const count = payload[0].value;
    const cfg = getProdiConfig(nama);
    const pct = Math.round((count / total) * 100);
    return (
      <div style={{
        background: "#fff", border: `1.5px solid ${cfg.border}`,
        borderRadius: 10, padding: "9px 13px",
        boxShadow: "0 6px 20px rgba(0,0,0,0.12)", fontSize: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: cfg.gradient, flexShrink: 0 }} />
          <strong style={{ color: cfg.color, fontSize: 12.5 }}>{nama}</strong>
        </div>
        <span style={{ color: "#765439" }}>{count} mahasiswa</span>
        <span style={{ color: "#a07858", marginLeft: 5 }}>({pct}%)</span>
      </div>
    );
  };

  return (
    <div className={styles.prodiDistCard}>
      <div className={styles.prodiDistHeader}>
        <div className={styles.prodiDistHeaderIcon}><GraduationCap size={15} /></div>
        <span>Distribusi per Program Studi</span>
        <span className={styles.chartTotalBadge}>{total} mahasiswa</span>
      </div>

      <div className={styles.chartLayout}>
        <div className={styles.donutWrap}>
          <ResponsiveContainer width={200} height={200}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%" cy="50%"
                innerRadius={58} outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                startAngle={90}
                endAngle={-270}
                stroke="none"
              >
                {chartData.map((entry, idx) => {
                  const cfg = getProdiConfig(entry.name);
                  return <Cell key={idx} fill={cfg.color} />;
                })}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className={styles.donutCenter}>
            <span className={styles.donutTotal}>{total}</span>
            <span className={styles.donutLabel}>Mahasiswa</span>
          </div>
        </div>

        <div className={styles.chartLegend}>
          {entries.map(([nama, count]) => {
            const cfg = getProdiConfig(nama);
            const pct = Math.round((count / total) * 100);
            return (
              <div key={nama} className={styles.legendRow}>
                <div className={styles.legendLabel}>
                  <span className={styles.legendDot} style={{ background: cfg.gradient }} />
                  <span className={styles.legendName} style={{ color: cfg.color }}>{nama}</span>
                </div>
                <div className={styles.legendBarWrap}>
                  <div className={styles.legendBarFill}
                    style={{ width: `${pct}%`, background: cfg.gradient }} />
                </div>
                <div className={styles.legendStatWrap}>
                  <span className={styles.legendCount}
                    style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                    {count}
                  </span>
                  <span className={styles.legendPct}>{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── PASSWORD INPUT ── */
function PasswordInput({ value, onChange, placeholder, id }) {
  const [show, setShow] = useState(false);
  return (
    <div className={styles.pwWrap}>
      <input id={id} type={show ? "text" : "password"}
        className={styles.input} value={value} onChange={onChange}
        placeholder={placeholder} autoComplete="new-password" />
      <button type="button" className={styles.pwEye}
        onClick={() => setShow(v => !v)} tabIndex={-1}>
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

/* ── MODAL TAMBAH / EDIT ── */
function MahasiswaFormModal({ mode, data, onClose, onSave, prodiList }) {
  const initial = data || {
    nama: "", nim: "", id_prodi: "", angkatan: "2024",
    email: "", password: "", password_confirm: "",
    status_skpi: "Belum", aktif: true,
  };
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const selectedProdi = prodiList.find(p => String(p.id_prodi) === String(form.id_prodi));
  const prodiCfg = getProdiConfig(selectedProdi?.nama_prodi);

  const set = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }));
  };

  const validate = () => {
    const err = {};
    if (!form.nama.trim()) err.nama = "Nama wajib diisi.";
    if (!form.nim.trim()) err.nim = "NIM wajib diisi.";
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
        <div className={styles.modalHeader}
          style={selectedProdi ? { borderBottom: `2.5px solid ${prodiCfg.border}` } : {}}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalHeaderIcon}
              style={selectedProdi ? { background: prodiCfg.gradient, color: "#fff" } : {}}>
              {mode === "add" ? <Plus size={16} /> : <Edit2 size={16} />}
            </div>
            <div>
              <h3 className={styles.modalTitle}>
                {mode === "add" ? "Tambah Mahasiswa" : "Edit Data Mahasiswa"}
              </h3>
              <p className={styles.modalSub}>
                {selectedProdi
                  ? <span style={{ color: prodiCfg.color, fontWeight: 700 }}>{selectedProdi.nama_prodi}</span>
                  : "Isi data akun mahasiswa dengan benar"}
              </p>
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
              <select className={styles.input} value={form.id_prodi}
                onChange={e => set("id_prodi", e.target.value)}
                style={selectedProdi ? {
                  borderColor: prodiCfg.border,
                  backgroundColor: prodiCfg.bgLight,
                  color: prodiCfg.color, fontWeight: 700,
                } : {}}>
                <option value="">-- Pilih Prodi --</option>
                {prodiList.map(p => (
                  <option key={p.id_prodi} value={p.id_prodi}>{p.nama_prodi}</option>
                ))}
              </select>
              {selectedProdi && (
                <div style={{ marginTop: "5px" }}>
                  <ProdiChip nama={selectedProdi.nama_prodi} />
                </div>
              )}
            </div>
            <div className={styles.fg}>
              <label className={styles.fl}>Angkatan</label>
              <select className={styles.input} value={form.angkatan}
                onChange={e => set("angkatan", e.target.value)}>
                {ANGKATAN_LIST.filter(a => a !== "Semua").map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div className={`${styles.fg} ${styles.fullSpan}`}>
              <label className={styles.fl}>Email <span className={styles.req}>*</span></label>
              <input type="email"
                className={`${styles.input} ${errors.email ? styles.inputErr : ""}`}
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
              <select className={styles.input} value={form.status_skpi}
                onChange={e => set("status_skpi", e.target.value)}>
                {["Belum", "Proses", "Revisi", "Selesai"].map(s => <option key={s}>{s}</option>)}
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
          <button className={styles.btnSave} onClick={handleSave} disabled={saving}
            style={selectedProdi ? { background: prodiCfg.gradient } : {}}>
            {saving ? <span className={styles.spin} /> : <Check size={15} />}
            {saving ? "Menyimpan…" : mode === "add" ? "Tambah Mahasiswa" : "Simpan Perubahan"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── MODAL RESET PASSWORD ── */
function ResetPasswordModal({ mahasiswa, onClose, onDone }) {
  const [loading, setLoading] = useState(false);
  const handle = async () => { setLoading(true); await onDone(); setLoading(false); };
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
            <p className={styles.confirmNote}>Password baru: <strong>{mahasiswa.nim}</strong></p>
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

/* ── MODAL IMPORT EXCEL ── */
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
    setError(""); setFile(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true); setError("");
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
      if (rows.length === 0) throw new Error("File kosong");
      const required = ["Nama", "NIM", "Program Studi", "Angkatan", "Email"];
      const missing = required.filter(col => !(col in rows[0]));
      if (missing.length) throw new Error(`Kolom tidak lengkap: ${missing.join(", ")}`);
      const list = rows.map(row => ({
        nama: row["Nama"], nim: row["NIM"].toString(),
        id_prodi: row["Program Studi"], angkatan: row["Angkatan"].toString(),
        email: row["Email"], password: row["Password"] || row["NIM"].toString(),
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

/* ── ROW ACTION DROPDOWN ── */
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
            onClick={() => { onToggleActive(); setOpen(false); }}>
            {row.aktif ? <EyeOff size={13} /> : <Eye size={13} />}
            {row.aktif ? "Nonaktifkan" : "Aktifkan"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ========== KOMPONEN UTAMA ========== */
const PER_PAGE = 10;
const ANGKATAN_LIST = ["Semua", "2025", "2024", "2023", "2022", "2021", "2020"];
const STATUS_SKPI = ["Semua", "Belum", "Proses", "Selesai"];

export default function MahasiswaPage() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [prodiList, setProdiList] = useState([]);

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

  const fetchMockProdi = async () => MOCK_PRODI_LIST;

  const fetchMockMahasiswa = async ({ q, prodi, page }) => {
    let filtered = [...MOCK_MAHASISWA];
    if (q) {
      const lower = q.toLowerCase();
      filtered = filtered.filter(m => m.nama.toLowerCase().includes(lower) || m.nim.includes(lower));
    }
    if (prodi && prodi !== "Semua") {
      const prodiObj = MOCK_PRODI_LIST.find(p => p.nama_prodi === prodi);
      if (prodiObj) filtered = filtered.filter(m => m.id_prodi === prodiObj.id_prodi);
    }
    const totalFiltered = filtered.length;
    const start = (page - 1) * PER_PAGE;
    const rows = filtered.slice(start, start + PER_PAGE);
    return { rows, total: totalFiltered };
  };

  useEffect(() => {
    if (USE_MOCK) {
      fetchMockProdi().then(list => setProdiList(list));
    } else {
      getProdiList().then(list => { if (list) setProdiList(list); });
    }
    document.title = "Manajemen Mahasiswa | Admin SKPI";
  }, []);

  const loadData = useCallback(async (q = search, prodi = filterProdi, page = currentPage) => {
    setLoading(true);
    let result;
    if (USE_MOCK) {
      result = await fetchMockMahasiswa({ q, prodi, page });
    } else {
      result = await getMahasiswaList({ q, prodi, page });
    }
    if (result) {
      const rows = (result.rows ?? []).map(m => ({
        id: m.id_mahasiswa,
        nama: m.nama,
        nim: m.nim,
        id_prodi: m.id_prodi,
        nama_prodi: m.programstudi?.nama_prodi ?? "-",
        angkatan: m.angkatan ?? "-",
        email: m.email ?? "-",
        status_skpi: ({
          diterbitkan: "Selesai",
          diajukan: "Proses",
          direvisi: "Revisi",
          belum: "Belum",
        })[m.status_skpi] ?? "Belum",
        jumlah_kegiatan: m._count?.kegiatanmahasiswa ?? m.jumlah_kegiatan ?? 0,
        total_icp: m.total_icp ?? 0,
        foto_profil: m.foto_profil ?? null,
        aktif: m.users ? m.users.status_akun === "aktif" : false,
        has_akun: !!m.id_user,
      }));
      setData(rows);
      setTotal(result.total ?? rows.length);
      setTotalPages(Math.ceil((result.total ?? rows.length) / PER_PAGE) || 1);
    }
    setLoading(false);
  }, [search, filterProdi, currentPage]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    const t = setTimeout(() => { setCurrentPage(1); loadData(search, filterProdi, 1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{
      "Nama": "Contoh Mahasiswa", "NIM": "202200001001",
      "Program Studi": "Teknologi Informasi", "Angkatan": "2024",
      "Email": "contoh@student.isb.ac.id", "Password": "contoh123",
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Mahasiswa");
    XLSX.writeFile(wb, "template_mahasiswa.xlsx");
    toast("Template berhasil diunduh");
  };

  const handleAddSave = async (form) => {
    if (USE_MOCK) {
      toast("Mock: Mahasiswa berhasil ditambahkan (simulasi)");
      setModalAdd(false); setCurrentPage(1);
      loadData(search, filterProdi, 1);
      return;
    }
    const res = await createMahasiswa(form);
    if (res.ok) {
      toast("Mahasiswa berhasil ditambahkan");
      setModalAdd(false); setCurrentPage(1);
      loadData(search, filterProdi, 1);
    } else {
      toast(res.data?.error || "Gagal menambah mahasiswa", "error");
    }
  };

  const handleEditSave = async (form) => {
    if (USE_MOCK) {
      toast("Mock: Data mahasiswa diperbarui (simulasi)");
      setModalEdit(null); loadData();
      return;
    }
    const STATUS_MAP = { Selesai: "diterbitkan", Proses: "diajukan", Revisi: "direvisi", Belum: "belum" };
    const payload = { ...form, status_skpi: STATUS_MAP[form.status_skpi] ?? form.status_skpi };
    const res = await updateMahasiswa(modalEdit.id, payload);
    if (res.ok) { toast("Data mahasiswa diperbarui"); setModalEdit(null); loadData(); }
    else toast(res.data?.error || "Gagal update data", "error");
  };

  const handleResetDone = async () => {
    if (USE_MOCK) {
      toast(`Mock: Password ${modalReset.nama} berhasil direset ke NIM`);
      setModalReset(null);
      return;
    }
    const res = await resetMahasiswaPassword(modalReset.id);
    if (res.ok) toast(`Password ${modalReset.nama} berhasil direset ke NIM`);
    else toast(res.data?.error || "Gagal reset password", "error");
    setModalReset(null);
  };

  const handleToggle = async (row) => {
    if (USE_MOCK) {
      toast(`Mock: Akun ${row.nama} ${row.aktif ? "dinonaktifkan" : "diaktifkan"} (simulasi)`);
      loadData();
      return;
    }
    const res = await toggleMahasiswaAkun(row.id);
    if (res.ok) { toast(`Akun ${row.nama} ${row.aktif ? "dinonaktifkan" : "diaktifkan"}`); loadData(); }
    else toast(res.data?.error || "Gagal mengubah status akun", "error");
  };

  const handleImportDone = async (list) => {
    if (USE_MOCK) {
      toast(`Mock: Import selesai, ${list.length} data (simulasi)`);
      setModalImport(false);
      setSearch(""); setFilterProdi("Semua"); setFilterAngkatan("Semua"); setFilterStatus("Semua");
      setCurrentPage(1);
      loadData("", "Semua", 1);
      return;
    }
    const res = await importMahasiswaBulk(list);
    if (res.ok) {
      const successCount = res.data?.success ?? list.length;
      const skippedCount = res.data?.skipped ?? 0;
      const failedCount = res.data?.failed ?? 0;
      const parts = [
        successCount > 0 ? `${successCount} berhasil` : null,
        skippedCount > 0 ? `${skippedCount} dilewati (sudah ada)` : null,
        failedCount > 0 ? `${failedCount} gagal` : null,
      ].filter(Boolean).join(", ");
      setSearch(""); setFilterProdi("Semua"); setFilterAngkatan("Semua"); setFilterStatus("Semua");
      setCurrentPage(1);
      await loadData("", "Semua", 1);
      setModalImport(false);
      toast(
        `Import selesai: ${parts || "tidak ada data baru"}`,
        failedCount > 0 && successCount === 0 ? "error" : "success",
      );
    } else {
      setModalImport(false);
      toast(res.data?.error || "Gagal import data", "error");
    }
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

  const filtered = data.filter(row =>
    (filterAngkatan === "Semua" || String(row.angkatan) === filterAngkatan) &&
    (filterStatus === "Semua" || row.status_skpi === filterStatus)
  );

  const aktifC = data.filter(r => r.aktif).length;
  const selesaiC = data.filter(r => r.status_skpi === "Selesai").length;
  const avgICP = data.length
    ? Math.round(data.reduce((s, r) => s + (r.total_icp || 0), 0) / data.length) : 0;
  const safePage = currentPage;
  const start = (safePage - 1) * PER_PAGE;

  const activeProdiCfg = filterProdi !== "Semua" ? getProdiConfig(filterProdi) : null;

  return (
    <div className={styles.page}>
      <Toast toasts={toasts} remove={remove} />

      {/* HEADER + NAVIGASI TAB */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Manajemen Mahasiswa</h1>
          <p className={styles.pageSub}>Kelola data mahasiswa, reset password, dan status akun</p>
        </div>
        <div className={styles.headerNav}>
          <Link href="/admin/Manajemen-Akun" className={styles.navTab}>
            <Shield size={15} /> Admin
          </Link>
          <span className={`${styles.navTab} ${styles.navTabActive}`}>
            <GraduationCap size={15} /> Mahasiswa
          </span>
        </div>
      </div>

      {/* ACTION BUTTONS (Template, Import, Tambah) */}
      <div className={styles.actionButtons}>
        <button className={styles.btnOutline} onClick={downloadTemplate}>
          <Download size={14} /> Template
        </button>
        <button className={styles.btnOutline} onClick={() => setModalImport(true)}>
          <Upload size={14} /> Import Excel
        </button>
        <button className={styles.btnPrimary} onClick={() => setModalAdd(true)}>
          <Plus size={15} /> Tambah Mahasiswa
        </button>
      </div>

      {/* Stat Cards */}
      <div className={styles.statsGrid}>
        <StatCard icon={Users} title="Total Mahasiswa" value={total} subtitle={`${aktifC} akun aktif`} color="blue" />
        <StatCard icon={UserCheck} title="Akun Aktif" value={aktifC} subtitle="dapat login sistem" color="green" />
        <StatCard icon={GraduationCap} title="SKPI Selesai" value={selesaiC} subtitle="SKPI sudah diterbitkan" color="teal" />
        <StatCard icon={TrendingUp} title="Rata-rata ICP" value={avgICP} subtitle="poin kegiatan mahasiswa" color="orange" />
      </div>

      {/* Prodi Distribution */}
      <ProdiDistBar data={data} />

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input className={styles.searchInput}
            placeholder="Cari nama atau NIM..."
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className={styles.searchClear} onClick={() => setSearch("")}><X size={14} /></button>}
        </div>
        <div className={styles.toolbarRight}>
          <button
            className={`${styles.btnFilter} ${filterOpen || activeFilters ? styles.btnFilterActive : ""}`}
            onClick={() => setFilterOpen(o => !o)}
            style={activeProdiCfg ? {
              background: activeProdiCfg.bg,
              borderColor: activeProdiCfg.border,
              color: activeProdiCfg.color,
            } : {}}
          >
            <Filter size={14} /> Filter
            {activeFilters > 0 && <span className={styles.filterBadge}
              style={activeProdiCfg ? { background: activeProdiCfg.bgDark, color: "#fff" } : {}}>
              {activeFilters}
            </span>}
            <ChevronDown size={13} className={filterOpen ? styles.chevUp : ""} />
          </button>
          <span className={styles.resultCount}>{total} mahasiswa</span>
          <button className={styles.btnOutline} onClick={() => loadData()} title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {filterOpen && (
        <div className={styles.filterPanel}>
          <div className={styles.filterGrid}>
            <div className={styles.filterGroup}>
              <p className={styles.filterLabel}>Program Studi</p>
              <div className={styles.chipRow}>
                {["Semua", ...prodiList.map(p => p.nama_prodi)].map(p => (
                  <ProdiFilterChip key={p} nama={p} active={filterProdi === p}
                    onClick={() => { setFilterProdi(p); setCurrentPage(1); loadData(search, p, 1); }} />
                ))}
              </div>
            </div>
            <div className={styles.filterGroup}>
              <p className={styles.filterLabel}>Angkatan</p>
              <div className={styles.chipRow}>
                {ANGKATAN_LIST.map(a => (
                  <button key={a} className={`${styles.chip} ${filterAngkatan === a ? styles.chipActive : ""}`}
                    onClick={() => { setFilterAngkatan(a); setCurrentPage(1); }}>{a}</button>
                ))}
              </div>
            </div>
            <div className={styles.filterGroup}>
              <p className={styles.filterLabel}>Status SKPI</p>
              <div className={styles.chipRow}>
                {STATUS_SKPI.map(s => (
                  <button key={s} className={`${styles.chip} ${filterStatus === s ? styles.chipActive : ""}`}
                    onClick={() => { setFilterStatus(s); setCurrentPage(1); }}>{s}</button>
                ))}
              </div>
            </div>
          </div>
          {activeFilters > 0 && (
            <button className={styles.btnResetFilter} onClick={resetFilter}>
              <RefreshCw size={13} /> Reset Filter
            </button>
          )}
        </div>
      )}

      {/* Tabel */}
      <div className={styles.tableCard}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thNo}>No.</th>
                <th>Nama Mahasiswa</th>
                <th>NIM</th>
                <th>Program Studi</th>
                <th className={styles.thCenter}>Angkatan</th>
                <th className={styles.thCenter}>Status SKPI</th>
                <th className={styles.thCenter}>Akun</th>
                <th className={styles.thCenter}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className={styles.emptyTd}>
                    <div className={styles.emptyState}>
                      <Loader2 size={32} className={styles.spin} /><p>Memuat data...</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.emptyTd}>
                    <div className={styles.emptyState}>
                      <GraduationCap size={44} />
                      <p>Tidak ada data mahasiswa</p>
                      <span>Coba ubah filter atau tambah data baru</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((row, idx) => (
                <tr key={row.id} className={!row.aktif ? styles.rowInactive : ""}>
                  <td className={styles.tdNo}>{start + idx + 1}</td>
                  <td>
                    <div className={styles.nameCell}>
                      <MhsAvatar row={row} />
                      <div>
                        <div className={styles.nameText}>{row.nama}</div>
                        <div className={styles.emailText}>{row.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={styles.nimBadge}>{row.nim}</span></td>
                  <td><ProdiChip nama={row.nama_prodi} /></td>
                  <td className={styles.tdCenter}>
                    <span className={styles.angkatanBadge}>{row.angkatan}</span>
                  </td>
                  <td className={styles.tdCenter}><StatusBadge status={row.status_skpi} /></td>
                  <td className={styles.tdCenter}>
                    <span className={`${styles.akunDot} ${row.aktif ? styles.dotOn : (row.has_akun ? styles.dotOff : styles.dotNone)}`}>
                      {row.aktif ? "Aktif" : row.has_akun ? "Nonaktif" : "Belum ada"}
                    </span>
                  </td>
                  <td className={styles.tdCenter}>
                    <RowActions row={row}
                      onEdit={() => setModalEdit(row)}
                      onResetPw={() => setModalReset(row)}
                      onToggleActive={() => handleToggle(row)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
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
                acc.push(p); return acc;
              }, [])
              .map((p, i) => p === "…"
                ? <span key={`d${i}`} className={styles.pDots}>…</span>
                : <button key={p} className={`${styles.pBtn} ${safePage === p ? styles.pBtnActive : ""}`}
                    onClick={() => setCurrentPage(p)}>{p}</button>
              )}
            <button className={styles.pBtn} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>
              <ChevronRight size={13} />
            </button>
            <button className={styles.pBtn} onClick={() => setCurrentPage(totalPages)} disabled={safePage === totalPages}>»</button>
          </div>
        </div>
      )}

      {/* Modals */}
      {modalAdd && (
        <MahasiswaFormModal mode="add" prodiList={prodiList}
          onClose={() => setModalAdd(false)} onSave={handleAddSave} />
      )}
      {modalEdit && (
        <MahasiswaFormModal mode="edit" data={modalEdit} prodiList={prodiList}
          onClose={() => setModalEdit(null)} onSave={handleEditSave} />
      )}
      {modalReset && (
        <ResetPasswordModal mahasiswa={modalReset}
          onClose={() => setModalReset(null)} onDone={handleResetDone} />
      )}
      {modalImport && (
        <ImportExcelModal onClose={() => setModalImport(false)} onDone={handleImportDone} />
      )}
    </div>
  );
}