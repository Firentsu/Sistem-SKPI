"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Edit2, Trash2, Search, X, Check,
  ChevronLeft, ChevronRight, Loader2, AlertCircle,
} from "lucide-react";
import styles from "./page.module.css";
import { apiFetch } from "@/lib/api";

// ── Konfigurasi setiap tipe master data ─────────────────────
const MASTER_TYPES = [
  {
    key:      "jenis-aktivitas",
    label:    "Jenis Aktivitas",
    idField:  "id_jenis",
    hasEng:   true,
    desc:     "Jenis kegiatan mahasiswa sesuai standar SKPI",
  },
  {
    key:      "kategori-aktivitas",
    label:    "Kategori Aktivitas",
    idField:  "id_kategori",
    hasEng:   true,
    desc:     "Pengelompokan kategori kegiatan aktivitas",
  },
  {
    key:      "kelompok-aktivitas",
    label:    "Kelompok Aktivitas",
    idField:  "id_kelompok",
    hasEng:   true,
    desc:     "Kelompok besar aktivitas akademik dan non-akademik",
  },
  {
    key:      "level-kegiatan",
    label:    "Level Kegiatan",
    idField:  "id_level",
    nameField:"nama_level",
    hasEng:   false,
    desc:     "Tingkat penyelenggaraan kegiatan",
  },
  {
    key:      "posisi-kegiatan",
    label:    "Posisi Kegiatan",
    idField:  "id_posisi",
    nameField:"nama_posisi",
    hasEng:   false,
    desc:     "Posisi atau peran mahasiswa dalam kegiatan",
  },
];

// ── Toast ────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null);
  const show = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);
  return { toast, show, clear: () => setToast(null) };
}

function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className={`${styles.toast} ${styles[`toast_${toast.type}`]}`}>
      {toast.type === "success" ? <Check size={14} /> : <AlertCircle size={14} />}
      <span>{toast.msg}</span>
      <button onClick={onClose}><X size={12} /></button>
    </div>
  );
}

