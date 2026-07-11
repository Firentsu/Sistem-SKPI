"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Plus, Search, Edit2, Trash2, Eye, FileText, RefreshCw,
    Filter, X, ChevronDown, AlertCircle, CheckCircle2,
    LayoutGrid, List,
} from "lucide-react";
import styles from "./dokumentasi.module.css";
import { apiFetch } from "@/lib/api";

// ============================================================
// KONFIGURASI KATEGORI
// ============================================================
const KATEGORI_LIST = [
    "Semua",
    "usecase",
    "activity",
    "class",
    "flowchart",
    "sequence",
    "laporan",
    "panduan",
    "lainnya",
];

const KATEGORI_LABEL = {
    usecase: "Use Case Diagram",
    activity: "Activity Diagram",
    class: "Class Diagram",
    flowchart: "Flowchart",
    sequence: "Sequence Diagram",
    laporan: "Laporan",
    panduan: "Panduan",
    lainnya: "Lainnya",
};

const KATEGORI_COLOR = {
    usecase: { bg: "#dbeafe", color: "#1d4ed8", border: "#93c5fd" },
    activity: { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7" },
    class: { bg: "#ede9fe", color: "#5b21b6", border: "#c4b5fd" },
    flowchart: { bg: "#fef3c7", color: "#92400e", border: "#fcd34d" },
    sequence: { bg: "#fce7f3", color: "#9d174d", border: "#f9a8d4" },
    laporan: { bg: "#dcfce7", color: "#166534", border: "#86efac" },
    panduan: { bg: "#fef3c7", color: "#b45309", border: "#fde68a" },
    lainnya: { bg: "#f3f4f6", color: "#4b5563", border: "#d1d5db" },
};

// ============================================================
// TOAST KOMPONEN
// ============================================================
function Toast({ message, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3500);
        return () => clearTimeout(timer);
    }, [onClose]);

    if (!message) return null;

    return (
        <div className={`${styles.toast} ${styles[`toast_${message.type}`]}`}>
            {message.type === "success" ? (
                <CheckCircle2 size={16} />
            ) : (
                <AlertCircle size={16} />
            )}
            <span>{message.text}</span>
            <button onClick={onClose} className={styles.toastClose}>
                <X size={14} />
            </button>
        </div>
    );
}

