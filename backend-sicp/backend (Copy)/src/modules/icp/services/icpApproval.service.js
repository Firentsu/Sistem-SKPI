const db = require("../../../shared/config/db")
const model = require("../models/icpApproval.model")
const { hasRole } = require("../../../shared/policies/adminAccess.policy")
const finalValidator = require("../../../shared/policies/finalValidator.policy")
const { createLedger } = require("../../../core/ledger.engine")
const { ICP_SOURCE } = require("../../../shared/constants/icpSourceType")

// ============================================================================
// icpApproval.service.js — FLOW TIER 1 / TIER 2 (revisi)
// ----------------------------------------------------------------------------
// TIER 1 (mahasiswa-originated, target = dosen / admin biasa):
//   - status 'pending' + target_admin_final_id NULL.
//   - Handler approve → WAJIB pilih target_admin_final_id (Super Admin /
//     Admin Akses-Super). Status → 'approved' (Tier 2, menunggu validator).
//   - Handler reject → status 'rejected'.
//
// FINAL (oleh validator yang ditunjuk / Super Admin):
//   - status 'approved' (Tier 2 atau staff-originated) → finalisasi + ledger.
//   - status 'pending' + target_admin_final_id != NULL (mahasiswa LANGSUNG ke
//     SA / Admin AS) → finalisasi + ledger (1 langkah, 1 inbox).
//
// Catatan: validasi final juga tersedia via PUT /api/icp/validation/:id.
// Kedua endpoint aman terhadap double-ledger karena uniq_transaction di DB.
// ============================================================================

const LIMIT_DOSEN = 3
const LIMIT_ADMIN = 3

// Item siap difinalisasi?
const isFinalizable = (p) => {
  if (p.status === "approved") return true
  if (
    p.status === "pending" &&
    (p.target_admin_final_id != null || p.target_role === "super_admin")
  ) {
    return true
  }
  return false
}

// ============================================================================
// Helper finalisasi + ledger
// ============================================================================
const finalizeAndLedger = async ({ pengajuan, user, conn, action }) => {
  const [upd] = await conn.query(
    `
    UPDATE icp_pengajuan
    SET status = 'approved_final',
        validated_by = ?,
        approved_by = COALESCE(approved_by, ?),
        approved_at = COALESCE(approved_at, NOW()),
        final_validated_at = NOW()
    WHERE id = ?
      AND status IN ('pending','approved')
    `,
    [user.id, user.id, pengajuan.id]
  )

  if (!upd.affectedRows) {
    throw new Error("Final gagal — sudah divalidasi / status tidak valid")
  }

  await createLedger({
    payload: {
      mahasiswa_id:    pengajuan.mahasiswa_id,
      source_type:     ICP_SOURCE.PENGAJUAN,
      source_id:       pengajuan.id,
      deskripsi:       pengajuan.deskripsi,
      point:           pengajuan.point,
      tipe:            "masuk",
      semester_id:     pengajuan.semester_id,
      kategori_id:     pengajuan.kategori_id,
      nama_icp_id:     pengajuan.nama_icp_id || null,
      unit_id:         pengajuan.unit_id || null,
      created_by:      user.id,
      idempotency_key: `APPROVAL-FINAL-${pengajuan.id}`,
      conn
    },
    actor: user,
    audit_action: action,
    audit_detail: {
      pengajuan_id: pengajuan.id,
      mahasiswa_id: pengajuan.mahasiswa_id,
      point:        pengajuan.point
    }
  })
}