// ── Modal Tambah / Edit ──────────────────────────────────────
function ItemModal({ type, item, onClose, onSaved }) {
  const [namaIndo, setNamaIndo] = useState(item?.nama_indo ?? item?.nama_level ?? item?.nama_posisi ?? "");
  const [namaEng,  setNamaEng]  = useState(item?.nama_eng ?? "");
  const [status,   setStatus]   = useState(item ? (item.status ?? true) : true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  const nameField = type.nameField ?? "nama_indo";
  const isEdit    = !!item;

  async function handleSave() {
    const label = namaIndo.trim();
    if (!label) { setError("Nama wajib diisi"); return; }
    if (type.hasEng && !namaEng.trim()) { setError("Nama Inggris wajib diisi"); return; }

    setSaving(true);
    setError("");
    try {
      const body = type.hasEng
        ? { nama_indo: label, nama_eng: namaEng.trim(), status }
        : { [nameField]: label };

      const url    = isEdit ? `/api/master-data/${type.key}/${item[type.idField]}` : `/api/master-data/${type.key}`;
      const method = isEdit ? "PATCH" : "POST";
      const res    = await apiFetch(url, { method, body: JSON.stringify(body) });
      const data   = await res.json();

      if (!res.ok) throw new Error(data.error || "Gagal menyimpan");
      onSaved();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{isEdit ? "Edit" : "Tambah"} {type.label}</h3>
          <button className={styles.modalClose} onClick={onClose}><X size={16} /></button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.field}>
            <label>{type.hasEng ? "Nama (Indonesia)" : "Nama"} <span className={styles.req}>*</span></label>
            <input
              className={styles.input}
              value={namaIndo}
              onChange={e => { setNamaIndo(e.target.value); setError(""); }}
              placeholder={`Masukkan nama ${type.label.toLowerCase()}`}
              autoFocus
            />
          </div>

          {type.hasEng && (
            <div className={styles.field}>
              <label>Nama (English) <span className={styles.req}>*</span></label>
              <input
                className={styles.input}
                value={namaEng}
                onChange={e => { setNamaEng(e.target.value); setError(""); }}
                placeholder="Enter name in English"
              />
            </div>
          )}

          {type.hasEng && isEdit && (
            <div className={styles.field}>
              <label>Status</label>
              <button
                type="button"
                className={`${styles.toggleBtn} ${status ? styles.toggleOn : styles.toggleOff}`}
                onClick={() => setStatus(v => !v)}
              >
                <span className={styles.toggleThumb} />
                <span>{status ? "Aktif" : "Nonaktif"}</span>
              </button>
            </div>
          )}

          {error && <p className={styles.fieldError}><AlertCircle size={13} />{error}</p>}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btnGhost} onClick={onClose}>Batal</button>
          <button className={styles.btnSave} onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={14} className={styles.spin} /> : <Check size={14} />}
            {saving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Data"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Hapus ──────────────────────────────────────────────
function DeleteModal({ type, item, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const name = item?.nama_indo ?? item?.nama_level ?? item?.nama_posisi ?? "";

  async function handleDelete() {
    setLoading(true);
    setError("");
    try {
      const res  = await apiFetch(`/api/master-data/${type.key}/${item[type.idField]}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus");
      onDeleted();
      onClose();
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.modal} ${styles.modalSm}`} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Hapus Data</h3>
          <button className={styles.modalClose} onClick={onClose}><X size={16} /></button>
        </div>
        <div className={styles.modalBody}>
          <p className={styles.deleteText}>
            Hapus <strong>{name}</strong> dari {type.label}?
          </p>
          <p className={styles.deleteNote}>Data yang sedang dipakai tidak dapat dihapus.</p>
          {error && <p className={styles.fieldError}><AlertCircle size={13} />{error}</p>}
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.btnGhost} onClick={onClose}>Batal</button>
          <button className={styles.btnDanger} onClick={handleDelete} disabled={loading}>
            {loading ? <Loader2 size={14} className={styles.spin} /> : <Trash2 size={14} />}
            {loading ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Halaman Utama ────────────────────────────────────────────
export default function MasterDataPage() {
  const [activeIdx, setActiveIdx]   = useState(0);
  const [rows,      setRows]        = useState([]);
  const [loading,   setLoading]     = useState(true);
  const [search,    setSearch]      = useState("");
  const [page,      setPage]        = useState(1);
  const [modalAdd,  setModalAdd]    = useState(false);
  const [modalEdit, setModalEdit]   = useState(null);
  const [modalDel,  setModalDel]    = useState(null);
  const { toast, show, clear }      = useToast();

  const PER_PAGE   = 10;
  const activeType = MASTER_TYPES[activeIdx];

  // ── Load data dari API ─────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setRows([]);
    try {
      const res  = await apiFetch(`/api/master-data/${activeType.key}`);
      if (res.ok) {
        const data = await res.json();
        setRows(Array.isArray(data) ? data : []);
      }
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [activeType.key]);

  useEffect(() => {
    document.title = "Master Data | Admin SKPI";
    loadData();
    setSearch("");
    setPage(1);
  }, [loadData]);

  // ── Filter & paginate ──────────────────────────────────────
  const nameField = activeType.nameField ?? "nama_indo";

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    const n = (r[nameField] ?? r.nama_indo ?? "").toLowerCase();
    const e = (r.nama_eng ?? "").toLowerCase();
    return n.includes(q) || e.includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const paged      = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const getName = r => r[nameField] ?? r.nama_indo ?? "";

  return (
    <div className={styles.page}>
      <Toast toast={toast} onClose={clear} />

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Master Data</h1>
          <p className={styles.pageSub}>Kelola data referensi untuk aktivitas mahasiswa</p>
        </div>
      </div>

      <div className={styles.tabs}>
        {MASTER_TYPES.map((t, i) => (
          <button
            key={t.key}
            className={`${styles.tab} ${activeIdx === i ? styles.tabActive : ""}`}
            onClick={() => { setActiveIdx(i); setSearch(""); setPage(1); }}
          >
            {t.label}
            {activeIdx === i && <span className={styles.tabCount}>{rows.length}</span>}
          </button>
        ))}
      </div>

      <div className={styles.panel}>
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder={`Cari ${activeType.label.toLowerCase()}...`}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
            {search && (
              <button className={styles.searchClear} onClick={() => setSearch("")}>
                <X size={13} />
              </button>
            )}
          </div>
          <div className={styles.toolbarRight}>
            <span className={styles.countLabel}>{filtered.length} data</span>
            <button className={styles.btnPrimary} onClick={() => setModalAdd(true)}>
              <Plus size={14} /> Tambah
            </button>
          </div>
        </div>

        <p className={styles.typeDesc}>{activeType.desc}</p>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thNo}>#</th>
                <th>Nama (Indonesia)</th>
                {activeType.hasEng && <th>Nama (English)</th>}
                {activeType.hasEng && <th className={styles.thCenter}>Status</th>}
                <th className={styles.thRight}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={activeType.hasEng ? 5 : 3} className={styles.loadingTd}>
                    <Loader2 size={22} className={styles.spin} />
                    <span>Memuat data...</span>
                  </td>
                </tr>
              )}
              {!loading && paged.length === 0 && (
                <tr>
                  <td colSpan={activeType.hasEng ? 5 : 3} className={styles.emptyTd}>
                    {search ? `Tidak ada hasil untuk "${search}"` : `Belum ada data ${activeType.label}`}
                  </td>
                </tr>
              )}
              {!loading && paged.length > 0 && paged.map((row, idx) => (
                <tr key={row[activeType.idField]} className={row.status === false ? styles.rowInactive : ""}>
                  <td className={styles.tdNo}>{(safePage - 1) * PER_PAGE + idx + 1}</td>
                  <td className={styles.tdName}>{getName(row)}</td>
                  {activeType.hasEng && <td className={styles.tdEng}>{row.nama_eng ?? "-"}</td>}
                  {activeType.hasEng && (
                    <td className={styles.thCenter}>
                      <span className={`${styles.statusDot} ${row.status ? styles.dotOn : styles.dotOff}`}>
                        {row.status ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                  )}
                  <td className={styles.thRight}>
                    <div className={styles.actions}>
                      <button className={styles.actEdit} onClick={() => setModalEdit(row)} title="Edit">
                        <Edit2 size={13} /> Edit
                      </button>
                      <button className={styles.actDel} onClick={() => setModalDel(row)} title="Hapus">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <span className={styles.paginInfo}>
              {(safePage - 1) * PER_PAGE + 1}–{Math.min(safePage * PER_PAGE, filtered.length)} dari {filtered.length}
            </span>
            <div className={styles.paginBtns}>
              <button className={styles.pBtn} onClick={() => setPage(1)} disabled={safePage === 1}>«</button>
              <button className={styles.pBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>
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
                  : <button
                      key={p}
                      className={`${styles.pBtn} ${safePage === p ? styles.pBtnActive : ""}`}
                      onClick={() => setPage(p)}
                    >{p}</button>
                )}
              <button className={styles.pBtn} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>
                <ChevronRight size={13} />
              </button>
              <button className={styles.pBtn} onClick={() => setPage(totalPages)} disabled={safePage === totalPages}>»</button>
            </div>
          </div>
        )}
      </div>

      {modalAdd && (
        <ItemModal
          type={activeType}
          item={null}
          onClose={() => setModalAdd(false)}
          onSaved={() => { loadData(); show(`${activeType.label} berhasil ditambahkan`); }}
        />
      )}
      {modalEdit && (
        <ItemModal
          type={activeType}
          item={modalEdit}
          onClose={() => setModalEdit(null)}
          onSaved={() => { loadData(); show(`${activeType.label} berhasil diperbarui`); setModalEdit(null); }}
        />
      )}
      {modalDel && (
        <DeleteModal
          type={activeType}
          item={modalDel}
          onClose={() => setModalDel(null)}
          onDeleted={() => { loadData(); show(`Data berhasil dihapus`, "error"); setModalDel(null); }}
        />
      )}
    </div>
  );
}