// ============================================================
// KOMPONEN UTAMA
// ============================================================
export default function DokumentasiPage() {
    const router = useRouter();
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterKategori, setFilterKategori] = useState("Semua");
    const [filterOpen, setFilterOpen] = useState(false);
    const [toast, setToast] = useState(null);
    const [viewMode, setViewMode] = useState("table");

    // ============================================================
    // LOAD DATA
    // ============================================================
    const loadDocs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterKategori !== "Semua") params.append("kategori", filterKategori);
            if (search) params.append("q", search);

            const res = await apiFetch(`/api/dokumentasi?${params.toString()}`);

            if (!res.ok) {
                let errMsg = `Gagal memuat data (${res.status})`;
                try {
                    const errData = await res.json();
                    if (errData.error) errMsg = errData.error;
                } catch (e) { }
                throw new Error(errMsg);
            }

            const data = await res.json();
            setDocs(data);
        } catch (err) {
            console.error(err);
            showToast(err.message || "Gagal memuat dokumen", "error");
        } finally {
            setLoading(false);
        }
    }, [search, filterKategori]);

    useEffect(() => {
        loadDocs();
    }, [loadDocs]);

    // ============================================================
    // TOAST HELPER
    // ============================================================
    const showToast = (text, type = "success") => {
        setToast({ text, type });
    };

    // ============================================================
    // HANDLER
    // ============================================================
    const handleDelete = async (id, judul) => {
        if (!confirm(`Hapus dokumen "${judul}"?`)) return;
        try {
            const res = await apiFetch(`/api/dokumentasi/${id}`, { method: "DELETE" });
            if (res.ok) {
                showToast("Dokumen berhasil dihapus", "success");
                loadDocs();
            } else {
                showToast("Gagal menghapus dokumen", "error");
            }
        } catch (err) {
            showToast("Terjadi kesalahan", "error");
        }
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === "Enter") loadDocs();
    };

    const resetFilter = () => {
        setSearch("");
        setFilterKategori("Semua");
        setFilterOpen(false);
        loadDocs();
    };

    const activeFilters = (filterKategori !== "Semua" ? 1 : 0) + (search ? 1 : 0);

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <div className={styles.container}>
            {toast && <Toast message={toast} onClose={() => setToast(null)} />}

            {/* HEADER */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>📁 Dokumentasi Sistem</h1>
                    <p className={styles.subtitle}>
                        Kelola semua dokumen proyek SKPI — Use Case, Activity, Class, Flowchart, Sequence, Laporan, Panduan, dan lainnya
                    </p>
                </div>
                <Link href="/admin/dokumentasi/tambah" className={styles.addBtn}>
                    <Plus size={16} /> Tambah Dokumen
                </Link>
            </div>

            {/* STATS */}
            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>{docs.length}</span>
                    <span className={styles.statLabel}>Total Dokumen</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>
                        {docs.filter(d => ["usecase", "activity", "class", "flowchart", "sequence"].includes(d.kategori)).length}
                    </span>
                    <span className={styles.statLabel}>Diagram</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>
                        {docs.filter(d => d.kategori === "laporan").length}
                    </span>
                    <span className={styles.statLabel}>Laporan</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>
                        {docs.filter(d => d.kategori === "panduan").length}
                    </span>
                    <span className={styles.statLabel}>Panduan</span>
                </div>
            </div>

            {/* TOOLBAR */}
            <div className={styles.toolbar}>
                <div className={styles.searchWrap}>
                    <Search size={15} className={styles.searchIcon} />
                    <input
                        className={styles.searchInput}
                        placeholder="Cari judul atau deskripsi..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                    />
                    {search && (
                        <button
                            className={styles.searchClear}
                            onClick={() => {
                                setSearch("");
                                loadDocs();
                            }}
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                <div className={styles.toolbarRight}>
                    <div className={styles.viewToggle}>
                        <button
                            className={`${styles.viewBtn} ${viewMode === "table" ? styles.viewBtnActive : ""}`}
                            onClick={() => setViewMode("table")}
                            title="Tabel"
                        >
                            <List size={15} />
                        </button>
                        <button
                            className={`${styles.viewBtn} ${viewMode === "grid" ? styles.viewBtnActive : ""}`}
                            onClick={() => setViewMode("grid")}
                            title="Grid"
                        >
                            <LayoutGrid size={15} />
                        </button>
                    </div>

                    <button
                        className={`${styles.filterBtn} ${filterOpen || activeFilters ? styles.filterBtnActive : ""}`}
                        onClick={() => setFilterOpen((o) => !o)}
                    >
                        <Filter size={14} /> Filter
                        {activeFilters > 0 && (
                            <span className={styles.filterBadge}>{activeFilters}</span>
                        )}
                        <ChevronDown size={12} className={filterOpen ? styles.chevUp : ""} />
                    </button>

                    <button className={styles.refreshBtn} onClick={loadDocs} title="Refresh">
                        <RefreshCw size={14} className={loading ? styles.spin : ""} />
                    </button>
                </div>
            </div>

            {/* FILTER PANEL */}
            {filterOpen && (
                <div className={styles.filterPanel}>
                    <div className={styles.filterGroup}>
                        <p className={styles.filterLabel}>Kategori</p>
                        <div className={styles.chipRow}>
                            {KATEGORI_LIST.map((k) => (
                                <button
                                    key={k}
                                    className={`${styles.chip} ${filterKategori === k ? styles.chipActive : ""}`}
                                    onClick={() => {
                                        setFilterKategori(k);
                                        setFilterOpen(false);
                                        loadDocs();
                                    }}
                                >
                                    {k === "Semua" ? "Semua" : KATEGORI_LABEL[k] || k}
                                </button>
                            ))}
                        </div>
                    </div>
                    {activeFilters > 0 && (
                        <button className={styles.resetFilter} onClick={resetFilter}>
                            <RefreshCw size={12} /> Reset Filter
                        </button>
                    )}
                </div>
            )}

            {/* CONTENT */}
            {loading ? (
                <div className={styles.loadingRow}>
                    <RefreshCw size={28} className={styles.spin} />
                    <p>Memuat dokumen...</p>
                </div>
            ) : docs.length === 0 ? (
                <div className={styles.emptyState}>
                    <FileText size={52} />
                    <p>Belum ada dokumen</p>
                    <span>Klik "Tambah Dokumen" untuk mulai menyimpan dokumentasi proyek SKPI</span>
                </div>
            ) : viewMode === "table" ? (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Judul</th>
                                <th>Kategori</th>
                                <th className={styles.descCol}>Deskripsi</th>
                                <th>Diperbarui</th>
                                <th className={styles.aksiCol}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {docs.map((doc, idx) => {
                                const catColor = KATEGORI_COLOR[doc.kategori] || KATEGORI_COLOR.lainnya;
                                return (
                                    <tr key={doc.id}>
                                        <td className={styles.tdNo}>{idx + 1}</td>
                                        <td>
                                            <div className={styles.judulCell}>
                                                <strong className={styles.judul}>{doc.judul}</strong>
                                                {doc.file_url && (
                                                    <span className={styles.fileIndicator}>
                                                        <FileText size={12} />
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span
                                                className={styles.kategoriBadge}
                                                style={{
                                                    background: catColor.bg,
                                                    color: catColor.color,
                                                    borderColor: catColor.border,
                                                }}
                                            >
                                                {KATEGORI_LABEL[doc.kategori] || doc.kategori}
                                            </span>
                                        </td>
                                        <td className={styles.descCol}>
                                            <span className={styles.descText}>
                                                {doc.deskripsi || <span className={styles.noDesc}>—</span>}
                                            </span>
                                        </td>
                                        <td className={styles.tglCell}>
                                            {new Date(doc.updated_at).toLocaleDateString("id-ID", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </td>
                                        <td className={styles.aksiCol}>
                                            <div className={styles.actionGroup}>
                                                <Link
                                                    href={`/admin/dokumentasi/view/${doc.id}`}
                                                    className={styles.btnView}
                                                    title="Lihat Detail"
                                                >
                                                    <Eye size={14} />
                                                </Link>
                                                <Link
                                                    href={`/admin/dokumentasi/${doc.id}/edit`}
                                                    className={styles.btnEdit}
                                                    title="Edit"
                                                >
                                                    <Edit2 size={14} />
                                                </Link>
                                                <button
                                                    className={styles.btnDelete}
                                                    onClick={() => handleDelete(doc.id, doc.judul)}
                                                    title="Hapus"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className={styles.gridWrapper}>
                    {docs.map((doc) => {
                        const catColor = KATEGORI_COLOR[doc.kategori] || KATEGORI_COLOR.lainnya;
                        return (
                            <div key={doc.id} className={styles.gridCard}>
                                <div
                                    className={styles.gridCardHeader}
                                    style={{
                                        borderBottom: `3px solid ${catColor.color}`,
                                    }}
                                >
                                    <span
                                        className={styles.gridCardBadge}
                                        style={{
                                            background: catColor.bg,
                                            color: catColor.color,
                                            borderColor: catColor.border,
                                        }}
                                    >
                                        {KATEGORI_LABEL[doc.kategori] || doc.kategori}
                                    </span>
                                    <span className={styles.gridCardDate}>
                                        {new Date(doc.updated_at).toLocaleDateString("id-ID")}
                                    </span>
                                </div>
                                <div className={styles.gridCardBody}>
                                    <h3 className={styles.gridCardTitle}>{doc.judul}</h3>
                                    <p className={styles.gridCardDesc}>
                                        {doc.deskripsi || <span className={styles.noDesc}>Tidak ada deskripsi</span>}
                                    </p>
                                </div>
                                <div className={styles.gridCardActions}>
                                    <Link
                                        href={`/admin/dokumentasi/view/${doc.id}`}
                                        className={styles.gridBtnView}
                                    >
                                        <Eye size={14} /> Detail
                                    </Link>
                                    <Link
                                        href={`/admin/dokumentasi/${doc.id}/edit`}
                                        className={styles.gridBtnEdit}
                                    >
                                        <Edit2 size={14} /> Edit
                                    </Link>
                                    <button
                                        className={styles.gridBtnDelete}
                                        onClick={() => handleDelete(doc.id, doc.judul)}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}