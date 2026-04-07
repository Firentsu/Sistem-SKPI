"use client";

import { useState } from "react";
import {
  Plus, Edit2, Trash2, Search, Filter, ChevronLeft, ChevronRight,
  AlertCircle, CheckCircle2, X, Loader2, Eye, TrendingUp,
} from "lucide-react";
import styles from "../admin.module.css";

// Mock data untuk ICP (Institutional Competency Profile)
const MOCK_ICP_DATA = [
  {
    id: 1,
    nama: "Fisik",
    deskripsi: "Kesehatan dan kebugaran jasmani",
    bobot: 10,
    status: "Aktif",
  },
  {
    id: 2,
    nama: "Iman & Spiritual",
    deskripsi: "Ketakwaan dan moral spiritual",
    bobot: 15,
    status: "Aktif",
  },
  {
    id: 3,
    nama: "Ilmu Pengetahuan",
    deskripsi: "Penguasaan ilmu dan teknologi",
    bobot: 25,
    status: "Aktif",
  },
  {
    id: 4,
    nama: "Keterampilan Profesional",
    deskripsi: "Kompetensi teknis dan profesional",
    bobot: 25,
    status: "Aktif",
  },
  {
    id: 5,
    nama: "Kepemimpinan",
    deskripsi: "Kemampuan memimpin dan mengelola",
    bobot: 15,
    status: "Aktif",
  },
  {
    id: 6,
    nama: "Kewirausahaan",
    deskripsi: "Jiwa entrepreneurship dan inovasi",
    bobot: 10,
    status: "Aktif",
  },
];

