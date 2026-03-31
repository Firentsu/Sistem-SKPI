"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, useRef } from "react";
import styles from "./profile.module.css";
import {
  Camera, User, Mail, Hash, Shield, Lock,
  Eye, EyeOff, CheckCircle, AlertCircle,
  Save, KeyRound, Upload, Loader2
} from "lucide-react";

export default function AdminProfilePage() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // Avatar
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileRef = useRef(null);

  // Profile edit
  const [profileForm, setProfileForm] = useState({ nama_admin: "", email: "" });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
  const [pwLoading, setPwLoading] = useState(false);

  // Feedback
  const [toast, setToast] = useState(null); // { type: 'success'|'error', msg }

  function showToast(type, msg) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  // Fetch admin profile
  useEffect(() => {
    fetch("/api/admin/profile")
      .then((r) => r.json())
      .then((d) => {
        setAdmin(d);
        setProfileForm({ nama_admin: d.nama_admin || "", email: d.email || "" });
      })
      .catch(() => setAdmin({}))
      .finally(() => setLoading(false));
  }, []);

  // Preview selected file
  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Handle avatar upload
  async function handleAvatarUpload() {
    if (!file) return showToast("error", "Pilih foto terlebih dahulu.");
    if (file.size > 2 * 1024 * 1024) return showToast("error", "Ukuran file maksimal 2MB.");

    setAvatarLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await fetch("/api/admin/avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, data: reader.result }),
        });
        const json = await res.json();
        if (res.ok) {
          setAdmin((prev) => ({ ...prev, avatar: json.avatar }));
          setFile(null);
          setPreview(null);
          showToast("success", "Foto profil berhasil diperbarui.");
        } else {
          showToast("error", json.error || "Upload gagal.");
        }
      } catch {
        showToast("error", "Terjadi kesalahan jaringan.");
      } finally {
        setAvatarLoading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  // Handle profile save
  async function handleProfileSave(e) {
    e.preventDefault();
    if (!profileForm.nama_admin.trim()) return showToast("error", "Nama tidak boleh kosong.");
    setProfileLoading(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      const json = await res.json();
      if (res.ok) {
        setAdmin((prev) => ({ ...prev, ...profileForm }));
        showToast("success", "Profil berhasil disimpan.");
      } else {
        showToast("error", json.error || "Gagal menyimpan profil.");
      }
    } catch {
      showToast("error", "Terjadi kesalahan jaringan.");
    } finally {
      setProfileLoading(false);
    }
  }

  // Handle password change
  async function handlePasswordChange(e) {
    e.preventDefault();
    if (!pwForm.current) return showToast("error", "Masukkan password saat ini.");
    if (pwForm.newPw.length < 6) return showToast("error", "Password baru minimal 6 karakter.");
    if (pwForm.newPw !== pwForm.confirm) return showToast("error", "Konfirmasi password tidak cocok.");
    setPwLoading(true);
    try {
      const res = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.newPw }),
      });
      const json = await res.json();
      if (res.ok) {
        setPwForm({ current: "", newPw: "", confirm: "" });
        showToast("success", "Password berhasil diperbarui.");
      } else {
        showToast("error", json.error || "Gagal mengubah password.");
      }
    } catch {
      showToast("error", "Terjadi kesalahan jaringan.");
    } finally {
      setPwLoading(false);
    }
  }

  // Password strength
  function pwStrength(pw) {
    if (!pw) return null;
    if (pw.length < 6) return { level: 1, label: "Lemah", color: "#ef4444" };
    if (pw.length < 10 || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) return { level: 2, label: "Sedang", color: "#f59e0b" };
    return { level: 3, label: "Kuat", color: "#10b981" };
  }

  const strength = pwStrength(pwForm.newPw);
  const avatarSrc = preview || admin?.avatar || "/img/avatar_placeholder.png";

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <span>Memuat profil…</span>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${styles[`toast_${toast.type}`]}`}>
          {toast.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Profil Saya</h1>
        <p className={styles.pageSubtitle}>Kelola informasi akun dan keamanan Anda</p>
      </div>

      <div className={styles.grid}>
        {/* LEFT — Avatar Card */}
        <div className={styles.avatarCard}>
          <div className={styles.avatarSection}>
            <div className={styles.avatarRing}>
              <img src={avatarSrc} alt="avatar" className={styles.avatarImg} />
              <button
                className={styles.cameraBtn}
                onClick={() => fileRef.current?.click()}
                title="Ganti foto"
              >
                <Camera size={16} />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className={styles.avatarName}>{admin?.nama_admin || "Admin"}</div>
            <div className={styles.avatarRole}>
              <Shield size={12} />
              Administrator
            </div>
            {admin?.username && (
              <div className={styles.avatarUsername}>@{admin.username}</div>
            )}
          </div>

          {/* Upload controls */}
          <div className={styles.uploadArea}>
            {file ? (
              <div className={styles.fileSelected}>
                <div className={styles.fileInfo}>
                  <Upload size={14} />
                  <span>{file.name}</span>
                  <span className={styles.fileSize}>({(file.size / 1024).toFixed(0)} KB)</span>
                </div>
                <div className={styles.uploadActions}>
                  <button
                    className={styles.btnUpload}
                    onClick={handleAvatarUpload}
                    disabled={avatarLoading}
                  >
                    {avatarLoading ? <Loader2 size={14} className={styles.spin} /> : <Upload size={14} />}
                    {avatarLoading ? "Mengupload…" : "Upload Foto"}
                  </button>
                  <button
                    className={styles.btnCancel}
                    onClick={() => { setFile(null); setPreview(null); }}
                    disabled={avatarLoading}
                  >
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <button
                className={styles.btnSelectFile}
                onClick={() => fileRef.current?.click()}
              >
                <Camera size={15} />
                Pilih Foto Baru
              </button>
            )}
            <p className={styles.uploadHint}>JPG, PNG, atau WebP · Maks. 2MB</p>
          </div>

          {/* Info card */}
          <div className={styles.infoMeta}>
            {[
              { icon: Hash, label: "ID Admin", value: admin?.id_admin || "—" },
              { icon: User, label: "Username", value: admin?.username || "—" },
              { icon: Mail, label: "Email", value: admin?.email || "—" },
            ].map((item) => (
              <div key={item.label} className={styles.metaRow}>
                <item.icon size={13} className={styles.metaIcon} />
                <span className={styles.metaLabel}>{item.label}</span>
                <span className={styles.metaValue}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Forms */}
        <div className={styles.formsCol}>
          {/* Edit Profile */}
          <div className={styles.formCard}>
            <div className={styles.formCardHeader}>
              <div className={styles.formCardIcon}><User size={17} /></div>
              <div>
                <h2 className={styles.formCardTitle}>Informasi Profil</h2>
                <p className={styles.formCardSub}>Perbarui nama dan email akun Anda</p>
              </div>
            </div>

            <form onSubmit={handleProfileSave} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Nama Lengkap</label>
                  <div className={styles.inputWrap}>
                    <User size={15} className={styles.inputIcon} />
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Nama lengkap admin"
                      value={profileForm.nama_admin}
                      onChange={(e) => setProfileForm((p) => ({ ...p, nama_admin: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Email</label>
                  <div className={styles.inputWrap}>
                    <Mail size={15} className={styles.inputIcon} />
                    <input
                      type="email"
                      className={styles.input}
                      placeholder="email@isb.ac.id"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.formFooter}>
                <button type="submit" className={styles.btnPrimary} disabled={profileLoading}>
                  {profileLoading ? <Loader2 size={15} className={styles.spin} /> : <Save size={15} />}
                  {profileLoading ? "Menyimpan…" : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className={styles.formCard}>
            <div className={styles.formCardHeader}>
              <div className={`${styles.formCardIcon} ${styles.formCardIconRed}`}><KeyRound size={17} /></div>
              <div>
                <h2 className={styles.formCardTitle}>Ubah Password</h2>
                <p className={styles.formCardSub}>Gunakan password yang kuat dan unik</p>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className={styles.form}>
              {/* Current password */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Password Saat Ini</label>
                <div className={styles.inputWrap}>
                  <Lock size={15} className={styles.inputIcon} />
                  <input
                    type={showPw.current ? "text" : "password"}
                    className={styles.input}
                    placeholder="Masukkan password lama"
                    value={pwForm.current}
                    onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))}
                    required
                  />
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowPw((p) => ({ ...p, current: !p.current }))}>
                    {showPw.current ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className={styles.formRow}>
                {/* New password */}
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Password Baru</label>
                  <div className={styles.inputWrap}>
                    <Lock size={15} className={styles.inputIcon} />
                    <input
                      type={showPw.newPw ? "text" : "password"}
                      className={styles.input}
                      placeholder="Min. 6 karakter"
                      value={pwForm.newPw}
                      onChange={(e) => setPwForm((p) => ({ ...p, newPw: e.target.value }))}
                      required
                    />
                    <button type="button" className={styles.eyeBtn} onClick={() => setShowPw((p) => ({ ...p, newPw: !p.newPw }))}>
                      {showPw.newPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {pwForm.newPw && strength && (
                    <div className={styles.strengthWrap}>
                      <div className={styles.strengthTrack}>
                        {[1, 2, 3].map((n) => (
                          <div
                            key={n}
                            className={styles.strengthSegment}
                            style={{ background: n <= strength.level ? strength.color : "#f0e4d8" }}
                          />
                        ))}
                      </div>
                      <span style={{ color: strength.color }}>{strength.label}</span>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Konfirmasi Password</label>
                  <div className={styles.inputWrap}>
                    <Lock size={15} className={styles.inputIcon} />
                    <input
                      type={showPw.confirm ? "text" : "password"}
                      className={styles.input}
                      placeholder="Ulangi password baru"
                      value={pwForm.confirm}
                      onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                      required
                    />
                    <button type="button" className={styles.eyeBtn} onClick={() => setShowPw((p) => ({ ...p, confirm: !p.confirm }))}>
                      {showPw.confirm ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {pwForm.confirm && (
                    <div className={styles.matchHint} style={{ color: pwForm.newPw === pwForm.confirm ? "#10b981" : "#ef4444" }}>
                      {pwForm.newPw === pwForm.confirm
                        ? <><CheckCircle size={12} /> Password cocok</>
                        : <><AlertCircle size={12} /> Password tidak cocok</>}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.formFooter}>
                <button type="submit" className={`${styles.btnPrimary} ${styles.btnDanger}`} disabled={pwLoading}>
                  {pwLoading ? <Loader2 size={15} className={styles.spin} /> : <KeyRound size={15} />}
                  {pwLoading ? "Memproses…" : "Ubah Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}