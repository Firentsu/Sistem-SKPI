// lib/masterData.js
// Data master yang dikelola admin (nanti bisa dari API)

export const MASTER_DATA = {
  // Jenis Aktivitas berdasarkan SKPI (9 jenis)
  jenis_aktivitas: [
    "Prestasi dan Kegiatan",
    "Peningkatan Keterampilan Profesional",
    "Pengalaman Berorganisasi dan Kepemimpinan",
    "Pengembangan Intelektual",
    "Praktik Kerja",
    "Pembinaan Spiritual",
    "Pembangunan Karakter dan Kepribadian",
    "Kursus - kursus",
    "Skripsi"
  ],
  
  // Kategori Aktivitas (12 kategori)
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
    "Sertifikasi Profesional"
  ],
  
  // Kelompok Aktivitas (6 kelompok)
  kelompok_aktivitas: [
    "Akademik",
    "Non-Akademik",
    "Organisasi",
    "Kepemimpinan",
    "Penelitian",
    "Profesional"
  ],
  
  // Level Kegiatan (3 level)
  level_kegiatan: [
    "Internal",
    "Nasional",
    "Internasional"
  ],
  
  // Tingkat Prestasi (7 tingkat)
  tingkat_prestasi: [
    "Peserta",
    "Juara 1",
    "Juara 2",
    "Juara 3",
    "Harapan",
    "Finalis",
    "Partisipasi"
  ],
};

export const getJenisAktivitas = () => MASTER_DATA.jenis_aktivitas;
export const getKategoriAktivitas = () => MASTER_DATA.kategori_aktivitas;
export const getKelompokAktivitas = () => MASTER_DATA.kelompok_aktivitas;
export const getLevelKegiatan = () => MASTER_DATA.level_kegiatan;
export const getTingkatPrestasi = () => MASTER_DATA.tingkat_prestasi;