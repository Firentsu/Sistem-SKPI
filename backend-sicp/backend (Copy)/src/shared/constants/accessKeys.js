// ============================================================================
// accessKeys.js
// Daftar fitur "AKSES SUPER" granular yang bisa di-on/off Super Admin per Admin.
// Sumber kebenaran tunggal — dipakai middleware, policy, dan roleManagement.
// ============================================================================

const ACCESS_KEYS = [

  // ==========================================================================
  // AKADEMIK
  // ==========================================================================
  "input_mata_kuliah",     // input / kelola mata kuliah (per semester)

  // ==========================================================================
  // KEGIATAN
  // ==========================================================================
  "kelola_kegiatan",       // kelola kegiatan & panitia

  // ==========================================================================
  // ORGANISASI
  // ==========================================================================
  "input_unit_organisasi", // tambah & kelola unit organisasi + nama ICP unit
  "kelola_unit_kategori",  // kelola akses kategori ICP ke unit

  // ==========================================================================
  // ICP MASTER
  // ==========================================================================
  "kelola_nama_icp",       // kelola master nama ICP

  // ==========================================================================
  // VALIDASI
  // ==========================================================================
  "validasi_final",        // validasi final pengajuan/potongan

  // ==========================================================================
  // LIMIT SYSTEM
  // ==========================================================================
  "kelola_limit",          // set limit admin / dosen

  // ==========================================================================
  // POTONGAN
  // ==========================================================================
  "validasi_potongan",     // validasi/approve potongan ICP (inbox potongan)
  "potongan_super"         // potong ICP langsung tanpa batas (bypass limit)
]

// ============================================================================
// VALIDATOR
// ============================================================================
const isValidAccessKey = (key) => ACCESS_KEYS.includes(key)

// ============================================================================
module.exports = {
  ACCESS_KEYS,
  isValidAccessKey
}