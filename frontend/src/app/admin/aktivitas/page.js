// frontend/src/app/admin/aktivitas/page.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, Plus, Search, Filter, Edit2, Trash2, Eye,
  Loader2, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2,
  Calendar, Users, Tag, Award, TrendingUp, X, Check, X as XIcon, Clock,
  GraduationCap, Building, ChevronDown, ChevronUp, FileText, MapPin,
  User, BookOpen, Briefcase, Globe, MessageSquare
} from "lucide-react";
import { apiFetch, isMockMode } from "@/lib/api";
import styles from "./aktivitas.module.css";

// ========== DATA PROGRAM STUDI ==========
const PRODI_LIST = [
  { value: "semua", label: "Semua Prodi", color: "#6b7280", icon: Building },
  { value: "Teknologi Informasi", label: "Teknologi Informasi", color: "#ff7f00", icon: BookOpen },
  { value: "Manajemen", label: "Manajemen", color: "#0099cc", icon: Briefcase },
  { value: "Pendidikan Guru Sekolah Dasar", label: "PGSD", color: "#800080", icon: Users },
  { value: "Kewirausahaan", label: "Kewirausahaan", color: "#ff3300", icon: TrendingUp },
  { value: "Sistem Informasi", label: "Sistem Informasi", color: "#1a0909", icon: Globe },
  { value: "Agroekoteknologi", label: "Agroekoteknologi", color: "#00bfb3", icon: Leaf },
];

// ========== STATUS VERIFIKASI ==========
const STATUS_VERIFIKASI = {
  "diproses": { label: "Diproses", color: "#f59e0b", icon: Clock, bgLight: "#fef3c7" },
  "disetujui": { label: "Disetujui", color: "#22c55e", icon: Check, bgLight: "#d1fae5" },
  "ditolak": { label: "Ditolak", color: "#ef4444", icon: XIcon, bgLight: "#fee2e2" },
  "revisi": { label: "Revisi", color: "#8b5cf6", icon: AlertCircle, bgLight: "#ede9fe" },
};

// Icon untuk Agroekoteknologi
function Leaf(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4M12 6c-2.5 0-5 1.5-5 4s2.5 4 5 4 5-1.5 5-4-2.5-4-5-4z" />
      <path d="M12 6v12" />
      <path d="M12 18c-2.5 0-5-1.5-5-4" />
      <path d="M17 10c2.5 0 5 1.5 5 4s-2.5 4-5 4" />
      <path d="M7 10c-2.5 0-5 1.5-5 4s2.5 4 5 4" />
    </svg>
  );
}

