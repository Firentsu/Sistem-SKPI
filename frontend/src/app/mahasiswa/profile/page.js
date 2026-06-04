"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User, Mail, Lock, Eye, EyeOff, Camera, Check, X, Upload,
  GraduationCap, Clock, Loader2, KeyRound, AtSign, Save,
  CheckCircle2, AlertCircle, Hash, BookOpen,
  Trash2, Award, TrendingUp, Shield, Sparkles,
} from "lucide-react";
import styles from "./profile.module.css";
import { useMahasiswa } from "@/context/MahasiswaContext";
import {
  getMahasiswaProfile,
  updateMahasiswaProfile,
  uploadMahasiswaAvatar,
  updateMahasiswaPassword,
  getAvatarUrl,
  deleteMahasiswaAvatar,
  getMahasiswaKegiatan,
  getMahasiswaIcp,
  getPengajuanStatus,
} from "@/lib/api";
import AvatarCropModal from "@/components/AvatarCropModal";

/* ─────────────────────────────────────────
   Toast
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
      <button className={styles.toastClose} onClick={onClose} aria-label="Tutup"><X size={13} /></button>
      <span className={styles.toastBar} />
    </div>
  );
}

function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  const show = useCallback((msg, type = "success") => {
    clearTimeout(timer.current);
    setToast({ msg, type });
    timer.current = setTimeout(() => setToast(null), 3500);
  }, []);
  const hide = useCallback(() => { clearTimeout(timer.current); setToast(null); }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return { toast, show, hide };
}

/* ─────────────────────────────────────────
   Password strength
───────────────────────────────────────── */
function getStrength(pw) {
  if (!pw) return { score: 0, label: "", color: "#e5e7eb" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { label: "Sangat Lemah", color: "#ef4444" },
    { label: "Lemah",        color: "#f97316" },
    { label: "Cukup",        color: "#eab308" },
    { label: "Kuat",         color: "#22c55e" },
    { label: "Sangat Kuat",  color: "#16a34a" },
  ];
  return { score, ...map[score] };
}

function StrengthBar({ password }) {
  const { score, label, color } = getStrength(password);
  if (!password) return null;
  return (
    <div className={styles.strengthWrap}>
      <div className={styles.strengthTrack}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={styles.strengthSegment}
            style={{ background: i < score ? color : "#f0e4d8" }} />
        ))}
      </div>
      <span className={styles.strengthLabel} style={{ color }}>{label}</span>
    </div>
  );
}

