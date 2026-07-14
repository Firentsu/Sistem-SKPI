// lib/masterData.js
// Data master dengan merge antara API dan default (fallback)

import { apiFetch } from "./api";

// ─── HANYA SATU DEKLARASI ──────────────────────────────
export const DEFAULT_MASTER_DATA = {
  jenis_aktivitas: [
    "Prestasi dan Kegiatan",
    "Peningkatan Keterampilan Profesional",
    "Pengalaman Berorganisasi dan Kepemimpinan",
    "Pengembangan Intelektual",
    "Praktik Kerja",
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
  periode_semester: [
    "Semester Ganjil 2018/2019",
    "Semester Genap 2018/2019",
    "Liburan Semester Genap 2018/2019",
    "Semester Ganjil 2019/2020",
    "Semester Genap 2019/2020",
    "Liburan Semester Genap 2019/2020",
    "Semester Ganjil 2020/2021",
    "Semester Genap 2020/2021",
    "Liburan Semester Genap 2020/2021",
    "Semester Ganjil 2021/2022",
    "Semester Genap 2021/2022",
    "Liburan Semester Genap 2021/2022",
    "Semester Ganjil 2022/2023",
    "Semester Genap 2022/2023",
    "Liburan Semester Genap 2022/2023",
    "Semester Ganjil 2023/2024",
    "Semester Genap 2023/2024",
    "Liburan Semester Genap 2023/2024",
    "Semester Ganjil 2024/2025",
    "Semester Genap 2024/2025",
    "Liburan Semester Genap 2024/2025",
    "Semester Ganjil 2025/2026",
    "Semester Genap 2025/2026",
    "Liburan Semester Genap 2025/2026",
    "Semester Ganjil 2026/2027",
    "Semester Genap 2026/2027",
    "Liburan Semester Genap 2026/2027",
    "Semester Ganjil 2027/2028",
    "Semester Genap 2027/2028",
    "Liburan Semester Genap 2027/2028",
    "Semester Ganjil 2028/2029",
    "Semester Genap 2028/2029",
    "Liburan Semester Genap 2028/2029",
    "Semester Ganjil 2029/2030",
    "Semester Genap 2029/2030",
    "Liburan Semester Genap 2029/2030",
  ],
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

// ─── CACHE ──────────────────────────────────────────────
let masterDataCache = null;
let fetchPromise = null;

function mergeArrays(apiArr, defaultArr, key) {
  if (!apiArr || !Array.isArray(apiArr)) return [...defaultArr];
  const apiValues = apiArr
    .map((item) => (typeof item === "string" ? item : item?.[key] ?? item?.nama ?? item))
    .filter(Boolean);
  const merged = [...defaultArr];
  for (const val of apiValues) {
    if (!merged.includes(val)) merged.push(val);
  }
  return merged;
}

async function fetchMasterData() {
  if (masterDataCache) return masterDataCache;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const res = await apiFetch("/api/mahasiswa/master-data");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      masterDataCache = {
        jenis_aktivitas: mergeArrays(
          data.jenisAktivitas,
          DEFAULT_MASTER_DATA.jenis_aktivitas,
          "nama_indo"
        ),
        kategori_aktivitas: mergeArrays(
          data.kategoriAktivitas,
          DEFAULT_MASTER_DATA.kategori_aktivitas,
          "nama_indo"
        ),
        kelompok_aktivitas: mergeArrays(
          data.kelompokAktivitas,
          DEFAULT_MASTER_DATA.kelompok_aktivitas,
          "nama_indo"
        ),
        level_kegiatan: mergeArrays(
          data.levelKegiatan,
          DEFAULT_MASTER_DATA.level_kegiatan,
          "nama_level"
        ),
        periode_semester: mergeArrays(
          data.periodeAkademik,
          DEFAULT_MASTER_DATA.periode_semester,
          "nama_periode"
        ),
        tingkat_prestasi: [...DEFAULT_MASTER_DATA.tingkat_prestasi],
        mata_kuliah_penciri: [...DEFAULT_MASTER_DATA.mata_kuliah_penciri],
      };
      return masterDataCache;
    } catch (err) {
      console.error("Gagal memuat master data:", err);
      masterDataCache = { ...DEFAULT_MASTER_DATA };
      return masterDataCache;
    } finally {
      fetchPromise = null;
    }
  })();
  return fetchPromise;
}

// ─── PUBLIC API ──────────────────────────────────────────
export async function initMasterData() {
  await fetchMasterData();
}

export async function refreshMasterData() {
  masterDataCache = null;
  return fetchMasterData();
}

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
export function getPeriodeSemester() {
  return masterDataCache?.periode_semester || DEFAULT_MASTER_DATA.periode_semester;
}
export function getMataKuliahPenciri() {
  return masterDataCache?.mata_kuliah_penciri || DEFAULT_MASTER_DATA.mata_kuliah_penciri;
}

// ─── PLACEHOLDER SETTER (tidak digunakan) ──────────────
export const setJenisAktivitas = () => {};
export const setKategoriAktivitas = () => {};
export const setKelompokAktivitas = () => {};
export const setLevelKegiatan = () => {};
export const setTingkatPrestasi = () => {};
export const setMataKuliahPenciri = () => {};