// ========== MOCK DATA (dengan path bukti ke /uploads/bukti-kegiatan/) ==========
const MOCK_AKTIVITAS = [
  { 
    id_kegiatan: 1, 
    nama_kegiatan: "Workshop React.js Advanced",
    nama_kegiatan_en: "Advanced React.js Workshop",
    jenisaktivitas: { nama_indo: "Peningkatan Keterampilan Profesional" },
    kategoriaktivitas: { nama_indo: "Workshop" },
    kelompokaktivitas: { nama_indo: "Akademik" },
    level: "Nasional",
    periode: "Semester Genap 2025/2026",
    tingkat_prestasi: "Peserta",
    lokasi: "Kampus TI",
    penyelenggara: "ISB Academy",
    tanggal_kegiatan: "2026-04-20",
    mahasiswa: { nama: "Budi Santoso", nim: "2024001", prodi: "Teknologi Informasi" },
    status_verifikasi: "diproses",
    deskripsi: "Workshop tentang pengembangan aplikasi React modern",
    bukti: "/uploads/bukti-kegiatan/bukti1.pdf",
  },
  { 
    id_kegiatan: 2, 
    nama_kegiatan: "Seminar Entrepreneurship",
    nama_kegiatan_en: "Entrepreneurship Seminar",
    jenisaktivitas: { nama_indo: "Prestasi dan Kegiatan" },
    kategoriaktivitas: { nama_indo: "Seminar" },
    kelompokaktivitas: { nama_indo: "Non-Akademik" },
    level: "Nasional",
    periode: "Semester Ganjil 2025/2026",
    tingkat_prestasi: "",
    lokasi: "Aula Kampus",
    penyelenggara: "ISB Business Club",
    tanggal_kegiatan: "2026-04-18",
    mahasiswa: { nama: "Ani Wijaya", nim: "2024002", prodi: "Manajemen" },
    status_verifikasi: "disetujui",
    deskripsi: "",
    bukti: null,
  },
  { 
    id_kegiatan: 3, 
    nama_kegiatan: "Magang Startup Digital",
    nama_kegiatan_en: "Digital Startup Internship",
    jenisaktivitas: { nama_indo: "Praktik Kerja" },
    kategoriaktivitas: { nama_indo: "Magang" },
    kelompokaktivitas: { nama_indo: "Profesional" },
    level: "Lokal",
    periode: "Liburan Semester",
    tingkat_prestasi: "",
    lokasi: "Jakarta",
    penyelenggara: "Tech Startup Inc",
    tanggal_kegiatan: "2026-04-15",
    mahasiswa: { nama: "Citra Dewi", nim: "2024003", prodi: "Sistem Informasi" },
    status_verifikasi: "ditolak",
    deskripsi: "Magang di bidang pengembangan web",
    bukti: "/uploads/bukti-kegiatan/bukti3.pdf",
  },
  { 
    id_kegiatan: 4, 
    nama_kegiatan: "Pelatihan Guru Inovatif",
    nama_kegiatan_en: "Innovative Teacher Training",
    jenisaktivitas: { nama_indo: "Pembangunan Karakter dan Kepribadian" },
    kategoriaktivitas: { nama_indo: "Pelatihan" },
    kelompokaktivitas: { nama_indo: "Pengembangan Diri" },
    level: "Internal",
    periode: "Semester Genap 2025/2026",
    tingkat_prestasi: "Peserta",
    lokasi: "Bengkayang",
    penyelenggara: "Dinas Pendidikan",
    tanggal_kegiatan: "2026-04-10",
    mahasiswa: { nama: "Dedi Susanto", nim: "2024004", prodi: "Pendidikan Guru Sekolah Dasar" },
    status_verifikasi: "revisi",
    deskripsi: "Pelatihan metode pembelajaran inovatif",
    bukti: null,
  },
];

// ========== TOAST ==========
function Toast({ toast, onClose }) {
  if (!toast) return null;
  const isOk = toast.type === "success";
  return (
    <div className={`${styles.toast} ${isOk ? styles.toastSuccess : styles.toastError}`}>
      <div className={styles.toastIcon}>{isOk ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}</div>
      <span className={styles.toastMsg}>{toast.msg}</span>
      <button onClick={onClose} className={styles.toastClose}><X size={14} /></button>
      <div className={styles.toastProgress} style={{ animationDuration: "3.5s" }} />
    </div>
  );
}