/* ─────────────────────────────────────────
   Toast Component
───────────────────────────────────────── */
function Toast({ toast, onClose }) {
  if (!toast) return null;
  const isOk = toast.type === "success";
  return (
    <div className={`${styles.toast} ${isOk ? styles.toast_success : styles.toast_error}`}>
      <div className={styles.toastIconWrap}>
        {isOk ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
      </div>
      <span className={styles.toastMsg}>{toast.msg}</span>
      <button className={styles.toastClose} onClick={onClose} aria-label="Tutup">
        <X size={13} />
      </button>
      <span className={styles.toastBar} />
    </div>
  );
}

/* ─────────────────────────────────────────
   Modal Add/Edit
───────────────────────────────────────── */
function ModalAddEdit({ data, isOpen, onClose, onSave, totalBobot }) {
  const [form, setForm] = useState(
    data || {
      nama: "",
      deskripsi: "",
      bobot: "",
      status: "Aktif",
    }
  );

  const remainingBobot = 100 - totalBobot + (data?.bobot || 0);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nama || !form.deskripsi || !form.bobot) {
      alert("Semua field harus diisi!");
      return;
    }
    if (Number(form.bobot) > remainingBobot) {
      alert(`Bobot maksimal yang tersisa: ${remainingBobot}%`);
      return;
    }
    onSave(form);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 500 }}
      >
        <div className={styles.modalHeader}>
          <h3>{data ? "Edit Komponen ICP" : "Tambah Komponen ICP"}</h3>
          <button onClick={onClose} className={styles.modalClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Nama Komponen *</label>
            <input
              type="text"
              className={styles.formInput}
              value={form.nama}
              onChange={(e) => handleChange("nama", e.target.value)}
              placeholder="Contoh: Fisik"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Deskripsi *</label>
            <textarea
              className={styles.formInput}
              rows="3"
              value={form.deskripsi}
              onChange={(e) => handleChange("deskripsi", e.target.value)}
              placeholder="Jelaskan komponen ICP ini"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Bobot (%) *</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="number"
                className={styles.formInput}
                min="1"
                max={remainingBobot}
                value={form.bobot}
                onChange={(e) => handleChange("bobot", e.target.value)}
              />
              <span style={{ fontSize: 12, color: "#666" }}>
                Sisa: {remainingBobot}%
              </span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Status</label>
            <select
              className={styles.formInput}
              value={form.status}
              onChange={(e) => handleChange("status", e.target.value)}
            >
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
          </div>

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.btnSecondary}>
              Batal
            </button>
            <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
              {data ? "Update" : "Tambah"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main Page
───────────────────────────────────────── */
export default function ICPPage() {
  const [data, setData] = useState(MOCK_ICP_DATA);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState(null);

  const totalBobot = data.reduce((sum, item) => sum + Number(item.bobot), 0);

  // Filter & search
  const filtered = data.filter((item) =>
    item.nama.toLowerCase().includes(search.toLowerCase()) ||
    item.deskripsi.toLowerCase().includes(search.toLowerCase())
  );

  // Toast
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Handle tambah
  const handleTambah = () => {
    if (totalBobot >= 100) {
      showToast("Bobot sudah mencapai 100%, tidak bisa menambah lebih banyak", "error");
      return;
    }
    setSelectedData(null);
    setModalOpen(true);
  };

  // Handle edit
  const handleEdit = (item) => {
    setSelectedData(item);
    setModalOpen(true);
  };

  // Handle save
  const handleSave = (form) => {
    if (selectedData) {
      setData((prev) =>
        prev.map((item) =>
          item.id === selectedData.id ? { ...item, ...form } : item
        )
      );
      showToast("Komponen ICP berhasil diupdate!");
    } else {
      const newData = {
        id: Math.max(...data.map((d) => d.id), 0) + 1,
        ...form,
      };
      setData((prev) => [newData, ...prev]);
      showToast("Komponen ICP berhasil ditambahkan!");
    }
  };

  // Handle hapus
  const handleHapus = (id) => {
    if (confirm("Yakin ingin menghapus komponen ICP ini?")) {
      setData((prev) => prev.filter((item) => item.id !== id));
      showToast("Komponen ICP berhasil dihapus!");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Manajemen ICP</h1>
          <p className={styles.pageSubtitle}>
            Kelola Institutional Competency Profile (ICP)
          </p>
        </div>
        <button
          onClick={handleTambah}
          className={`${styles.btn} ${styles.btnPrimary}`}
        >
          <Plus size={18} />
          Tambah Komponen
        </button>
      </div>

      {/* Stats Bar */}
      <div className={styles.statsBar}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{data.length}</div>
          <div className={styles.statLabel}>Total Komponen</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {data.filter((d) => d.status === "Aktif").length}
          </div>
          <div className={styles.statLabel}>Komponen Aktif</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statValue} ${totalBobot === 100 ? "" : "warning"}`}>
            {totalBobot}%
          </div>
          <div className={styles.statLabel}>Total Bobot</div>
        </div>
      </div>

      {/* Bobot Info */}
      {totalBobot !== 100 && (
        <div
          style={{
            background: "#fef3c7",
            border: "1px solid #fcd34d",
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 14,
          }}
        >
          <AlertCircle size={18} style={{ color: "#f59e0b" }} />
          <span>
            Total bobot: <strong>{totalBobot}%</strong> dari 100%. Sisa:{" "}
            <strong>{100 - totalBobot}%</strong>
          </span>
        </div>
      )}

      {totalBobot === 100 && (
        <div
          style={{
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 14,
          }}
        >
          <CheckCircle2 size={18} style={{ color: "#10b981" }} />
          <span>Total bobot sudah mencapai 100% ✓</span>
        </div>
      )}

      {/* Filter Section */}
      {data.length > 0 && (
        <div className={styles.filterSection}>
          <div className={styles.searchInput}>
            <Search size={18} />
            <input
              type="text"
              placeholder="Cari nama atau deskripsi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Cards View */}
      {filtered.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {filtered.map((item) => (
            <div key={item.id} className={styles.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                <div>
                  <h4 style={{ marginBottom: 4 }}>{item.nama}</h4>
                  <p style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
                    {item.deskripsi}
                  </p>
                </div>
                <div className={styles.actionButtons}>
                  <button
                    onClick={() => handleEdit(item)}
                    className={styles.actionBtn}
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleHapus(item.id)}
                    className={styles.actionBtnDanger}
                    title="Hapus"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: 12,
                  borderTop: "1px solid #e5e7eb",
                }}
              >
                <span style={{ fontSize: 12, color: "#666" }}>
                  {item.status === "Aktif" ? "✓ Aktif" : "✗ Nonaktif"}
                </span>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: "#765439",
                  }}
                >
                  {item.bobot}%
                </div>
              </div>

              {/* Bobot Bar */}
              <div style={{ marginTop: 12 }}>
                <div
                  style={{
                    background: "#e5e7eb",
                    borderRadius: 4,
                    height: 8,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      background: "#765439",
                      height: "100%",
                      width: `${item.bobot}%`,
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <TrendingUp size={48} />
          <p>Tidak ada komponen ICP yang sesuai dengan pencarian Anda</p>
        </div>
      )}

      {/* Modal */}
      <ModalAddEdit
        data={selectedData}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        totalBobot={totalBobot}
      />

      {/* Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
