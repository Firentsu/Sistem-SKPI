const db = require("../../../shared/config/db")
const { logAudit } = require("../../audit/services/audit.service")
const { hasRole } = require("../../../shared/policies/adminAccess.policy")
const finalValidator = require("../../../shared/policies/finalValidator.policy")
const validationModel = require("../models/icpValidation.model")
const mahasiswaModel = require("../../akademik/models/mahasiswa.model")
const semesterService = require("../../akademik/services/semester.service")

const { ICP_SOURCE } = require("../../../shared/constants/icpSourceType")
const { createLedger } = require("../../../core/ledger.engine")

// ============================================================================
// icpValidation.service.js — FLOW TIER 1 / TIER 2 (revisi)
// ----------------------------------------------------------------------------
// Validasi FINAL pengajuan ICP oleh validator yang DITUNJUK (Super Admin atau
// Admin Akses-Super pemegang 'validasi_final'). Item yang dapat difinalisasi:
//   (A) status = 'approved'  → sudah lolos Tier 1 (di-approve dosen/admin biasa
//        yang menunjuk validator final), ATAU staff-originated (dosen beri ICP).
//   (B) status = 'pending' + target_admin_final_id != NULL → pengajuan mahasiswa
//        LANGSUNG ke Super Admin / Admin Akses-Super (1 inbox, 1 langkah).
//   (C) status = 'pending' + target_role = 'super_admin' → legacy staff direct.
// Item Tier 1 yang BELUM di-approve (pending + target_admin_final_id NULL +
// target_role != 'super_admin') TIDAK boleh difinalisasi di sini.
// ============================================================================

// Apakah pengajuan dalam keadaan yang boleh difinalisasi?
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

// ===============================
// 🔵 VALIDASI FINAL PENGAJUAN
const validasiPengajuan = async (id, user) => {
  if (!id) throw new Error("ID wajib diisi")

  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    const pengajuan = await validationModel.findByIdForUpdate(id, conn)
    if (!pengajuan) throw new Error("Pengajuan tidak ditemukan")

    // OTORISASI — hanya validator yang DITUNJUK (atau Super Admin) yang boleh.
    if (!finalValidator.canValidateFinal(pengajuan, user)) {
      throw new Error(
        "Anda bukan validator final yang ditunjuk untuk pengajuan ini"
      )
    }

    // GUARD STATE — pastikan memang siap difinalisasi.
    if (!isFinalizable(pengajuan)) {
      if (pengajuan.status === "pending") {
        throw new Error("Pengajuan belum di-approve Tier 1")
      }
      throw new Error("Status pengajuan tidak valid untuk validasi final")
    }

    // GUARD SEMESTER (ATURAN #7) — semester lama kadaluarsa.
    const aktif = await semesterService.getActiveSemester(conn)
    if (Number(pengajuan.semester_id) !== Number(aktif.id)) {
      throw new Error(
        "Pengajuan kadaluarsa — semester sudah berganti, tidak bisa divalidasi lagi"
      )
    }

    // GUARD MAHASISWA aktif.
    const mahasiswa = await mahasiswaModel.getActiveById(
      pengajuan.mahasiswa_id,
      conn
    )
    if (!mahasiswa) throw new Error("Mahasiswa tidak aktif")

    // UPDATE FINAL (anti double-validation).
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
      [user.id, user.id, id]
    )

    if (!upd.affectedRows) throw new Error("Sudah divalidasi sebelumnya")

    // LEDGER MASUK (single source of truth).
    const trx = await createLedger({
      payload: {
        mahasiswa_id: pengajuan.mahasiswa_id,
        source_type: ICP_SOURCE.PENGAJUAN,
        source_id: pengajuan.id,
        deskripsi: pengajuan.deskripsi,
        point: pengajuan.point,
        tipe: "masuk",
        semester_id: pengajuan.semester_id,
        kategori_id: pengajuan.kategori_id,
        nama_icp_id: pengajuan.nama_icp_id || null,
        unit_id: pengajuan.unit_id || null,
        created_by: user.id,
        idempotency_key: `VALIDASI-PENGAJUAN-${pengajuan.id}`,
        conn
      },
      actor: user,
      audit_action: "VALIDASI_PENGAJUAN",
      audit_detail: {
        pengajuan_id: pengajuan.id,
        mahasiswa_id: pengajuan.mahasiswa_id,
        point: pengajuan.point
      }
    })

    await logAudit({
      user_id: user.id,
      role: user.role,
      action: "FINAL_APPROVAL_PENGAJUAN",
      target_table: "icp_pengajuan",
      target_id: id,
      detail: { transaction_id: trx?.id || null },
      conn
    })

    await conn.commit()
    return { id, status: "approved_final" }

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

