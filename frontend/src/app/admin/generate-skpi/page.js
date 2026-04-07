"use client";

import { useState } from 'react';
import styles from '../admin.module.css';

export default function GenerateSkpiPage(){
  const [nim, setNim] = useState('');
  const [msg, setMsg] = useState('');

  const onGenerate = async (e) => {
    e.preventDefault();
    setMsg('Preview tidak tersedia (UI). Jika ingin, integrasikan API generate.');
  };

  return (
    <div>
      <h2>Generate & Penerbitan SKPI</h2>
      <form onSubmit={onGenerate} style={{ display:'flex', gap:8, alignItems:'center', marginBottom:12 }}>
        <input className={styles.input} placeholder="Masukkan NIM mahasiswa" value={nim} onChange={e=>setNim(e.target.value)} />
        <button className={`${styles.btn} ${styles.btnPrimary}`} type="submit">Generate</button>
      </form>
      {msg && <div className={styles.small}>{msg}</div>}
      <div className={styles.previewBox} style={{ marginTop:12 }}>Preview akan tampil di sini (UI only)</div>
    </div>
  )
}
