"use client";

import { useState } from 'react';
import styles from '../admin.module.css';

export default function AktivitasPage(){
  const [items, setItems] = useState([
    { id:1, jenis:'Prestasi dan Kegiatan', kategori:'Lomba', kelompok:'Akademik' },
    { id:2, jenis:'Pengalaman Berorganisasi', kategori:'Organisasi', kelompok:'Organisasi' }
  ]);

  return (
    <div>
      <h2>Manajemen Aktivitas</h2>
      <div style={{ marginBottom:12 }}>
        <button className={`${styles.btn} ${styles.btnPrimary}`}>Tambah Aktivitas</button>
      </div>

      <div className={styles.card}>
        {items.map(it=> (
          <div key={it.id} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #eef2ff' }}>
            <div>
              <div style={{ fontWeight:600 }}>{it.jenis}</div>
              <div className={styles.small}>{it.kategori} • {it.kelompok}</div>
            </div>
            <div className={styles.actions}><button className={styles.btn}>Edit</button><button className={styles.btn}>Hapus</button></div>
          </div>
        ))}
      </div>
    </div>
  )
}
