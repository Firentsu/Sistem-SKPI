// ============================================================================
// ICP SOURCE TYPE REGISTRY
// ----------------------------------------------------------------------------
// Single source of truth untuk seluruh source_type transaksi ICP
// Anti typo + centralized registry
// ============================================================================

const ICP_SOURCE = Object.freeze({
  MANUAL: "manual",
  PENGAJUAN: "pengajuan",
  TRANSFER: "transfer",
  KEGIATAN: "kegiatan",
  DOSEN_KELAS: "dosen_kelas",
  DOSEN_PARTISIPASI: "dosen_partisipasi",
  ADMIN_KEPANITIAAN: "admin_kepanitiaan",
  ADMIN_MANUAL: "admin_manual",
  SUPER_ADMIN: "super_admin"
})

const VALID_SOURCE_TYPES = Object.values(ICP_SOURCE)

module.exports = {
  ICP_SOURCE,
  VALID_SOURCE_TYPES
} 