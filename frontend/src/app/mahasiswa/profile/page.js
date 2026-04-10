"use client";

import { useState } from "react";
import { useMahasiswa } from "@/context/MahasiswaContext";
import { Camera, Save, Lock, Mail, User, GraduationCap } from "lucide-react";
import styles from "./profile.module.css";

export default function ProfilePage() {
  const { user, updateUser, prodiConfig } = useMahasiswa();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ nama: user.nama, email: user.email });
  const [passwordForm, setPasswordForm] = useState({ old: "", new: "", confirm: "" });
  const [message, setMessage] = useState("");

  const handleSaveProfile = () => {
    updateUser(form);
    setEditMode(false);
    setMessage("Profil berhasil diperbarui");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleChangePassword = () => {
    if (passwordForm.new !== passwordForm.confirm) {
      setMessage("Password baru tidak cocok");
      return;
    }
    // API call
    setMessage("Password berhasil diubah");
    setPasswordForm({ old: "", new: "", confirm: "" });
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header} style={{ borderBottomColor: prodiConfig.primary }}>
        <h1 className={styles.title}>Profil Saya</h1>
        <p className={styles.subtitle}>Kelola informasi akun Anda</p>
      </div>

      {message && <div className={styles.toast} style={{ background: prodiConfig.primary }}>{message}</div>}

      <div className={styles.profileCard}>
        <div className={styles.avatarSection}>
          <div className={styles.avatar} style={{ background: prodiConfig.gradient }}>
            {user.foto ? <img src={user.foto} alt="avatar" /> : user.nama.charAt(0)}
          </div>
          <button className={styles.avatarBtn} style={{ borderColor: prodiConfig.primary }}>
            <Camera size={16} /> Ganti Foto
          </button>
        </div>

        <div className={styles.infoSection}>
          <div className={styles.infoRow}>
            <User size={18} style={{ color: prodiConfig.primary }} />
            <div className={styles.infoLabel}>Nama Lengkap</div>
            {editMode ? (
              <input value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} className={styles.input} />
            ) : (
              <div className={styles.infoValue}>{user.nama}</div>
            )}
          </div>
          <div className={styles.infoRow}>
            <GraduationCap size={18} style={{ color: prodiConfig.primary }} />
            <div className={styles.infoLabel}>NIM</div>
            <div className={styles.infoValue}>{user.nim}</div>
          </div>
          <div className={styles.infoRow}>
            <Mail size={18} style={{ color: prodiConfig.primary }} />
            <div className={styles.infoLabel}>Email</div>
            {editMode ? (
              <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={styles.input} />
            ) : (
              <div className={styles.infoValue}>{user.email}</div>
            )}
          </div>
          <div className={styles.infoRow}>
            <div className={styles.infoLabel}>Program Studi</div>
            <div className={styles.infoValue}>{user.prodi}</div>
          </div>
          <div className={styles.infoRow}>
            <div className={styles.infoLabel}>Angkatan</div>
            <div className={styles.infoValue}>{user.angkatan}</div>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          {editMode ? (
            <>
              <button className={styles.saveBtn} onClick={handleSaveProfile} style={{ background: prodiConfig.primary }}>Simpan</button>
              <button className={styles.cancelBtn} onClick={() => setEditMode(false)}>Batal</button>
            </>
          ) : (
            <button className={styles.editBtn} onClick={() => setEditMode(true)} style={{ borderColor: prodiConfig.primary, color: prodiConfig.primary }}>Edit Profil</button>
          )}
        </div>
      </div>

      {/* Ganti Password */}
      <div className={styles.passwordCard}>
        <h3 className={styles.cardTitle}><Lock size={18} /> Ganti Password</h3>
        <div className={styles.passwordForm}>
          <input type="password" placeholder="Password Lama" value={passwordForm.old} onChange={e => setPasswordForm({...passwordForm, old: e.target.value})} className={styles.input} />
          <input type="password" placeholder="Password Baru" value={passwordForm.new} onChange={e => setPasswordForm({...passwordForm, new: e.target.value})} className={styles.input} />
          <input type="password" placeholder="Konfirmasi Password Baru" value={passwordForm.confirm} onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})} className={styles.input} />
          <button onClick={handleChangePassword} className={styles.changePwBtn} style={{ background: prodiConfig.primary }}>Ubah Password</button>
        </div>
      </div>
    </div>
  );
}