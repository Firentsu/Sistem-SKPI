"use client";

import { useState } from "react";
import {
  Plus, Edit2, Trash2, Eye, EyeOff, X, CheckCircle2, AlertCircle,
  GripVertical, Save, RefreshCw, Search
} from "lucide-react";
import styles from "./page.module.css";

// Data awal section (berdasarkan dokumen SKPI asli)
const INITIAL_SECTIONS = [
  { id: 1, key: "identitas", titleID: "Identitas Pemegang SKPI", titleEN: "Holder Identity", enabled: true, order: 1 },
  { id: 2, key: "institusi", titleID: "Informasi Institusi", titleEN: "Institution Information", enabled: true, order: 2 },
  { id: 3, key: "capaian_sikap", titleID: "Capaian Pembelajaran - Sikap", titleEN: "Learning Outcomes - Attitude", enabled: true, order: 3 },
  { id: 4, key: "capaian_pengetahuan", titleID: "Capaian Pembelajaran - Pengetahuan", titleEN: "Learning Outcomes - Knowledge", enabled: true, order: 4 },
  { id: 5, key: "keterampilan_umum", titleID: "Keterampilan Umum", titleEN: "General Competence", enabled: true, order: 5 },
  { id: 6, key: "keterampilan_khusus", titleID: "Keterampilan Khusus", titleEN: "Specific Competences/Skills", enabled: true, order: 6 },
  { id: 7, key: "aktivitas_prestasi", titleID: "Aktivitas, Prestasi, dan Penghargaan", titleEN: "Activities, Achievements, and Rewards", enabled: true, order: 7 },
  { id: 8, key: "poin_integritas", titleID: "Poin Integritas (ICP)", titleEN: "Integrity Credit Points (ICP)", enabled: true, order: 8 },
  { id: 9, key: "kkni", titleID: "Informasi KKNI", titleEN: "Indonesian National Qualification Framework", enabled: true, order: 9 },
  { id: 10, key: "pengesahan", titleID: "Pengesahan SKPI", titleEN: "SKPI Legalization", enabled: true, order: 10 },
];

// Komponen Toast
function Toast({ toast, onClose }) {
  if (!toast) return null;
  const isOk = toast.type === "success";
  return (
    <div className={`${styles.toast} ${isOk ? styles.toastSuccess : styles.toastError}`}>
      <div className={styles.toastIcon}>{isOk ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}</div>
      <span className={styles.toastMessage}>{toast.msg}</span>
      <button className={styles.toastClose} onClick={onClose}><X size={14} /></button>
    </div>
  );
}