// ========== MODAL VERIFIKASI DENGAN FITUR LIHAT BUKTI ==========
function VerifikasiModal({ data, isOpen, onClose, onVerifikasi, isVerifying }) {
  const [status, setStatus] = useState("diproses");
  const [catatan, setCatatan] = useState("");

  useEffect(() => {
    if (data) {
      setStatus(data.status_verifikasi || "diproses");
      setCatatan(data.catatan_admin || "");
    }
  }, [data]);

  if (!isOpen || !data) return null;

  const currentStatusKey = data.status_verifikasi;
  const CurrentIcon = STATUS_VERIFIKASI[currentStatusKey]?.icon;
  const CurrentLabel = STATUS_VERIFIKASI[currentStatusKey]?.label;
  const CurrentBg = STATUS_VERIFIKASI[currentStatusKey]?.bgLight;
  const CurrentColor = STATUS_VERIFIKASI[currentStatusKey]?.color;

  const selectedKey = status;
  const SelectedIcon = STATUS_VERIFIKASI[selectedKey]?.icon;
  const SelectedLabel = STATUS_VERIFIKASI[selectedKey]?.label;
  const SelectedBg = STATUS_VERIFIKASI[selectedKey]?.bgLight;
  const SelectedColor = STATUS_VERIFIKASI[selectedKey]?.color;

  const handleVerifikasi = () => {
    onVerifikasi(data.id_kegiatan, status, catatan);
  };

  const handlePreviewBukti = (bukti) => {
    if (!bukti) return;
    window.open(bukti, '_blank');
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <div className={styles.modalTitleIcon}><Eye size={18} /></div>
            <span>Verifikasi Kegiatan</span>
          </div>
          <button onClick={onClose} className={styles.modalClose}><X size={18} /></button>
        </div>

        <div className={styles.modalBody}>
          {/* Ringkasan cepat */}
          <div className={styles.quickInfo}>
            <div className={styles.quickInfoItem}>
              <span className={styles.quickInfoLabel}>ID Kegiatan</span>
              <span className={styles.quickInfoValue}>#{String(data.id_kegiatan).padStart(3, "0")}</span>
            </div>
            <div className={styles.quickInfoItem}>
              <span className={styles.quickInfoLabel}>Tanggal Pengajuan</span>
              <span className={styles.quickInfoValue}>
                {new Date(data.created_at || data.tanggal_kegiatan).toLocaleDateString("id-ID")}
              </span>
            </div>
          </div>

          {/* Informasi Kegiatan */}
          <div className={styles.detailCard}>
            <div className={styles.detailCardHeader}>
              <FileText size={16} />
              <h3>Detail Kegiatan</h3>
            </div>
            <div className={styles.detailGrid}>
              <div><label>Nama Kegiatan (Indonesia)</label><p>{data.nama_kegiatan}</p></div>
              <div><label>Nama Kegiatan (English)</label><p>{data.nama_kegiatan_en || "-"}</p></div>
              <div><label>Jenis Aktivitas</label><p>{data.jenisaktivitas?.nama_indo || "-"}</p></div>
              <div><label>Kategori</label><p>{data.kategoriaktivitas?.nama_indo || "-"}</p></div>
              <div><label>Kelompok Aktivitas</label><p>{data.kelompokaktivitas?.nama_indo || "-"}</p></div>
              <div><label>Level</label><p>{data.level || "-"}</p></div>
              <div><label>Periode</label><p>{data.periode || "-"}</p></div>
              <div><label>Tingkat Prestasi</label><p>{data.tingkat_prestasi || "-"}</p></div>
              <div><label>Tanggal Pelaksanaan</label><p>{new Date(data.tanggal_kegiatan).toLocaleDateString("id-ID")}</p></div>
              <div><label>Lokasi</label><p><MapPin size={12} style={{ display: "inline", marginRight: 4 }} />{data.lokasi || "-"}</p></div>
              <div><label>Penyelenggara</label><p>{data.penyelenggara || "-"}</p></div>
              {data.deskripsi && (
                <div className={styles.fullWidth}><label>Deskripsi</label><p>{data.deskripsi}</p></div>
              )}
              <div className={styles.fullWidth}>
                <label>Bukti Kegiatan</label>
                {data.bukti ? (
                  <button onClick={() => handlePreviewBukti(data.bukti)} className={styles.linkBtn}>
                    <Eye size={14} /> Lihat Bukti
                  </button>
                ) : <p>-</p>}
              </div>
            </div>
          </div>

          {/* Informasi Mahasiswa */}
          <div className={styles.detailCard}>
            <div className={styles.detailCardHeader}>
              <User size={16} />
              <h3>Mahasiswa Pengusul</h3>
            </div>
            <div className={styles.detailGrid}>
              <div><label>Nama</label><p>{data.mahasiswa?.nama || "-"}</p></div>
              <div><label>NIM</label><p>{data.mahasiswa?.nim || "-"}</p></div>
              <div><label>Program Studi</label><p>{data.mahasiswa?.prodi || "-"}</p></div>
            </div>
          </div>

          {/* Status Saat Ini */}
          <div className={styles.detailCard}>
            <div className={styles.detailCardHeader}>
              <Activity size={16} />
              <h3>Status Verifikasi Saat Ini</h3>
            </div>
            <div className={styles.statusBadgeLarge} style={{ backgroundColor: CurrentBg, color: CurrentColor }}>
              {CurrentIcon && <CurrentIcon size={14} style={{ marginRight: 6 }} />}
              {CurrentLabel}
            </div>
            {data.catatan_admin && (
              <div className={styles.catatanBox}>
                <MessageSquare size={14} />
                <span>{data.catatan_admin}</span>
              </div>
            )}
          </div>

          {/* Form Verifikasi */}
          <div className={styles.verifikasiCard}>
            <div className={styles.detailCardHeader}>
              <Check size={16} />
              <h3>Verifikasi & Beri Keputusan</h3>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="verif-status">Status Verifikasi</label>
              <div className={styles.statusSelectWrapper}>
                <select 
                  id="verif-status"
                  className={styles.select}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ borderColor: SelectedColor }}
                >
                  <option value="diproses">⏳ Diproses</option>
                  <option value="disetujui">✅ Disetujui</option>
                  <option value="ditolak">❌ Ditolak</option>
                  <option value="revisi">🔄 Revisi</option>
                </select>
                <div className={styles.statusPreview} style={{ backgroundColor: SelectedBg, color: SelectedColor }}>
                  {SelectedIcon && <SelectedIcon size={14} style={{ marginRight: 6 }} />}
                  <span>{SelectedLabel}</span>
                </div>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="catatan">Catatan untuk Mahasiswa (Opsional)</label>
              <textarea
                id="catatan"
                className={styles.textarea}
                placeholder="Berikan catatan atau saran revisi..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows="3"
              />
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btnOutline} onClick={onClose}>Batal</button>
          <button 
            className={styles.btnPrimary}
            onClick={handleVerifikasi}
            disabled={isVerifying}
          >
            {isVerifying ? <Loader2 size={16} className={styles.spinner} /> : <Check size={16} />}
            {isVerifying ? "Memproses..." : "Simpan Verifikasi"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ========== STAT CARD ==========
function StatCard({ icon: Icon, title, value, color, trend }) {
  return (
    <div className={styles.statCard} style={{ borderLeftColor: color }}>
      <div className={styles.statIconWrap} style={{ background: `${color}14`, color: color }}>
        <Icon size={20} />
      </div>
      <div className={styles.statInfo}>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statTitle}>{title}</div>
        {trend && <div className={styles.statTrend} style={{ color }}>{trend}</div>}
      </div>
    </div>
  );
}

