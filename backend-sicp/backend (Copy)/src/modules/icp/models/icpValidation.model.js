const BaseModel = require("../../../shared/models/base.model")

// ===============================
// 🔒 LOCK DATA
const findByIdForUpdate = async (id, conn) => {
  const [rows] = await BaseModel.query(
    `SELECT * FROM icp_pengajuan 
     WHERE id = ? 
     FOR UPDATE`,
    [id],
    conn
  )
  return rows[0] || null
}

// ===============================
// 🔥 SAFE UPDATE FINAL (ANTI DOUBLE VALIDATION)
const updateToFinalWithActorSafe = async ({ id, validated_by }, conn) => {
  const [result] = await BaseModel.query(
    `UPDATE icp_pengajuan 
     SET status = 'approved_final',
         validated_by = ?
     WHERE id = ?
     AND status = 'approved'`,
    [validated_by, id],
    conn
  )

  return result.affectedRows > 0
}

module.exports = {
  findByIdForUpdate,
  updateToFinalWithActorSafe
} 