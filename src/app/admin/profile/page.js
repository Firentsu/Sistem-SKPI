"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from 'react';
import styles from '../admin.module.css';

export default function AdminProfilePage() {
  const [admin, setAdmin] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/admin/profile')
      .then(r => r.json())
      .then(d => setAdmin(d))
      .catch(() => setAdmin({}));
  }, []);

  useEffect(() => {
    if (!file) {
      // avoid synchronous setState in effect
      const t = setTimeout(() => setPreview(null), 0);
      return () => clearTimeout(t);
    }
    const url = URL.createObjectURL(file);
    const t = setTimeout(() => setPreview(url), 0);
    return () => {
      clearTimeout(t);
      URL.revokeObjectURL(url);
      setPreview(null);
    };
  }, [file]);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return setMsg('Pilih file terlebih dahulu');

    // read file as base64
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;
      const res = await fetch('/api/admin/avatar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename: file.name, data: dataUrl }) });
      const json = await res.json();
      if (res.ok) {
        setAdmin(prev => ({ ...prev, avatar: json.avatar }));
        setMsg('Avatar berhasil diupload');
        setFile(null);
      } else {
        setMsg(json.error || 'Upload gagal');
      }
    };
    reader.readAsDataURL(file);
  }

  if (!admin) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: 900 }}>
      <h1>Profil Admin</h1>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <img src={admin.avatar || '/img/avatar_placeholder.png'} alt="avatar" width={96} height={96} style={{ borderRadius: 12, objectFit: 'cover' }} />
        <div>
          <div style={{ fontWeight: 700 }}>{admin.nama_admin || '—'}</div>
          <div style={{ color: '#64748b' }}>{admin.email || '—'}</div>
        </div>
      </div>

      <form onSubmit={handleUpload} style={{ marginTop: 20 }}>
        <label style={{ display: 'block', marginBottom: 8 }}>Pilih foto (jpg/png/webp, max 2MB)</label>
        <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] ?? null)} />
        {preview && <div style={{ marginTop: 10 }}><img src={preview} alt="preview" width={160} style={{ borderRadius: 8 }} /></div>}
        <div style={{ marginTop: 12 }}>
          <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>Upload Avatar</button>
        </div>
      </form>

      {msg && <div style={{ marginTop: 12, color: '#065f46' }}>{msg}</div>}
    </div>
  );
}