// ===============================
// 🔴 REJECT FINAL PENGAJUAN — oleh validator yang ditunjuk (atau Super Admin)
const rejectValidasi = async (id, user, alasan) => {
  if (!id) throw new Error("ID wajib diisi")

  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    const pengajuan = await validationModel.findByIdForUpdate(id, conn)
    if (!pengajuan) throw new Error("Pengajuan tidak ditemukan")

    if (!finalValidator.canValidateFinal(pengajuan, user)) {
      throw new Error(
        "Anda bukan validator final yang ditunjuk untuk pengajuan ini"
      )
    }

    if (!isFinalizable(pengajuan)) {
      throw new Error("Status pengajuan tidak valid untuk ditolak")
    }

    const [upd] = await conn.query(
      `
      UPDATE icp_pengajuan
      SET status = 'rejected',
          rejected_by = ?,
          rejected_at = NOW(),
          alasan_tolak = ?
      WHERE id = ?
        AND status IN ('pending','approved')
      `,
      [user.id, alasan || null, id]
    )

    if (!upd.affectedRows) throw new Error("Sudah diproses sebelumnya")

    await logAudit({
      user_id: user.id,
      role: user.role,
      action: "REJECT_FINAL_PENGAJUAN",
      target_table: "icp_pengajuan",
      target_id: id,
      detail: { alasan: alasan || null },
      conn
    })

    await conn.commit()
    return { id, status: "rejected" }

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

// ===============================
// 📊 INBOX VALIDASI FINAL — item yang menunggu keputusan validator ini.
// Super Admin: lihat semua. Admin AS: hanya yang di-routing kepadanya
// (atau approved legacy bertarget NULL = staff-originated).
const getValidasiPengajuan = async (user) => {
  const isSuper = finalValidator.isSuperAdmin(user)

  let where
  const params = []

  if (isSuper) {
    // ITEM Sys-3 — Super Admin melihat SEMUA pengajuan yang masih berjalan
    // (pending Tier-1, approved Tier-2, staff-originated) tanpa terikat target.
    where = `p.status IN ('pending','approved')`
  } else {
    where = `(
      (
        p.status = 'approved'
        OR (p.status = 'pending' AND p.target_admin_final_id IS NOT NULL)
      )
      AND (p.target_admin_final_id = ? OR p.target_admin_final_id IS NULL)
    )`
    params.push(user.id)
  }

  const [rows] = await db.query(
    `
    SELECT
      p.id,
      p.mahasiswa_id,
      p.point,
      p.deskripsi,
      p.status,
      p.target_role,
      p.target_admin_final_id,
      p.unit_id,
      p.semester_id,
      p.created_at,
      p.approved_by,
      p.approved_at,
      p.pemberi_icp_id,
      m.nama AS mahasiswa_nama,
      m.nim,
      k.nama_kategori,
      ni.nama AS nama_icp,
      un.nama_unit,
      s.tahun_ajaran,
      s.semester,
      s.aktif AS semester_aktif,
      ap.username AS approved_by_name,
      pg.username AS pengaju,
      tv.username AS validator_tujuan
    FROM icp_pengajuan p
    LEFT JOIN mahasiswa m ON m.id = p.mahasiswa_id
    LEFT JOIN kategori_icp k ON k.id = p.kategori_id
    LEFT JOIN nama_icp ni ON ni.id = p.nama_icp_id
    LEFT JOIN unit_organisasi un ON un.id = p.unit_id
    LEFT JOIN semesters s ON s.id = p.semester_id
    LEFT JOIN users ap ON ap.id = p.approved_by
    LEFT JOIN users pg ON pg.id = p.pemberi_icp_id
    LEFT JOIN users tv ON tv.id = p.target_admin_final_id
    WHERE ${where}
    ORDER BY p.created_at ASC
    `,
    params
  )

  return rows
}

module.exports = {
  validasiPengajuan,
  rejectValidasi,
  getValidasiPengajuan
}