// ============================================================================
const approvePengajuan = async (id, user, body = {}) => {
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    const [rows] = await conn.query(
      "SELECT * FROM icp_pengajuan WHERE id=? FOR UPDATE",
      [id]
    )
    if (!rows.length) throw new Error("Pengajuan tidak ditemukan")

    const p = rows[0]

    // ========================================================================
    // TIER 1 — mahasiswa-originated menunggu keputusan handler (dosen/admin biasa)
    // status pending + belum ada validator final + user = handler tujuan.
    // ========================================================================
    if (
      p.status === "pending" &&
      p.target_admin_final_id == null &&
      (p.target_role === "dosen" || p.target_role === "admin") &&
      hasRole(user, p.target_role) &&
      Number(p.target_user_id) === Number(user.id)
    ) {
      const target_admin_final_id = body.target_admin_final_id

      // WAJIB pilih validator final.
      if (target_admin_final_id == null) {
        throw new Error(
          "target_admin_final_id wajib — pilih Super Admin / Admin Akses-Super sebagai validator final"
        )
      }

      // Validator final yang dipilih harus sah (admin AS 'validasi_final' / SA aktif).
      await finalValidator.assertValidFinalTarget(target_admin_final_id, conn)

      const limit = p.target_role === "dosen" ? LIMIT_DOSEN : LIMIT_ADMIN

      const ok = await model.approveWithLimit(
        id,
        { id: user.id, role: p.target_role },
        conn,
        limit,
        target_admin_final_id
      )

      if (!ok) throw new Error("Limit harian tercapai atau bukan target")

      await conn.commit()
      return { id, status: "approved", target_admin_final_id }
    }

    // ========================================================================
    // FINAL — finalisasi oleh validator yang ditunjuk / Super Admin.
    //   (status 'approved' Tier 2 / staff, ATAU 'pending' direct ke SA/Admin AS)
    // ========================================================================
    if (isFinalizable(p) && finalValidator.canValidateFinal(p, user)) {
      await finalizeAndLedger({
        pengajuan: p,
        user, conn,
        action: "FINAL_APPROVAL_PENGAJUAN"
      })

      await conn.commit()
      return { id, status: "approved_final" }
    }

    throw new Error("Tidak berhak atau status pengajuan tidak valid")

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

// ============================================================================
// REJECT — Tier 1 (handler tujuan menolak pengajuan mahasiswa yang pending),
// atau validator final menolak item yang ditujukan kepadanya.
// ============================================================================
const rejectPengajuan = async (id, user, alasan = null) => {
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    const [rows] = await conn.query(
      "SELECT * FROM icp_pengajuan WHERE id=? FOR UPDATE",
      [id]
    )
    if (!rows.length) throw new Error("Pengajuan tidak ditemukan")

    const p = rows[0]

    const isTier1Handler =
      p.status === "pending" &&
      p.target_admin_final_id == null &&
      (p.target_role === "dosen" || p.target_role === "admin") &&
      hasRole(user, p.target_role) &&
      Number(p.target_user_id) === Number(user.id)

    const isFinalValidator =
      isFinalizable(p) && finalValidator.canValidateFinal(p, user)

    if (!isTier1Handler && !isFinalValidator) {
      throw new Error("Tidak berhak menolak pengajuan ini")
    }

    const [upd] = await conn.query(
      `
      UPDATE icp_pengajuan
      SET status = 'rejected',
          rejected_by = ?,
          rejected_at = NOW(),
          alasan_tolak = COALESCE(?, alasan_tolak)
      WHERE id = ?
        AND status IN ('pending','approved')
      `,
      [user.id, alasan, id]
    )

    if (!upd.affectedRows) throw new Error("Reject gagal — sudah diproses")

    await conn.commit()
    return { id, status: "rejected" }

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

// ============================================================================
// INBOX TIER 1 — dosen / admin biasa: pengajuan mahasiswa yang menunggu
// keputusan approve/reject mereka (pending + belum ada validator final).
// ============================================================================
const getInboxTier1 = async (user) => {
  const [rows] = await db.query(
    `
    SELECT
      p.id, p.mahasiswa_id, p.point, p.deskripsi, p.status,
      p.unit_id, p.kategori_id, p.nama_icp_id, p.created_at,
      m.nama AS mahasiswa_nama, m.nim,
      k.nama_kategori, ni.nama AS nama_icp,
      un.nama_unit AS unit
    FROM icp_pengajuan p
    LEFT JOIN mahasiswa m ON m.id = p.mahasiswa_id
    LEFT JOIN kategori_icp k ON k.id = p.kategori_id
    LEFT JOIN nama_icp ni ON ni.id = p.nama_icp_id
    LEFT JOIN unit_organisasi un ON un.id = p.unit_id
    WHERE p.target_user_id = ?
      AND p.status = 'pending'
      AND p.target_admin_final_id IS NULL
    ORDER BY p.created_at ASC
    `,
    [user.id]
  )
  return rows
}

module.exports = {
  approvePengajuan,
  rejectPengajuan,
  getInboxTier1
}