// Modal Tambah/Edit Section
function SectionModal({ isOpen, onClose, onSave, section }) {
  const [form, setForm] = useState(section || { key: "", titleID: "", titleEN: "", enabled: true });
  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.key || !form.titleID || !form.titleEN) return alert("Semua field harus diisi!");
    onSave(form);
    onClose();
  };
  if (!isOpen) return null;
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{section ? "Edit Section" : "Tambah Section Baru"}</h3>
          <button className={styles.modalClose} onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalForm}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Key (identifier unik)</label>
              <input className={styles.formInput} value={form.key} onChange={e => handleChange("key", e.target.value)} placeholder="contoh: organisasi" />
              <small className={styles.formHint}>Digunakan untuk referensi di kode, tidak tampil di SKPI</small>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Judul (Indonesia)</label>
              <input className={styles.formInput} value={form.titleID} onChange={e => handleChange("titleID", e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Judul (English)</label>
              <input className={styles.formInput} value={form.titleEN} onChange={e => handleChange("titleEN", e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Status</label>
              <select className={styles.formSelect} value={form.enabled ? "Aktif" : "Nonaktif"} onChange={e => handleChange("enabled", e.target.value === "Aktif")}>
                <option value="Aktif">Aktif (ditampilkan di SKPI)</option>
                <option value="Nonaktif">Nonaktif (tidak ditampilkan)</option>
              </select>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnSecondary} onClick={onClose}>Batal</button>
              <button type="submit" className={styles.btnPrimary}><Save size={16} /> {section ? "Update" : "Simpan"}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TemplateSkpiPage() {
  const [sections, setSections] = useState(INITIAL_SECTIONS);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const filteredSections = sections.filter(s =>
    s.titleID.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.titleEN.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.key.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const sortedSections = [...filteredSections].sort((a, b) => a.order - b.order);

  const handleAdd = () => { setEditingSection(null); setModalOpen(true); };
  const handleEdit = (section) => { setEditingSection(section); setModalOpen(true); };
  const handleSave = (data) => {
    if (editingSection) {
      setSections(prev => prev.map(s => s.id === editingSection.id ? { ...s, ...data } : s));
      showToast(`Section "${data.titleID}" berhasil diupdate`);
    } else {
      const newId = Math.max(...sections.map(s => s.id), 0) + 1;
      const maxOrder = Math.max(...sections.map(s => s.order), 0);
      setSections(prev => [...prev, { id: newId, order: maxOrder + 1, enabled: true, ...data }]);
      showToast(`Section "${data.titleID}" berhasil ditambahkan`);
    }
  };
  const toggleStatus = (id) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
    const section = sections.find(s => s.id === id);
    showToast(`Section "${section.titleID}" ${section.enabled ? "dinonaktifkan" : "diaktifkan"}`);
  };
  const handleDelete = (id) => {
    const section = sections.find(s => s.id === id);
    if (confirm(`Yakin ingin menghapus section "${section.titleID}"?`)) {
      setSections(prev => prev.filter(s => s.id !== id));
      showToast(`Section "${section.titleID}" dihapus`, "error");
    }
  };
  const moveUp = (id) => {
    const index = sortedSections.findIndex(s => s.id === id);
    if (index === 0) return;
    const prevId = sortedSections[index - 1].id;
    setSections(prev => {
      const newSections = [...prev];
      const currentOrder = newSections.find(s => s.id === id).order;
      const prevOrder = newSections.find(s => s.id === prevId).order;
      newSections.find(s => s.id === id).order = prevOrder;
      newSections.find(s => s.id === prevId).order = currentOrder;
      return newSections;
    });
    showToast("Urutan section diubah");
  };
  const moveDown = (id) => {
    const index = sortedSections.findIndex(s => s.id === id);
    if (index === sortedSections.length - 1) return;
    const nextId = sortedSections[index + 1].id;
    setSections(prev => {
      const newSections = [...prev];
      const currentOrder = newSections.find(s => s.id === id).order;
      const nextOrder = newSections.find(s => s.id === nextId).order;
      newSections.find(s => s.id === id).order = nextOrder;
      newSections.find(s => s.id === nextId).order = currentOrder;
      return newSections;
    });
    showToast("Urutan section diubah");
  };

  const totalSections = sections.length;
  const activeSections = sections.filter(s => s.enabled).length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Template SKPI</h1>
          <p className={styles.subtitle}>
            Kelola bagian-bagian (section) yang akan ditampilkan dalam dokumen SKPI.
            Setiap section mendukung bahasa Indonesia dan Inggris.
          </p>
        </div>
        <button onClick={handleAdd} className={`${styles.btnPrimary} ${styles.btnLg}`}>
          <Plus size={16} /> Tambah Section
        </button>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><GripVertical size={20} /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{totalSections}</div>
            <div className={styles.statLabel}>Total Section</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><Eye size={20} /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{activeSections}</div>
            <div className={styles.statLabel}>Aktif</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><EyeOff size={20} /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{totalSections - activeSections}</div>
            <div className={styles.statLabel}>Nonaktif</div>
          </div>
        </div>
      </div>

      <div className={styles.searchBar}>
        <Search size={14} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Cari section (judul Indonesia/Inggris atau key)..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm("")} className={styles.clearSearch}>
            <X size={14} />
          </button>
        )}
      </div>

      <div className={styles.tableWrapper}>
        {sortedSections.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 70 }}>No.</th>
                <th>Key</th>
                <th>Judul (Indonesia)</th>
                <th>Judul (English)</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sortedSections.map((section, idx) => (
                <tr key={section.id} className={!section.enabled ? styles.inactiveRow : ""}>
                  <td className={styles.center}>
                    <div className={styles.orderButtons}>
                      <button onClick={() => moveUp(section.id)} disabled={idx === 0} className={styles.orderBtn} title="Naik">↑</button>
                      <span>{idx + 1}</span>
                      <button onClick={() => moveDown(section.id)} disabled={idx === sortedSections.length - 1} className={styles.orderBtn} title="Turun">↓</button>
                    </div>
                   </td>
                  <td><code className={styles.code}>{section.key}</code></td>
                  <td>{section.titleID}</td>
                  <td>{section.titleEN}</td>
                  <td>
                    <span className={`${styles.badge} ${section.enabled ? styles.badgeSuccess : styles.badgeDanger}`}>
                      {section.enabled ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionGroup}>
                      <button onClick={() => toggleStatus(section.id)} className={styles.actionBtn} title={section.enabled ? "Nonaktifkan" : "Aktifkan"}>
                        {section.enabled ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button onClick={() => handleEdit(section)} className={styles.actionBtn} title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(section.id)} className={`${styles.actionBtn} ${styles.actionDanger}`} title="Hapus">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={styles.emptyState}>
            <RefreshCw size={40} />
            <p>Tidak ada section yang cocok dengan pencarian Anda.</p>
            <button onClick={() => setSearchTerm("")} className={styles.btnSecondary}>
              Hapus Filter
            </button>
          </div>
        )}
      </div>

      <div className={styles.footerNote}>
        <p>
          <strong>Catatan:</strong> Urutan section di atas menentukan urutan tampilan di dokumen SKPI.
          Section yang dinonaktifkan tidak akan muncul di SKPI yang digenerate.
        </p>
      </div>

      <SectionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        section={editingSection}
      />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}