/* ─────────────────────────────────────────
   Avatar Viewer Modal
───────────────────────────────────────── */
function AvatarViewModal({ src, name, prodi, onClose, onEdit }) {
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className={styles.viewerModal}>
        <div className={styles.viewerHeader}>
          <div className={styles.viewerHeaderLeft}>
            <div className={styles.viewerHeaderIcon}><Camera size={14} /></div>
            <span>Foto Profil</span>
          </div>
          <button onClick={onClose} className={styles.viewerClose} aria-label="Tutup"><X size={14} /></button>
        </div>
        <div className={styles.viewerImgWrap}>
          <div className={styles.viewerImgGlow} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={name} className={styles.viewerImg} />
        </div>
        <div className={styles.viewerInfo}>
          <p className={styles.viewerName}>{name}</p>
          <p className={styles.viewerProdi}>{prodi} · Institut Shanti Bhuana</p>
        </div>
        <div className={styles.viewerActions}>
          <button className={styles.modalBtnCancel} onClick={onClose}>Tutup</button>
          <button className={styles.modalBtnSave} onClick={onEdit}><Camera size={14} /> Ganti Foto</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   ICP Level helper
───────────────────────────────────────── */
function getIcpLevel(poin) {
  if (poin >= 200) return { label: "Gold",   color: "#ca8a04", bg: "#fef9c3" };
  if (poin >= 150) return { label: "Silver", color: "#2563eb", bg: "#dbeafe" };
  if (poin >= 100) return { label: "Bronze", color: "#92400e", bg: "#fef3c7" };
  return           { label: "—",     color: "#9c7a5e",  bg: "#f5ede4" };
}

/* ─────────────────────────────────────────
   Profile Page
───────────────────────────────────────── */
export default function MahasiswaProfilePage() {
  const router = useRouter();
  const { user, updateUser } = useMahasiswa();
  const { toast, show: showToast, hide: hideToast } = useToast();

  const [loading, setLoading]         = useState(true);
  const [profileData, setProfileData] = useState(null);

  /* ── Stats ── */
  const [stats, setStats] = useState({ total: 0, disetujui: 0, icpPoin: 0, statusSkpi: null });
  const [statsLoading, setStatsLoading] = useState(true);

  /* ── Avatar ── */
  const [avatarSrc,      setAvatarSrc]      = useState("/img/avatar.jpg");
  const [showViewer,     setShowViewer]     = useState(false);
  const [showUploader,   setShowUploader]   = useState(false);
  const [avatarCropFile, setAvatarCropFile] = useState(null);
  const [avatarFile,     setAvatarFile]     = useState(null);
  const [avatarPreview,  setAvatarPreview]  = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [draggingAvatar,  setDraggingAvatar]  = useState(false);
  const [deletingAvatar,  setDeletingAvatar]  = useState(false);
  const avatarInputRef = useRef(null);

  /* ── Email ── */
  const [email,       setEmail]       = useState("");
  const [emailSaving, setEmailSaving] = useState(false);

  /* ── Password ── */
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew,     setPwNew]     = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [showPwCur, setShowPwCur] = useState(false);
  const [showPwNew, setShowPwNew] = useState(false);
  const [showPwCon, setShowPwCon] = useState(false);
  const [pwSaving,  setPwSaving]  = useState(false);

  /* ── Load profile ── */
  useEffect(() => {
    (async () => {
      try {
        const data = await getMahasiswaProfile();
        if (!data) { setLoading(false); return; }
        setProfileData(data);
        setEmail(data.email ?? user?.email ?? "");
        const foto = data.avatar ?? data.foto_profil ?? data.foto;
        if (foto) setAvatarSrc(getAvatarUrl(foto));
      } catch {
        setEmail(user?.email ?? "");
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Load stats ── */
  useEffect(() => {
    Promise.all([getMahasiswaKegiatan(), getMahasiswaIcp(), getPengajuanStatus()])
      .then(([kegiatan, icp, pengajuan]) => {
        const rows = kegiatan?.rows ?? [];
        setStats({
          total:      rows.length,
          disetujui:  rows.filter(k => k.status_verifikasi === "disetujui").length,
          icpPoin:    icp?.total_poin ?? 0,
          statusSkpi: pengajuan?.status_pengajuan ?? null,
        });
      })
      .finally(() => setStatsLoading(false));
  }, []);

  /* ── Avatar helpers ── */
  const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  function processAvatarFile(file) {
    if (!ACCEPTED.includes(file.type)) {
      showToast("Format tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.", "error"); return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast("Ukuran file maksimal 2 MB.", "error"); return;
    }
    setAvatarCropFile(file);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  }

  function handleAvatarCropSave(blob) {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    const croppedFile = new File([blob], "avatar.jpg", { type: "image/jpeg" });
    setAvatarFile(croppedFile);
    setAvatarPreview(URL.createObjectURL(croppedFile));
    setAvatarCropFile(null);
  }

  function cancelAvatarSelect() {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarCropFile(null);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  }

  async function handleAvatarUpload() {
    if (!avatarFile || uploadingAvatar) return;
    setUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append("avatar", avatarFile, avatarFile.name);
      const result = await uploadMahasiswaAvatar(form);
      if (!result.ok) {
        showToast(result.data?.error ?? "Gagal mengunggah foto.", "error"); return;
      }
      const newUrl = getAvatarUrl(result.data.avatar);
      setAvatarSrc(newUrl);
      cancelAvatarSelect();
      setShowUploader(false);
      showToast("Foto profil berhasil diperbarui.");
      updateUser({ foto: newUrl });
      window.dispatchEvent(new CustomEvent("avatar:updated", { detail: { avatar: newUrl } }));
    } catch {
      showToast("Gagal mengunggah foto. Coba lagi.", "error");
    } finally {
      setUploadingAvatar(false);
    }
  }

  useEffect(() => () => { if (avatarPreview) URL.revokeObjectURL(avatarPreview); }, [avatarPreview]);

  async function handleDeleteAvatar() {
    if (deletingAvatar) return;
    setDeletingAvatar(true);
    try {
      const { ok, data } = await deleteMahasiswaAvatar();
      if (!ok) { showToast(data?.error ?? "Gagal menghapus foto.", "error"); return; }
      setAvatarSrc("/img/avatar.jpg");
      updateUser({ foto: "/img/avatar.jpg" });
      window.dispatchEvent(new CustomEvent("avatar:updated", { detail: { avatar: "/img/avatar.jpg" } }));
      showToast("Foto profil berhasil dihapus.");
    } catch {
      showToast("Gagal menghapus foto. Coba lagi.", "error");
    } finally {
      setDeletingAvatar(false);
    }
  }

  /* ── Email save ── */
  async function handleEmailSave(e) {
    e.preventDefault();
    if (emailSaving) return;
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      showToast("Masukkan alamat email yang valid.", "error"); return;
    }
    setEmailSaving(true);
    try {
      const { ok, data } = await updateMahasiswaProfile({ action: "email", email: trimmed });
      if (!ok) { showToast(data?.error ?? "Gagal memperbarui email.", "error"); return; }
      showToast("Email berhasil diperbarui.");
    } catch {
      showToast("Gagal memperbarui email. Coba lagi.", "error");
    } finally {
      setEmailSaving(false);
    }
  }

  /* ── Password save ── */
  async function handlePasswordSave(e) {
    e.preventDefault();
    if (pwSaving) return;
    if (!pwCurrent) { showToast("Masukkan password saat ini.", "error"); return; }
    if (pwNew.length < 8) { showToast("Password baru minimal 8 karakter.", "error"); return; }
    if (pwNew !== pwConfirm) { showToast("Konfirmasi password tidak cocok.", "error"); return; }
    if (getStrength(pwNew).score < 2) {
      showToast("Password terlalu lemah. Tambahkan huruf besar, angka, atau simbol.", "error"); return;
    }
    setPwSaving(true);
    try {
      const { ok, data } = await updateMahasiswaPassword({ password_lama: pwCurrent, password_baru: pwNew });
      if (!ok) { showToast(data?.error ?? "Gagal memperbarui password.", "error"); return; }
      setPwCurrent(""); setPwNew(""); setPwConfirm("");
      showToast("Password berhasil diperbarui.");
    } catch {
      showToast("Gagal memperbarui password. Coba lagi.", "error");
    } finally {
      setPwSaving(false);
    }
  }

  const pwMatch    = pwConfirm && pwNew === pwConfirm;
  const pwMismatch = pwConfirm && pwNew !== pwConfirm;

  const displayName     = profileData?.nama     ?? user?.nama     ?? "Mahasiswa";
  const displayNim      = profileData?.nim      ?? user?.nim      ?? "-";
  const displayProdi    = profileData?.prodi    ?? user?.prodi    ?? "-";
  const displayAngkatan = profileData?.angkatan ?? user?.angkatan ?? "-";
  const icpLevel = getIcpLevel(stats.icpPoin);

  const skpiStatusLabel = {
    menunggu:  { text: "Diproses",  color: "#b45309", bg: "#fff7ed" },
    disetujui: { text: "Selesai",   color: "#047857", bg: "#f0fdf4" },
    ditolak:   { text: "Ditolak",   color: "#b91c1c", bg: "#fff5f5" },
  };
  const skpiStatus = stats.statusSkpi ? (skpiStatusLabel[stats.statusSkpi] ?? { text: stats.statusSkpi, color: "#765439", bg: "#fdf4ec" }) : { text: "Belum Diajukan", color: "#765439", bg: "#fdf4ec" };

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <Loader2 size={28} className={styles.spin} />
        <span>Memuat profil…</span>
      </div>
    );
  }

  return (
    <>
      <Toast toast={toast} onClose={hideToast} />

      {avatarCropFile && (
        <AvatarCropModal
          file={avatarCropFile}
          onClose={() => { setAvatarCropFile(null); if (avatarInputRef.current) avatarInputRef.current.value = ""; }}
          onSave={handleAvatarCropSave}
        />
      )}

      {showViewer && (
        <AvatarViewModal
          src={avatarSrc} name={displayName} prodi={displayProdi}
          onClose={() => setShowViewer(false)}
          onEdit={() => { setShowViewer(false); setShowUploader(true); }}
        />
      )}

      <div className={styles.page}>

        {/* ══════════════════════════════
            HERO CARD
        ══════════════════════════════ */}
        <div className={styles.heroCard}>
          {/* Decorative bg shapes */}
          <div className={styles.heroBg1} />
          <div className={styles.heroBg2} />
          <div className={styles.heroBg3} />

          <div className={styles.heroContent}>
            {/* Avatar */}
            <div className={styles.heroAvatarWrap}>
              <div className={styles.heroAvatarRing} onClick={() => setShowViewer(true)} title="Klik untuk melihat foto penuh">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarSrc} alt="Foto Profil" className={styles.heroAvatar}
                  onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = "/img/avatar.jpg"; }}
                />
              </div>
              <button className={styles.heroCameraBtn} onClick={() => setShowUploader(v => !v)} aria-label="Ganti foto">
                <Camera size={14} />
              </button>
            </div>

            {/* Info */}
            <div className={styles.heroInfo}>
              <div className={styles.heroBadgeRow}>
                <span className={styles.heroBadge}><Sparkles size={10} /> Mahasiswa Aktif</span>
                <span className={styles.heroBadge}>Angkatan {displayAngkatan}</span>
              </div>
              <h1 className={styles.heroName}>{displayName}</h1>
              <div className={styles.heroMeta}>
                <span className={styles.heroMetaItem}>
                  <GraduationCap size={13} /> {displayProdi}
                </span>
                <span className={styles.heroMetaDivider}>·</span>
                <span className={styles.heroMetaItem}>
                  <Hash size={13} /> {displayNim}
                </span>
                <span className={styles.heroMetaDivider}>·</span>
                <span className={styles.heroMetaItem}>
                  <AtSign size={13} /> {email || "—"}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className={styles.heroStatsWrap}>
              <div className={styles.heroStatItem}>
                <span className={styles.heroStatNum}>{statsLoading ? "—" : stats.total}</span>
                <span className={styles.heroStatLabel}>Kegiatan</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStatItem}>
                <span className={styles.heroStatNum} style={{ color: "#4ade80" }}>{statsLoading ? "—" : stats.disetujui}</span>
                <span className={styles.heroStatLabel}>Disetujui</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStatItem}>
                <span className={styles.heroStatNum} style={{ color: icpLevel.color !== "#9c7a5e" ? "#fde68a" : "rgba(253,230,138,0.6)" }}>
                  {statsLoading ? "—" : stats.icpPoin}
                </span>
                <span className={styles.heroStatLabel}>Poin ICP</span>
              </div>
            </div>
          </div>

          {/* Upload panel */}
          {showUploader && (
            <div className={styles.heroUploadPanel}>
              {!avatarFile ? (
                <>
                  <div
                    className={`${styles.heroDrop} ${draggingAvatar ? styles.heroDropActive : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setDraggingAvatar(true); }}
                    onDragLeave={() => setDraggingAvatar(false)}
                    onDrop={(e) => { e.preventDefault(); setDraggingAvatar(false); const f = e.dataTransfer.files?.[0]; if (f) processAvatarFile(f); }}
                    onClick={() => avatarInputRef.current?.click()}
                    role="button" tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && avatarInputRef.current?.click()}
                  >
                    <div className={styles.heroDropIcon}><Upload size={18} /></div>
                    <span className={styles.heroDropText}>{draggingAvatar ? "Lepaskan di sini…" : "Klik atau seret foto ke sini"}</span>
                    <span className={styles.heroDropHint}>JPG, PNG, WebP, GIF · maks. 2 MB · dipangkas otomatis</span>
                  </div>
                  <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                    style={{ display: "none" }}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) processAvatarFile(f); }} />
                  <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                    <button className={styles.heroUploadCancel} onClick={() => setShowUploader(false)}>Batal</button>
                    {avatarSrc !== "/img/avatar.jpg" && (
                      <button className={styles.heroUploadDelete} disabled={deletingAvatar} onClick={handleDeleteAvatar}>
                        {deletingAvatar ? <><Loader2 size={12} className={styles.spin} /> Menghapus…</> : <><Trash2 size={12} /> Hapus Foto</>}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className={styles.heroPreviewWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatarPreview} alt="preview" className={styles.heroPreviewImg} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className={styles.heroUploadSave} onClick={handleAvatarUpload} disabled={uploadingAvatar}>
                      {uploadingAvatar ? <><Loader2 size={13} className={styles.spin} /> Mengunggah…</> : <><Upload size={13} /> Simpan Foto</>}
                    </button>
                    <button className={styles.heroUploadCancel} onClick={cancelAvatarSelect} disabled={uploadingAvatar}>Batal</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ══════════════════════════════
            STATS ROW
        ══════════════════════════════ */}
        <div className={styles.statsRow}>
          {/* Total Kegiatan */}
          <div className={styles.statCard}>
            <div className={styles.statIconWrap} style={{ background: "#fdf4ec", color: "#765439" }}>
              <BookOpen size={20} />
            </div>
            <div className={styles.statBody}>
              <span className={styles.statNum}>{statsLoading ? <Loader2 size={16} className={styles.spin} /> : stats.total}</span>
              <span className={styles.statLabel}>Total Kegiatan</span>
            </div>
            <div className={styles.statAccent} style={{ background: "#765439" }} />
          </div>

          {/* Kegiatan Disetujui */}
          <div className={styles.statCard}>
            <div className={styles.statIconWrap} style={{ background: "#f0fdf4", color: "#047857" }}>
              <CheckCircle2 size={20} />
            </div>
            <div className={styles.statBody}>
              <span className={styles.statNum} style={{ color: "#047857" }}>{statsLoading ? <Loader2 size={16} className={styles.spin} /> : stats.disetujui}</span>
              <span className={styles.statLabel}>Kegiatan Disetujui</span>
            </div>
            <div className={styles.statAccent} style={{ background: "#047857" }} />
          </div>

          {/* ICP Poin */}
          <div className={styles.statCard}>
            <div className={styles.statIconWrap} style={{ background: icpLevel.bg, color: icpLevel.color }}>
              <TrendingUp size={20} />
            </div>
            <div className={styles.statBody}>
              <span className={styles.statNum} style={{ color: icpLevel.color }}>
                {statsLoading ? <Loader2 size={16} className={styles.spin} /> : (
                  <>{stats.icpPoin} <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 7px", borderRadius: 20, background: icpLevel.bg, marginLeft: 4 }}>{icpLevel.label}</span></>
                )}
              </span>
              <span className={styles.statLabel}>Poin ICP</span>
            </div>
            <div className={styles.statAccent} style={{ background: icpLevel.color }} />
          </div>

          {/* Status SKPI */}
          <div className={styles.statCard}>
            <div className={styles.statIconWrap} style={{ background: skpiStatus.bg, color: skpiStatus.color }}>
              <Shield size={20} />
            </div>
            <div className={styles.statBody}>
              <span className={styles.statNum} style={{ color: skpiStatus.color, fontSize: 15 }}>
                {statsLoading ? <Loader2 size={16} className={styles.spin} /> : skpiStatus.text}
              </span>
              <span className={styles.statLabel}>Status SKPI</span>
            </div>
            <div className={styles.statAccent} style={{ background: skpiStatus.color }} />
          </div>
        </div>

        {/* ══════════════════════════════
            CARDS GRID
        ══════════════════════════════ */}
        <div className={styles.cardsGrid}>

          {/* ── Data Akademik ── */}
          <div className={styles.formCard}>
            <div className={styles.formCardHeader}>
              <div className={styles.formCardIcon}><GraduationCap size={20} /></div>
              <div className={styles.formCardHeaderText}>
                <h2 className={styles.formCardTitle}>Data Akademik</h2>
                <p className={styles.formCardSub}>Informasi akademik — hubungi admin untuk perubahan</p>
              </div>
              <span className={styles.readOnlyBadge}>Read-only</span>
            </div>

            <div className={styles.akademikGrid}>
              <div className={styles.akademikField}>
                <div className={styles.akademikFieldIcon}><User size={16} /></div>
                <div className={styles.akademikFieldBody}>
                  <span className={styles.akademikFieldLabel}>Nama Lengkap</span>
                  <span className={styles.akademikFieldValue}>{displayName}</span>
                </div>
              </div>
              <div className={styles.akademikField}>
                <div className={styles.akademikFieldIcon}><Hash size={16} /></div>
                <div className={styles.akademikFieldBody}>
                  <span className={styles.akademikFieldLabel}>NIM</span>
                  <span className={styles.akademikFieldValue}>{displayNim}</span>
                </div>
              </div>
              <div className={styles.akademikField}>
                <div className={styles.akademikFieldIcon}><BookOpen size={16} /></div>
                <div className={styles.akademikFieldBody}>
                  <span className={styles.akademikFieldLabel}>Program Studi</span>
                  <span className={styles.akademikFieldValue}>{displayProdi}</span>
                </div>
              </div>
              <div className={styles.akademikField}>
                <div className={styles.akademikFieldIcon}><Clock size={16} /></div>
                <div className={styles.akademikFieldBody}>
                  <span className={styles.akademikFieldLabel}>Angkatan</span>
                  <span className={styles.akademikFieldValue}>{displayAngkatan}</span>
                </div>
              </div>
              <div className={styles.akademikField}>
                <div className={styles.akademikFieldIcon}><AtSign size={16} /></div>
                <div className={styles.akademikFieldBody}>
                  <span className={styles.akademikFieldLabel}>Email</span>
                  <span className={styles.akademikFieldValue}>{email || "—"}</span>
                </div>
              </div>
              <div className={styles.akademikField}>
                <div className={styles.akademikFieldIcon}><Award size={16} /></div>
                <div className={styles.akademikFieldBody}>
                  <span className={styles.akademikFieldLabel}>Level ICP</span>
                  <span className={styles.akademikFieldValue} style={{ color: icpLevel.color }}>
                    {icpLevel.label} ({stats.icpPoin} poin)
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.readOnlyNote}>
              <GraduationCap size={13} />
              Data akademik bersifat <strong>read-only</strong>. Hubungi admin kampus jika ada perubahan data.
            </div>
          </div>

          {/* ── Keamanan Akun ── */}
          <div className={styles.formsCol}>

            {/* Email */}
            <div className={styles.formCard}>
              <div className={styles.formCardHeader}>
                <div className={styles.formCardIcon} style={{ background: "linear-gradient(135deg,#dbeafe,#bfdbfe)", color: "#1d4ed8" }}>
                  <Mail size={20} />
                </div>
                <div className={styles.formCardHeaderText}>
                  <h2 className={styles.formCardTitle}>Ubah Email</h2>
                  <p className={styles.formCardSub}>Perbarui alamat email untuk login dan notifikasi</p>
                </div>
              </div>
              <form className={styles.form} onSubmit={handleEmailSave}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="email">Alamat Email</label>
                  <div className={styles.inputWrap}>
                    <AtSign size={15} className={styles.inputIcon} />
                    <input id="email" type="email" className={styles.input}
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@domain.com" autoComplete="email" required />
                  </div>
                </div>
                <div className={styles.formFooter}>
                  <button type="submit" className={styles.btnPrimary}
                    style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)" }}
                    disabled={emailSaving}>
                    {emailSaving
                      ? <><Loader2 size={15} className={styles.spin} /> Menyimpan…</>
                      : <><Save size={15} /> Simpan Email</>}
                  </button>
                </div>
              </form>
            </div>

            {/* Password */}
            <div className={styles.formCard}>
              <div className={styles.formCardHeader}>
                <div className={`${styles.formCardIcon} ${styles.formCardIconRed}`}><KeyRound size={20} /></div>
                <div className={styles.formCardHeaderText}>
                  <h2 className={styles.formCardTitle}>Ubah Password</h2>
                  <p className={styles.formCardSub}>Gunakan password kuat yang unik dan belum pernah dipakai</p>
                </div>
              </div>
              <form className={styles.form} onSubmit={handlePasswordSave}>

                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="pw-current">Password Saat Ini</label>
                  <div className={styles.inputWrap}>
                    <Lock size={15} className={styles.inputIcon} />
                    <input id="pw-current" type={showPwCur ? "text" : "password"}
                      className={styles.input} value={pwCurrent}
                      onChange={(e) => setPwCurrent(e.target.value)}
                      placeholder="Masukkan password saat ini" autoComplete="current-password" />
                    <button type="button" className={styles.eyeBtn} onClick={() => setShowPwCur(v => !v)}>
                      {showPwCur ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label} htmlFor="pw-new">Password Baru</label>
                    <div className={styles.inputWrap}>
                      <Lock size={15} className={styles.inputIcon} />
                      <input id="pw-new" type={showPwNew ? "text" : "password"}
                        className={styles.input} value={pwNew}
                        onChange={(e) => setPwNew(e.target.value)}
                        placeholder="Min. 8 karakter" autoComplete="new-password" />
                      <button type="button" className={styles.eyeBtn} onClick={() => setShowPwNew(v => !v)}>
                        {showPwNew ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <StrengthBar password={pwNew} />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label} htmlFor="pw-confirm">Konfirmasi Password</label>
                    <div className={styles.inputWrap} style={
                      pwMatch    ? { borderColor: "#22c55e", boxShadow: "0 0 0 3px rgba(34,197,94,0.12)" } :
                      pwMismatch ? { borderColor: "#ef4444", boxShadow: "0 0 0 3px rgba(239,68,68,0.12)" } : {}
                    }>
                      <Lock size={15} className={styles.inputIcon} />
                      <input id="pw-confirm" type={showPwCon ? "text" : "password"}
                        className={styles.input} value={pwConfirm}
                        onChange={(e) => setPwConfirm(e.target.value)}
                        placeholder="Ulangi password baru" autoComplete="new-password" />
                      <button type="button" className={styles.eyeBtn} onClick={() => setShowPwCon(v => !v)}>
                        {showPwCon ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {pwMatch    && <div className={styles.matchHint} style={{ color: "#16a34a" }}><Check size={13} /> Password cocok</div>}
                    {pwMismatch && <div className={styles.matchHint} style={{ color: "#dc2626" }}><X size={13} /> Password tidak cocok</div>}
                  </div>
                </div>

                {/* Tips */}
                <div className={styles.pwTips}>
                  <p className={styles.pwTipsTitle}>Tips Password Kuat</p>
                  {[
                    { ok: pwNew.length >= 8,           text: "Minimal 8 karakter" },
                    { ok: /[A-Z]/.test(pwNew),          text: "Mengandung huruf kapital (A–Z)" },
                    { ok: /[0-9]/.test(pwNew),          text: "Mengandung angka (0–9)" },
                    { ok: /[^A-Za-z0-9]/.test(pwNew),  text: "Mengandung simbol (!@#$…)" },
                  ].map((tip, i) => (
                    <div key={i} className={styles.pwTipItem}>
                      <div className={styles.pwTipDot} style={{ background: tip.ok && pwNew ? "#dcfce7" : "#f5e8e0" }}>
                        {tip.ok && pwNew ? <Check size={10} color="#16a34a" /> : <X size={9} color="#c8945a" />}
                      </div>
                      <span style={{ color: tip.ok && pwNew ? "#16a34a" : "#9e7b5e", fontWeight: tip.ok && pwNew ? 600 : 400 }}>
                        {tip.text}
                      </span>
                    </div>
                  ))}
                </div>

                <div className={styles.formFooter}>
                  <button type="submit" className={`${styles.btnPrimary} ${styles.btnDanger}`} disabled={pwSaving}>
                    {pwSaving
                      ? <><Loader2 size={15} className={styles.spin} /> Menyimpan…</>
                      : <><KeyRound size={15} /> Perbarui Password</>}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
