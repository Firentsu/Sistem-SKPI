"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../admin.module.css';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const router = useRouter();

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
    const json = await res.json();
    if (res.ok) {
      router.push('/admin');
    } else {
      setErr(json.error || 'Login gagal');
    }
  }

  return (
    <div style={{ maxWidth: 420 }}>
      <h2>Admin Login</h2>
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 8 }}>
          <label className={styles.small}>Username</label>
          <input className={styles.input} value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label className={styles.small}>Password</label>
          <input type="password" className={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`${styles.btn} ${styles.btnPrimary}`} type="submit">Login</button>
        </div>
      </form>
      {err && <div style={{ marginTop: 12, color: '#b91c1c' }}>{err}</div>}
    </div>
  );
}
