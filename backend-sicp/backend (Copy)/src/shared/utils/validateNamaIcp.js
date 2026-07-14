// ============================================================================
// utils/validateNamaIcp.js  (REVISI v2)
// ----------------------------------------------------------------------------
// SKEMA BARU:
//   - nama_icp.unit_id (langsung) → milik unit
//   - unit_kategori(unit_id, kategori_id) → akses kategori per unit
//   - user_unit_member(user_id, unit_id) → user member unit
//
// Validation chain:
//   1. nama_icp ada & status='aktif'
//   2. nama_icp.unit_id = unit_id yang dipilih
//   3. unit_kategori → kategori_id valid utk unit ini
//   4. (opsional) target_user_id adalah member unit ini
// ============================================================================

const db = require("../config/db")

const validateNamaIcp = async ({
  unit_id,
  kategori_id,
  nama_icp_id,
  target_user_id = null
}, conn = null) => {

  const runner = conn || db

  // 1. nama_icp exist & aktif
  const [namaRows] = await runner.query(
    `SELECT id, nama, unit_id, status
     FROM nama_icp
     WHERE id = ?
     LIMIT 1`,
    [nama_icp_id]
  )
  if (!namaRows.length) throw new Error("Nama ICP tidak ditemukan")
  const namaIcp = namaRows[0]
  if (namaIcp.status !== "aktif") throw new Error("Nama ICP tidak aktif")

  // 2. nama_icp.unit_id == unit_id yg dipilih
  if (namaIcp.unit_id !== Number(unit_id)) {
    throw new Error(
      `Nama ICP "${namaIcp.nama}" bukan milik unit ini`
    )
  }

  // 3. kategori valid utk unit ini
  const [katAcc] = await runner.query(
    `SELECT 1 FROM unit_kategori
     WHERE unit_id = ? AND kategori_id = ? LIMIT 1`,
    [unit_id, kategori_id]
  )
  if (!katAcc.length) {
    throw new Error("Kategori ini tidak tersedia untuk unit yang dipilih")
  }

  // 4. target_user_id (opsional) — harus member unit
  if (target_user_id) {
    const [uum] = await runner.query(
      `SELECT 1 FROM user_unit_member
       WHERE user_id = ? AND unit_id = ? LIMIT 1`,
      [target_user_id, unit_id]
    )
    if (!uum.length) {
      throw new Error(
        "Target user (pemberi ICP) bukan anggota unit yang dipilih"
      )
    }
  }

  return true
}

module.exports = validateNamaIcp
