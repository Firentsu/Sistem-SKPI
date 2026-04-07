"use client";

import { useState } from 'react';
import styles from '../admin.module.css';

export default function TemplateSkpiPage(){
  const [sections, setSections] = useState([
    { id:1, key:'identitas', titleID:'Identitas Pemegang SKPI', titleEN:'Holder Identity', enabled:true },
    { id:2, key:'institusi', titleID:'Informasi Institusi', titleEN:'Institution Info', enabled:true }
  ]);

  return (
    <div>
      <h2>Template SKPI</h2>
      <div style={{ marginBottom:12 }}>
        <button className={`${styles.btn} ${styles.btnPrimary}`}>Tambah Section</button>
      </div>

      <div className={styles.card}>
        {sections.map(s=> (
          <div key={s.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid #eef2ff'}}>
            <div>
              <div style={{ fontWeight:600 }}>{s.titleID} / {s.titleEN}</div>
              <div className={styles.small}>Key: {s.key}</div>
            </div>
            <div className={styles.actions}><button className={styles.btn}>{s.enabled? 'Nonaktifkan':'Aktifkan'}</button><button className={styles.btn}>Edit</button></div>
          </div>
        ))}
      </div>
    </div>
  )
}
