// lib/masterData.js
// Data master yang dikelola admin, terhubung ke backend

import { apiFetch, isMockMode } from "./api";

// Data default (fallback jika backend tidak tersedia)
const DEFAULT_MASTER_DATA = {
  jenis_aktivitas: [
    "Prestasi dan Kegiatan",
    "Peningkatan Keterampilan Profesional",
    "Pengalaman Berorganisasi dan Kepemimpinan",
    "Pengembangan Intelektual",
    "Praktik Kerja",
    "Pembinaan Spiritual",
    "Pembangunan Karakter dan Kepribadian",
    "Kursus - kursus",
    "Skripsi",
  ],
  kategori_aktivitas: [
    "Lomba/Kompetisi",
    "Seminar",
    "Workshop",
    "Pelatihan",
    "Organisasi",
    "Kepanitian",
    "Magang",
    "Penelitian",
    "Pengabdian Masyarakat",
    "Publikasi Ilmiah",
    "Kegiatan Kampus",
    "Sertifikasi Profesional",
  ],
  kelompok_aktivitas: [
    "Akademik",
    "Non-Akademik",
    "Organisasi",
    "Kepemimpinan",
    "Penelitian",
    "Profesional",
  ],
  level_kegiatan: ["Internal", "Nasional", "Internasional"],
  tingkat_prestasi: [
    "Peserta",
    "Juara 1",
    "Juara 2",
    "Juara 3",
    "Harapan",
    "Finalis",
    "Partisipasi",
  ],
};

let masterDataCache = null;
let fetchPromise = null;

// Fungsi untuk mengambil data dari API dan mengisi cache
async function fetchMasterData() {
  if (masterDataCache) return masterDataCache;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const endpoints = [
        { path: "/api/master-data/jenis-aktivitas", field: "jenis_aktivitas", mapper: (data) => data.map(item => item.nama_indo || item.nama || item) },
        { path: "/api/master-data/kategori-aktivitas", field: "kategori_aktivitas", mapper: (data) => data.map(item => item.nama_indo || item.nama || item) },
        { path: "/api/master-data/kelompok-aktivitas", field: "kelompok_aktivitas", mapper: (data) => data.map(item => item.nama_indo || item.nama || item) },
        { path: "/api/master-data/level-kegiatan", field: "level_kegiatan", mapper: (data) => data.map(item => item.nama_level || item.nama || item) },
        { path: "/api/master-data/tingkat-prestasi", field: "tingkat_prestasi", mapper: (data) => data.map(item => item.nama_indo || item.nama || item) },
      ];

      const results = await Promise.all(
        endpoints.map(async ({ path, field, mapper }) => {
          try {
            const res = await apiFetch(path);
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data)) {
                return { field, value: mapper(data) };
              }
            }
            return { field, value: DEFAULT_MASTER_DATA[field] };
          } catch {
            return { field, value: DEFAULT_MASTER_DATA[field] };
          }
        })
      );

      const cache = {};
      results.forEach(r => { cache[r.field] = r.value; });
      masterDataCache = cache;
      return masterDataCache;
    } catch (err) {
      console.error("Gagal memuat master data:", err);
      masterDataCache = DEFAULT_MASTER_DATA;
      return masterDataCache;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

// Fungsi untuk inisialisasi (panggil di awal aplikasi)
export async function initMasterData() {
  await fetchMasterData();
}

// Fungsi untuk refresh cache (misal setelah admin update)
export async function refreshMasterData() {
  masterDataCache = null;
  return fetchMasterData();
}

// Getter synchronous (mengembalikan cache jika sudah ada, atau default)
export function getJenisAktivitas() {
  return masterDataCache?.jenis_aktivitas || DEFAULT_MASTER_DATA.jenis_aktivitas;
}
export function getKategoriAktivitas() {
  return masterDataCache?.kategori_aktivitas || DEFAULT_MASTER_DATA.kategori_aktivitas;
}
export function getKelompokAktivitas() {
  return masterDataCache?.kelompok_aktivitas || DEFAULT_MASTER_DATA.kelompok_aktivitas;
}
export function getLevelKegiatan() {
  return masterDataCache?.level_kegiatan || DEFAULT_MASTER_DATA.level_kegiatan;
}
export function getTingkatPrestasi() {
  return masterDataCache?.tingkat_prestasi || DEFAULT_MASTER_DATA.tingkat_prestasi;
}

// Untuk keperluan admin yang mungkin perlu menyimpan data
export const setJenisAktivitas = (data) => { /* tidak digunakan langsung, karena admin menggunakan API */ };
export const setKategoriAktivitas = (data) => {};
export const setKelompokAktivitas = (data) => {};
export const setLevelKegiatan = (data) => {};
export const setTingkatPrestasi = (data) => {};