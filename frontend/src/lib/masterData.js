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
    // tambahan
    "Pembinaan Spiritual",
    "Pembangunan Karakter dan Kepribadian",
    "Kursus-kursus",
    "Skripsi",
  ],
  kategori_aktivitas: [
    "Lomba/Kompetisi",
    "Olimpiade",
    "Penghargaan / Award",
    "Workshop / Pelatihan",
    "Sertifikasi Profesional",
    "Kursus",
    "Pengurus Organisasi",
    "Kepanitiaan Kegiatan",
    "Komunitas / UKM",
    "Relawan / Sukarelawan",
    "Mentoring / Pembimbing",
    "Asisten Penelitian / Riset",
    "Publikasi Ilmiah",
    "Konferensi Ilmiah",
    "Pertukaran Pelajar / Exchange",
    "Seminar / Webinar",
    "Kuliah Umum / Studium Generale",
    "Magang / PKL",
    "Kewirausahaan / Startup",
    // tambahan
    "Ret-ret / Pembinaan",
    "Matkul Penciri",
    "Kursus Online",
    "Kursus Tatap Muka",
    "Skripsi / Tugas Akhir",
  ],
  kelompok_aktivitas: [
    "Akademik",
    "Non-Akademik",
    "Organisasi",
    "Kepemimpinan",
    "Penelitian",
    "Profesional",
    // tambahan
    "Spiritual",
    "Karakter",
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
  // ═══ TAMBAHAN: Periode Semester ═══
  periode_semester: [
  "Semester Ganjil 2018/2019", "Semester Genap 2018/2019", "Liburan Semester Genap 2018/2019",
  "Semester Ganjil 2019/2020", "Semester Genap 2019/2020", "Liburan Semester Genap 2019/2020",
  "Semester Ganjil 2020/2021", "Semester Genap 2020/2021", "Liburan Semester Genap 2020/2021",
  "Semester Ganjil 2021/2022", "Semester Genap 2021/2022", "Liburan Semester Genap 2021/2022",
  "Semester Ganjil 2022/2023", "Semester Genap 2022/2023", "Liburan Semester Genap 2022/2023",
  "Semester Ganjil 2023/2024", "Semester Genap 2023/2024", "Liburan Semester Genap 2023/2024",
  "Semester Ganjil 2024/2025", "Semester Genap 2024/2025", "Liburan Semester Genap 2024/2025",
  "Semester Ganjil 2025/2026", "Semester Genap 2025/2026", "Liburan Semester Genap 2025/2026",
  "Semester Ganjil 2026/2027", "Semester Genap 2026/2027", "Liburan Semester Genap 2026/2027",
  "Semester Ganjil 2027/2028", "Semester Genap 2027/2028", "Liburan Semester Genap 2027/2028",
  "Semester Ganjil 2028/2029", "Semester Genap 2028/2029", "Liburan Semester Genap 2028/2029",
  "Semester Ganjil 2029/2030", "Semester Genap 2029/2030", "Liburan Semester Genap 2029/2030",
  ],

  /* Matkul Penciri */
  mata_kuliah_penciri: [
    "Pendidikan Agama Katolik",
    "Pendidikan Kewarganegaraan",
    "Bahasa Indonesia",
    "Pancasila",
    "Etika Profesi",
    "Kepemimpinan",
    "Kewirausahaan",
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
        // ═══ TAMBAHAN ═══
        { path: "/api/master-data/periode-semester", field: "periode_semester", mapper: (data) => data.map(item => item.nama_periode || item.nama || item) },
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

// Inisialisasi (panggil di awal aplikasi)
export async function initMasterData() {
  await fetchMasterData();
}

// Refresh cache (panggil setelah admin update)
export async function refreshMasterData() {
  masterDataCache = null;
  return fetchMasterData();
}

// Getters – selalu mengembalikan data terbaru dari cache atau default
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
// ═══ TAMBAHAN ═══
export function getPeriodeSemester() {
  return masterDataCache?.periode_semester || DEFAULT_MASTER_DATA.periode_semester;
}
// Getters untuk Matkul Penciri
export function getMataKuliahPenciri() {
  return masterDataCache?.mata_kuliah_penciri || DEFAULT_MASTER_DATA.mata_kuliah_penciri;
}


// Placeholder setter (tidak digunakan langsung oleh frontend)
export const setJenisAktivitas = (data) => {};
export const setKategoriAktivitas = (data) => {};
export const setKelompokAktivitas = (data) => {};
export const setLevelKegiatan = (data) => {};
export const setTingkatPrestasi = (data) => {};
export const setMataKuliahPenciri = (data) => {}; // placeholder