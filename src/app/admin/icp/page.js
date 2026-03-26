"use client";

import { useState } from 'react';
import styles from '../admin.module.css';

export default function ICPPage(){
  const [items, setItems] = useState([
    { id:1, name:'Fisik', bobot:10 },
    { id:2, name:'Iman', bobot:8 }
  ]);

  return (
    <div>
      <h2>Manajemen ICP</h2>
      <div style={{ marginBottom:12 }}>
        <button className={`${styles.btn} ${styles.btnPrimary}`}>Tambah ICP</button>
      </div>

      <div className={styles.card}>
        {items.map(it=> (
          <div key={it.id} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #eef2ff'}}>
            <div>{it.name}</div>
            <div>{it.bobot} pts</div>
          </div>
        ))}
      </div>
    </div>
  )
}
