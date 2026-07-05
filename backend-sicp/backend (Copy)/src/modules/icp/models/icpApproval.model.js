// ============================================================================
// icpApproval.model.js  (FIXED)
// ----------------------------------------------------------------------------
// 🔥 FIX #2B — approveFinal kini melindungi terhadap re-finalisasi:
//   - Sebelumnya WHERE (status='approved' OR target_role='super_admin') →
//     pengajuan staff yang sudah 'rejected' bisa di-flip ke 'approved_final'.
//   - Sekarang ditambahkan AND status NOT IN ('approved_final','rejected').
// ============================================================================

const approveWithLimit = async (id, user, conn, limit, target_admin_final_id) => {

  const [result] = await conn.query(`
    UPDATE icp_pengajuan p
    SET
      p.status = 'approved',
      p.approved_by = ?,
      p.pemberi_icp_id = ?,
      p.approved_at = NOW(),
      p.target_admin_final_id = ?
    WHERE
      p.id = ?
      AND p.status = 'pending'
      AND p.target_role = ?
      AND p.target_user_id = ?
      AND p.target_admin_final_id IS NULL
      -- HARD LIMIT (ANTI TEMBUS) — count yang sudah disetujui pemberi ini hari ini
      AND (
        SELECT COUNT(*)
        FROM icp_pengajuan x
        WHERE x.mahasiswa_id = p.mahasiswa_id
          AND x.pemberi_icp_id = ?
          AND DATE(x.approved_at) = CURDATE()
          AND x.status IN ('approved','approved_final')
      ) < ?
  `, [
    user.id, user.id, target_admin_final_id,
    id, user.role, user.id,
    user.id, limit
  ])

  return result.affectedRows > 0
}

// ============================================================================
// 🔥 FIX #2B — approveFinal: re-finalize-proof
// ============================================================================
const approveFinal = async (id, user, conn) => {

  const [result] = await conn.query(`
    UPDATE icp_pengajuan
    SET
      status = 'approved_final',
      validated_by = ?,
      final_validated_at = NOW()
    WHERE id = ?
      AND status NOT IN ('approved_final','rejected')
      AND (
        status = 'approved'
        OR target_role = 'super_admin'
      )
  `, [user.id, id])

  return result.affectedRows > 0
}

const reject = async (id, user, conn) => {
  const [result] = await conn.query(`
    UPDATE icp_pengajuan
    SET
      status = 'rejected',
      rejected_by = ?,
      rejected_at = NOW()
    WHERE id = ?
      AND status IN ('pending','approved')
  `, [user.id, id])

  return result.affectedRows > 0
}

module.exports = {
  approveWithLimit,
  approveFinal,
  reject
}