// ========== PRODI FILTER ==========
function ProdiFilter({ selectedProdi, onSelectProdi }) {
  return (
    <div className={styles.prodiFilterContainer}>
      <div className={styles.prodiFilterHeader}>
        <GraduationCap size={18} />
        <span>Filter Program Studi</span>
      </div>
      <div className={styles.prodiChips}>
        {PRODI_LIST.map(prodi => {
          const Icon = prodi.icon;
          return (
            <button
              key={prodi.value}
              className={`${styles.prodiChip} ${selectedProdi === prodi.value ? styles.prodiChipActive : ""}`}
              style={{ 
                borderColor: prodi.color,
                backgroundColor: selectedProdi === prodi.value ? prodi.color : "transparent",
                color: selectedProdi === prodi.value ? "white" : prodi.color,
              }}
              onClick={() => onSelectProdi(prodi.value)}
            >
              {Icon && <Icon size={14} style={{ marginRight: 6 }} />}
              {prodi.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ========== MAIN PAGE ==========
export default function AktivitasPage() {
  const [aktivitas, setAktivitas] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterProdi, setFilterProdi] = useState("semua");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [mockMode, setMockMode] = useState(false);
  const itemsPerPage = 10;
  const router = useRouter();

  // Load aktivitas (mock untuk demo)
  useEffect(() => {
    const fetchAktivitas = async () => {
      try {
        setLoading(true);
        // Gunakan mock data untuk demo
        setAktivitas(MOCK_AKTIVITAS);
        setMockMode(true);
      } catch (err) {
        setAktivitas(MOCK_AKTIVITAS);
        setMockMode(true);
      } finally {
        setLoading(false);
      }
    };
    fetchAktivitas();
    document.title = "Verifikasi Kegiatan | Admin SKPI";
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const filtered = aktivitas.filter(a => {
    const matchSearch = !search || a.nama_kegiatan?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "Semua" || a.status_verifikasi === filterStatus;
    const matchProdi = filterProdi === "semua" || a.mahasiswa?.prodi === filterProdi;
    return matchSearch && matchStatus && matchProdi;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleVerifikasi = async (id, status, catatan) => {
    try {
      setIsVerifying(true);
      // Simulasi API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAktivitas(prev => prev.map(a => a.id_kegiatan === id ? { ...a, status_verifikasi: status, catatan_admin: catatan } : a));
      setDetailModal(null);
      showToast(`Kegiatan berhasil diverifikasi: ${STATUS_VERIFIKASI[status].label}`, "success");
    } catch (err) {
      showToast("Error: " + err.message, "error");
    } finally {
      setIsVerifying(false);
    }
  };

  const stats = {
    total: filtered.length,
    disetujui: filtered.filter(a => a.status_verifikasi === "disetujui").length,
    diproses: filtered.filter(a => a.status_verifikasi === "diproses").length,
    ditolak: filtered.filter(a => a.status_verifikasi === "ditolak").length,
    revisi: filtered.filter(a => a.status_verifikasi === "revisi").length,
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}><Loader2 size={40} className={styles.spinner} /></div>
        <p>Memuat data kegiatan...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Toast toast={toast} onClose={() => setToast(null)} />
      <VerifikasiModal 
        data={detailModal} 
        isOpen={!!detailModal} 
        onClose={() => setDetailModal(null)}
        onVerifikasi={handleVerifikasi}
        isVerifying={isVerifying}
      />

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Verifikasi Kegiatan Mahasiswa</h1>
          <p className={styles.subtitle}>Kelola dan verifikasi kegiatan yang diajukan mahasiswa</p>
        </div>
      </div>

      <ProdiFilter selectedProdi={filterProdi} onSelectProdi={setFilterProdi} />

      <div className={styles.statsGrid}>
        <StatCard icon={Activity} title="Total Kegiatan" value={stats.total} color="#765439" />
        <StatCard icon={CheckCircle2} title="Disetujui" value={stats.disetujui} color="#10b981" />
        <StatCard icon={Clock} title="Diproses" value={stats.diproses} color="#f59e0b" />
        <StatCard icon={XIcon} title="Ditolak" value={stats.ditolak} color="#ef4444" />
        <StatCard icon={AlertCircle} title="Revisi" value={stats.revisi} color="#8b5cf6" />
      </div>

      <div className={styles.searchBar}>
        <div className={styles.searchInput}>
          <Search size={16} />
          <input type="text" placeholder="Cari nama kegiatan..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          {search && <button className={styles.clearSearch} onClick={() => setSearch("")}><X size={14} /></button>}
        </div>
        <div className={styles.filterActions}>
          <div className={styles.filterGroup}>
            <Filter size={14} />
            <select className={styles.filterSelect} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
              <option value="Semua">Semua Status</option>
              <option value="diproses">⏳ Diproses</option>
              <option value="disetujui">✅ Disetujui</option>
              <option value="ditolak">❌ Ditolak</option>
              <option value="revisi">🔄 Revisi</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        {paginatedData.length > 0 ? (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nama Kegiatan</th>
                  <th>Mahasiswa</th>
                  <th>Prodi</th>
                  <th>Jenis</th>
                  <th>Status</th>
                  <th>Tanggal</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map(item => {
                  const prodiColor = PRODI_LIST.find(p => p.value === item.mahasiswa?.prodi)?.color || "#6b7280";
                  const StatusIcon = STATUS_VERIFIKASI[item.status_verifikasi]?.icon;
                  const statusLabel = STATUS_VERIFIKASI[item.status_verifikasi]?.label;
                  const statusColor = STATUS_VERIFIKASI[item.status_verifikasi]?.color;
                  const statusBg = STATUS_VERIFIKASI[item.status_verifikasi]?.bgLight;
                  return (
                    <tr key={item.id_kegiatan} className={styles.tableRow}>
                      <td>
                        <div className={styles.nameColumn}>
                          <strong>{item.nama_kegiatan}</strong>
                          <small className={styles.idSub}>ID: {String(item.id_kegiatan).padStart(3, "0")}</small>
                        </div>
                      </td>
                      <td>
                        <div className={styles.mahasiswaCell}>
                          <strong>{item.mahasiswa?.nama}</strong>
                          <small>{item.mahasiswa?.nim}</small>
                        </div>
                      </td>
                      <td>
                        <span className={styles.prodiBadge} style={{ backgroundColor: `${prodiColor}20`, color: prodiColor, borderLeft: `3px solid ${prodiColor}` }}>
                          {item.mahasiswa?.prodi?.split(" ").slice(0,2).join(" ") || "-"}
                        </span>
                      </td>
                      <td>
                        <span className={styles.jenisBadge}>
                          {item.jenisaktivitas?.nama_indo || "-"}
                        </span>
                      </td>
                      <td>
                        <span className={styles.statusBadge} style={{ backgroundColor: statusBg, color: statusColor }}>
                          {StatusIcon && <StatusIcon size={12} style={{ marginRight: 4 }} />}
                          {statusLabel}
                        </span>
                      </td>
                      <td>
                        <small className={styles.dateCell}>
                          {new Date(item.tanggal_kegiatan).toLocaleDateString("id-ID")}
                        </small>
                      </td>
                      <td>
                        <div className={styles.actionGroup}>
                          <button className={styles.actionBtn} onClick={() => setDetailModal(item)} title="Verifikasi">
                            <Eye size={14} />
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
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><AlertCircle size={48} /></div>
            <p>Tidak ada kegiatan yang sesuai dengan filter Anda</p>
            {mockMode && <p className={styles.mockNote}>(Mode Demo - Data simulasi)</p>}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            Menampilkan <strong>{(page-1)*itemsPerPage+1}-{Math.min(page*itemsPerPage, filtered.length)}</strong> dari <strong>{filtered.length}</strong> kegiatan
          </div>
          <div className={styles.paginationControls}>
            <button className={styles.pageBtn} onClick={() => setPage(1)} disabled={page === 1}>«</button>
            <button className={styles.pageBtn} onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}><ChevronLeft size={14} /></button>
            {Array.from({ length: totalPages }, (_, i) => i+1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce((acc, p, i, arr) => {
                if (i > 0 && arr[i-1] !== p-1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) => p === "..." ? <span key={`dots-${i}`} className={styles.pageDots}>…</span> : (
                <button key={p} className={`${styles.pageBtn} ${page === p ? styles.pageBtnActive : ""}`} onClick={() => setPage(p)}>{p}</button>
              ))}
            <button className={styles.pageBtn} onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}><ChevronRight size={14} /></button>
            <button className={styles.pageBtn} onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
          </div>
        </div>
      )}
    </div>
  );
}