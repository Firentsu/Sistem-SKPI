"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User, Mail, Lock, Eye, EyeOff, Camera, Check, X, Upload,
  Shield, Clock, Loader2, KeyRound, AtSign, Save,
  CheckCircle2, AlertCircle, ArrowLeft, ImageIcon,
} from "lucide-react";
import styles from "../admin.module.css";

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
  if (pw.length >= 8)           score++;
  if (/[A-Z]/.test(pw))         score++;
  if (/[0-9]/.test(pw))         score++;
  if (/[^A-Za-z0-9]/.test(pw))  score++;
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
        {[0,1,2,3].map((i) => (
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
function AvatarViewModal({ src, name, onClose, onEdit }) {
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#1a0e06", borderRadius: 20, padding: "24px 24px 20px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 18,
        maxWidth: 360, width: "100%",
        boxShadow: "0 32px 80px rgba(0,0,0,0.55)",
        border: "1px solid rgba(253,230,138,0.12)",
        animation: "slideUp 0.22s cubic-bezier(.4,0,.2,1)",
      }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:28, height:28, background:"rgba(253,230,138,0.1)", borderRadius:8,
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <ImageIcon size={14} color="#fde68a" />
            </div>
            <span style={{ color:"#fde68a", fontWeight:800, fontSize:14 }}>Foto Profil</span>
          </div>
          <button onClick={onClose} style={{
            background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
            borderRadius:7, width:28, height:28, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            color:"rgba(253,230,138,0.5)"
          }} aria-label="Tutup"><X size={14} /></button>
        </div>

        <div style={{ position:"relative" }}>
          <div style={{ position:"absolute", inset:-6, borderRadius:"50%",
            background:"linear-gradient(135deg,rgba(253,230,138,0.25),transparent)",
            filter:"blur(8px)" }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={name} style={{
            width:190, height:190, borderRadius:"50%", objectFit:"cover",
            border:"3px solid rgba(253,230,138,0.4)",
            boxShadow:"0 12px 40px rgba(0,0,0,0.5)", display:"block", position:"relative",
          }} />
        </div>

        <div style={{ textAlign:"center" }}>
          <p style={{ margin:0, color:"#fde68a", fontWeight:800, fontSize:16 }}>{name}</p>
          <p style={{ margin:"5px 0 0", color:"#a07858", fontSize:12 }}>Administrator · Institut Shanti Bhuana</p>
        </div>

        <div style={{ display:"flex", gap:8, width:"100%" }}>
          <button className={styles.modalBtnCancel} onClick={onClose} style={{ flex:1 }}>Tutup</button>
          <button className={styles.modalBtnSave}   onClick={onEdit}  style={{ flex:1, justifyContent:"center" }}>
            <Camera size={14} /> Ganti Foto
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Profile Page
───────────────────────────────────────── */
export default function ProfilePage() {
  const router = useRouter();
  const { toast, show: showToast, hide: hideToast } = useToast();

  const [loading,      setLoading]      = useState(true);
  const [profileData,  setProfileData]  = useState(null);

  /* ── Avatar ── */
  const [avatarSrc,       setAvatarSrc]       = useState("/img/avatar.jpg");
  const [showViewer,      setShowViewer]       = useState(false);
  const [showUploader,    setShowUploader]     = useState(false);
  const [avatarFile,      setAvatarFile]       = useState(null);
  const [avatarPreview,   setAvatarPreview]    = useState(null);
  const [uploadingAvatar, setUploadingAvatar]  = useState(false);
  const [draggingAvatar,  setDraggingAvatar]   = useState(false);
  const avatarInputRef = useRef(null);

  /* ── Username ── */
  const [username,       setUsername]       = useState("");
  const [usernameSaving, setUsernameSaving] = useState(false);

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

  /* ════════════════════════════════════════
     Load profile dari API
  ════════════════════════════════════════ */
  useEffect(() => {
    (async () => {
      try {
        const res  = await (async () => { const { getProfile } = await import("@/lib/api"); const d = await getProfile(); return { ok: true, json: async () => d }; })();
        if (!res.ok) { router.replace("/"); return; }
        const data = await res.json();
        setProfileData(data);
        setEmail(data.email ?? "");
        setUsername(data.username ?? "");
        if (data.avatar) setAvatarSrc(data.avatar);
      } catch {
        router.replace("/");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  /* ── Avatar helpers ── */
  const ACCEPTED = ["image/jpeg","image/png","image/webp","image/gif"];
  const MAX_MB   = 2;

  function processAvatarFile(file) {
    if (!ACCEPTED.includes(file.type)) {
      showToast("Format tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.", "error"); return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      showToast(`Ukuran file maksimal ${MAX_MB} MB.`, "error"); return;
    }
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function cancelAvatarSelect() {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(null);
    setAvatarPreview(null);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  }

  async function handleAvatarUpload() {
    if (!avatarFile || uploadingAvatar) return;
    setUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append("avatar", avatarFile, avatarFile.name);

      const { uploadAvatar } = await import("@/lib/api");
      const result = await uploadAvatar(form);
      if (!result.ok) { showToast(result.data?.error ?? "Gagal mengunggah foto.", "error"); return; }

      setAvatarSrc(result.data.avatar);
      cancelAvatarSelect();
      setShowUploader(false);
      showToast("Foto profil berhasil diperbarui.");

      // ── Sync avatar ke topbar layout ──
      window.dispatchEvent(new CustomEvent("avatar:updated", { detail: { avatar: data.avatar } }));
    } catch {
      showToast("Gagal mengunggah foto. Coba lagi.", "error");
    } finally {
      setUploadingAvatar(false);
    }
  }

  useEffect(() => () => { if (avatarPreview) URL.revokeObjectURL(avatarPreview); }, [avatarPreview]);

  /* ── Username save ── */
  async function handleUsernameSave(e) {
    e.preventDefault();
    if (usernameSaving) return;
    const trimmed = username.trim();
    if (!trimmed || trimmed.length < 3) {
      showToast("Username minimal 3 karakter.", "error"); return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      showToast("Username hanya boleh huruf, angka, dan underscore (_).", "error"); return;
    }
    setUsernameSaving(true);
    try {
      const { updateProfile } = await import("@/lib/api");
      const { ok, data } = await updateProfile({ action: "username", username: trimmed });
      if (!ok) { showToast(data.error ?? "Gagal memperbarui username.", "error"); return; }
      setProfileData((prev) => prev ? { ...prev, username: trimmed } : prev);
      showToast("Username berhasil diperbarui.");

      // ── Sync username ke topbar layout ──
      window.dispatchEvent(new CustomEvent("profile:updated", { detail: { username: trimmed } }));
    } catch {
      showToast("Gagal memperbarui username. Coba lagi.", "error");
    } finally {
      setUsernameSaving(false);
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
      const { updateProfile } = await import("@/lib/api");
      const { ok, data } = await updateProfile({ action: "email", email: trimmed });
      if (!ok) { showToast(data.error ?? "Gagal memperbarui email.", "error"); return; }
      setProfileData((prev) => prev ? { ...prev, email: trimmed } : prev);
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
    if (!pwCurrent)          { showToast("Masukkan password saat ini.", "error"); return; }
    if (pwNew.length < 8)    { showToast("Password baru minimal 8 karakter.", "error"); return; }
    if (pwNew !== pwConfirm) { showToast("Konfirmasi password tidak cocok.", "error"); return; }
    if (getStrength(pwNew).score < 2) {
      showToast("Password terlalu lemah. Tambahkan huruf besar, angka, atau simbol.", "error"); return;
    }
    setPwSaving(true);
    try {
      const { updateProfile } = await import("@/lib/api");
      const { ok, data } = await updateProfile({ action: "password", currentPassword: pwCurrent, newPassword: pwNew });
      if (!ok) { showToast(data.error ?? "Gagal memperbarui password.", "error"); return; }
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

  const displayName  = profileData?.nama_admin ?? profileData?.username ?? "Admin";
  const displayEmail = profileData?.email ?? "-";
  const joinedDate   = profileData?.created_at
    ? new Date(profileData.created_at).toLocaleDateString("id-ID", { month:"long", year:"numeric" })
    : "-";

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

      {showViewer && (
        <AvatarViewModal
          src={avatarSrc} name={displayName}
          onClose={() => setShowViewer(false)}
          onEdit={() => { setShowViewer(false); setShowUploader(true); }}
        />
      )}

      <div className={styles.page}>

        {/* ── Header ── */}
        <div className={styles.pageHeader}>
          <div className={styles.pageTitleRow}>
            <button
              onClick={() => router.back()}
              style={{
                background:"none", border:"1.5px solid #e8d5c4", borderRadius:10,
                width:38, height:38, display:"flex", alignItems:"center",
                justifyContent:"center", cursor:"pointer", color:"#9e7b5e",
                flexShrink:0, transition:"all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background="#f5ece4"; e.currentTarget.style.color="#765439"; }}
              onMouseLeave={e => { e.currentTarget.style.background="none"; e.currentTarget.style.color="#9e7b5e"; }}
              aria-label="Kembali"
            ><ArrowLeft size={16} /></button>
            <div className={styles.pageTitleIcon}><User size={22} /></div>
            <div>
              <h1 className={styles.pageTitle}>Profil Saya</h1>
              <p className={styles.pageSubtitle}>Kelola informasi akun dan keamanan Anda</p>
            </div>
          </div>
        </div>

        <div className={styles.grid}>

          {/* ══════════════════════════════
              LEFT — Avatar Card
          ══════════════════════════════ */}
          <div className={styles.avatarCard}>
            <div className={styles.avatarSection}>
              <div className={styles.avatarBgCircle1} />
              <div className={styles.avatarBgCircle2} />
              <div className={styles.avatarRing}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarSrc} alt="Foto Profil" className={styles.avatarImg}
                  onClick={() => setShowViewer(true)} style={{ cursor:"pointer" }}
                  title="Klik untuk melihat foto penuh"
                />
                <button className={styles.cameraBtn}
                  onClick={() => setShowUploader((v) => !v)}
                  aria-label="Ganti foto profil" title="Ganti foto profil">
                  <Camera size={14} />
                </button>
              </div>
              <p className={styles.avatarName}>{displayName}</p>
              <div className={styles.avatarRole}><Shield size={11} /> Administrator</div>
              <p className={styles.avatarUsername}>{displayEmail}</p>
            </div>

            {/* Upload Panel */}
            {showUploader && (
              <div className={styles.uploadArea}>
                {!avatarFile ? (
                  <>
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDraggingAvatar(true); }}
                      onDragLeave={() => setDraggingAvatar(false)}
                      onDrop={(e) => {
                        e.preventDefault(); setDraggingAvatar(false);
                        const f = e.dataTransfer.files?.[0]; if (f) processAvatarFile(f);
                      }}
                      onClick={() => avatarInputRef.current?.click()}
                      role="button" tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && avatarInputRef.current?.click()}
                      style={{
                        border:`1.5px dashed ${draggingAvatar ? "#765439" : "#d5bfaf"}`,
                        borderRadius:12, padding:"18px 12px",
                        display:"flex", flexDirection:"column", alignItems:"center", gap:6,
                        cursor:"pointer", background: draggingAvatar ? "#fdf3ec" : "#fdf8f4",
                        transition:"all 0.2s", width:"100%", boxSizing:"border-box",
                      }}
                    >
                      <div style={{ width:38, height:38, background:"linear-gradient(135deg,#fde8cc,#f5d0a0)",
                        borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <Upload size={18} color="#765439" />
                      </div>
                      <span style={{ fontSize:13, color:"#5c3317", fontWeight:600, textAlign:"center" }}>
                        {draggingAvatar ? "Lepaskan di sini…" : "Klik atau seret foto"}
                      </span>
                      <span style={{ fontSize:11, color:"#b09880" }}>JPG, PNG, WebP, GIF · maks. 2 MB</span>
                    </div>
                    <input ref={avatarInputRef} type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif" style={{ display:"none" }}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) processAvatarFile(f); }} />
                    <button
                      style={{ background:"none", border:"none", cursor:"pointer", color:"#b09880", fontSize:12, marginTop:2 }}
                      onClick={() => setShowUploader(false)}>
                      Batal
                    </button>
                  </>
                ) : (
                  <div className={styles.fileSelected}>
                    <div style={{ display:"flex", justifyContent:"center", marginBottom:4 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={avatarPreview} alt="preview" style={{
                        width:80, height:80, borderRadius:"50%", objectFit:"cover",
                        border:"2.5px solid #e8d5c4", boxShadow:"0 4px 14px rgba(118,84,57,0.18)",
                      }} />
                    </div>
                    <div className={styles.fileInfo}>
                      <span>{avatarFile.name}</span>
                      <span className={styles.fileSize}>{(avatarFile.size/1024).toFixed(0)} KB</span>
                    </div>
                    <div className={styles.uploadActions}>
                      <button className={styles.btnUpload} onClick={handleAvatarUpload} disabled={uploadingAvatar}>
                        {uploadingAvatar
                          ? <><Loader2 size={14} className={styles.spin} /> Mengunggah…</>
                          : <><Upload size={14} /> Simpan Foto</>}
                      </button>
                      <button className={styles.btnCancel} onClick={cancelAvatarSelect} disabled={uploadingAvatar}>
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Meta */}
            <div className={styles.infoMeta}>
              <div className={styles.metaRow}>
                <div className={styles.metaIconWrap}><AtSign size={13} className={styles.metaIcon} /></div>
                <span className={styles.metaLabel}>Email</span>
                <span className={styles.metaValue}>{displayEmail}</span>
              </div>
              <div className={styles.metaRow}>
                <div className={styles.metaIconWrap}><Shield size={13} className={styles.metaIcon} /></div>
                <span className={styles.metaLabel}>Username</span>
                <span className={styles.metaValue}>{profileData?.username ?? "-"}</span>
              </div>
              <div className={styles.metaRow}>
                <div className={styles.metaIconWrap}><Clock size={13} className={styles.metaIcon} /></div>
                <span className={styles.metaLabel}>Bergabung</span>
                <span className={styles.metaValue}>{joinedDate}</span>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════
              RIGHT — Forms
          ══════════════════════════════ */}
          <div className={styles.formsCol}>

            {/* Username Form */}
            <div className={styles.formCard}>
              <div className={styles.formCardHeader}>
                <div className={styles.formCardIcon}><User size={20} /></div>
                <div className={styles.formCardHeaderText}>
                  <h2 className={styles.formCardTitle}>Ubah Username</h2>
                  <p className={styles.formCardSub}>Perbarui username untuk login ke sistem</p>
                </div>
              </div>
              <form className={styles.form} onSubmit={handleUsernameSave}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="username">Username</label>
                  <div className={styles.inputWrap}>
                    <AtSign size={15} className={styles.inputIcon} />
                    <input
                      id="username"
                      type="text"
                      className={styles.input}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Contoh: admin_isb"
                      autoComplete="username"
                      required
                    />
                  </div>
                  <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "#b09880" }}>
                    Hanya huruf, angka, dan underscore (_). Minimal 3 karakter.
                  </p>
                </div>
                <div className={styles.formFooter}>
                  <button type="submit" className={styles.btnPrimary} disabled={usernameSaving}>
                    {usernameSaving
                      ? <><Loader2 size={15} className={styles.spin} /> Menyimpan…</>
                      : <><Save size={15} /> Simpan Username</>}
                  </button>
                </div>
              </form>
            </div>

            {/* Email Form */}
            <div className={styles.formCard}>
              <div className={styles.formCardHeader}>
                <div className={styles.formCardIcon}><Mail size={20} /></div>
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
                  <button type="submit" className={styles.btnPrimary} disabled={emailSaving}>
                    {emailSaving
                      ? <><Loader2 size={15} className={styles.spin} /> Menyimpan…</>
                      : <><Save size={15} /> Simpan Email</>}
                  </button>
                </div>
              </form>
            </div>

            {/* Password Form */}
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
                    <button type="button" className={styles.eyeBtn}
                      onClick={() => setShowPwCur((v) => !v)}>
                      {showPwCur ? <EyeOff size={15}/> : <Eye size={15}/>}
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
                      <button type="button" className={styles.eyeBtn}
                        onClick={() => setShowPwNew((v) => !v)}>
                        {showPwNew ? <EyeOff size={15}/> : <Eye size={15}/>}
                      </button>
                    </div>
                    <StrengthBar password={pwNew} />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label} htmlFor="pw-confirm">Konfirmasi Password</label>
                    <div className={styles.inputWrap} style={
                      pwMatch    ? { borderColor:"#22c55e", boxShadow:"0 0 0 3px rgba(34,197,94,0.12)" } :
                      pwMismatch ? { borderColor:"#ef4444", boxShadow:"0 0 0 3px rgba(239,68,68,0.12)" } : {}
                    }>
                      <Lock size={15} className={styles.inputIcon} />
                      <input id="pw-confirm" type={showPwCon ? "text" : "password"}
                        className={styles.input} value={pwConfirm}
                        onChange={(e) => setPwConfirm(e.target.value)}
                        placeholder="Ulangi password baru" autoComplete="new-password" />
                      <button type="button" className={styles.eyeBtn}
                        onClick={() => setShowPwCon((v) => !v)}>
                        {showPwCon ? <EyeOff size={15}/> : <Eye size={15}/>}
                      </button>
                    </div>
                    {pwMatch    && <div className={styles.matchHint} style={{ color:"#16a34a" }}><Check size={13}/> Password cocok</div>}
                    {pwMismatch && <div className={styles.matchHint} style={{ color:"#dc2626" }}><X size={13}/> Password tidak cocok</div>}
                  </div>
                </div>

                {/* Tips checklist */}
                <div style={{ background:"#fdf8f4", border:"1px solid #f0e0cc", borderRadius:10, padding:"12px 14px" }}>
                  <p style={{ margin:"0 0 8px", fontSize:11.5, fontWeight:700, color:"#765439",
                    textTransform:"uppercase", letterSpacing:"0.05em" }}>
                    Tips Password Kuat
                  </p>
                  {[
                    { ok: pwNew.length >= 8,           text: "Minimal 8 karakter" },
                    { ok: /[A-Z]/.test(pwNew),         text: "Mengandung huruf kapital (A–Z)" },
                    { ok: /[0-9]/.test(pwNew),         text: "Mengandung angka (0–9)" },
                    { ok: /[^A-Za-z0-9]/.test(pwNew),  text: "Mengandung simbol (!@#$…)" },
                  ].map((tip, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:7, marginTop:5 }}>
                      <div style={{
                        width:16, height:16, borderRadius:"50%",
                        background: tip.ok && pwNew ? "#dcfce7" : "#f5e8e0",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        flexShrink:0, transition:"background 0.25s",
                      }}>
                        {tip.ok && pwNew ? <Check size={10} color="#16a34a"/> : <X size={9} color="#c8945a"/>}
                      </div>
                      <span style={{
                        fontSize:12, transition:"color 0.25s",
                        color: tip.ok && pwNew ? "#16a34a" : "#9e7b5e",
                        fontWeight: tip.ok && pwNew ? 600 : 400,
                      }}>{tip.text}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.formFooter}>
                  <button type="submit"
                    className={`${styles.btnPrimary} ${styles.btnDanger}`}
                    disabled={pwSaving}>
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