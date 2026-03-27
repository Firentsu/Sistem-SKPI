"use client";

import { useEffect, useState } from 'react';
import styles from '../admin.module.css';

export default function MahasiswaPage() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [prodi, setProdi] = useState('Semua');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch(`/api/mahasiswa?q=${encodeURIComponent(q)}&prodi=${encodeURIComponent(prodi)}&page=${page}`)
      .then(r => r.json())
      .then(d => {
        setRows(d.rows || []);
        setTotal(d.total || 0);
      }).catch(()=>{});
  }, [q, prodi, page]);

  return (
    <div>
      <h2>Manajemen Mahasiswa</h2>

      <div className={styles.searchRow}>
        <input className={styles.input} placeholder="Cari nama atau NIM" value={q} onChange={(e)=>{setQ(e.target.value); setPage(1)}} />
        <select className={styles.input} value={prodi} onChange={(e)=>{setProdi(e.target.value); setPage(1)}}>
          <option>Semua</option>
          <option>Teknik Informatika</option>
          <option>Manajemen</option>
          <option>Akuntansi</option>
        </select>
      </div>

      <table className={styles.table}>
        <thead>
          <tr><th>Nama</th><th>NIM</th><th>Prodi</th><th>Angkatan</th><th>Email</th><th>Status SKPI</th><th>Aksi</th></tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx}>
              <td>{r.nama}</td>
              <td>{r.nim}</td>
              <td>{r.id_prodi}</td>
              <td>{r.angkatan}</td>
              <td>{r.email}</td>
              <td>{r.status_skpi}</td>
              <td><div className={styles.actions}><button className={styles.btn}>Edit</button><button className={styles.btn}>Reset PW</button></div></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.pagination}>
        <button className={styles.btn} onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>Prev</button>
        <div className={styles.small}>Halaman {page} • Total {total}</div>
        <button className={styles.btn} onClick={()=>setPage(p=>p+1)}>Next</button>
      </div>
    </div>
  );
}
