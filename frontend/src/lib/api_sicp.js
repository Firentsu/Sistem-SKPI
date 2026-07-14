/**
 * api_sicp.js — Klien frontend untuk sinkronisasi data SICP → SKPI.
 *
 * Frontend TIDAK memanggil SICP langsung. Ia memanggil backend SKPI
 * (`/api/sicp-sync/...`) yang bertindak sebagai proxy: backend yang menyimpan
 * URL + kredensial SICP (backend/.env), login otomatis, mengambil data, lalu
 * meng-upsert ke database SKPI. Dengan begitu token SICP tidak pernah bocor ke
 * browser dan data bisa langsung tersimpan ke DB.
 */
import { apiFetch } from "./api";

async function call(path, method = "POST") {
  const res  = await apiFetch(path, { method });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

/** Cek koneksi + autentikasi ke SICP (tidak mengubah data apa pun). */
export const testSicpConnection = () => call("/api/sicp-sync/test", "GET");

/** Tarik & simpan data mahasiswa dari SICP (buat/update akun login). */
export const syncMahasiswa = () => call("/api/sicp-sync/mahasiswa", "POST");

/** Tarik & simpan total poin ICP dari SICP (dicocokkan berdasarkan NIM). */
export const syncIcp = () => call("/api/sicp-sync/icp", "POST");

/** Sinkron keduanya sekaligus: mahasiswa lalu ICP (per kategori). */
export const syncAll = () => call("/api/sicp-sync/both", "POST");

/** Bersihkan mahasiswa duplikat (NIM sama) yang kosong. Tidak menghubungi SICP. */
export const cleanupDuplicates = () => call("/api/sicp-sync/cleanup-duplicates", "POST");
