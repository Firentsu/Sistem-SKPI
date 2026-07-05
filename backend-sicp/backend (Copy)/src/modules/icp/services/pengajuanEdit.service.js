// ============================================================================
// pengajuanEdit.service.js  (REVISI #3)
// ----------------------------------------------------------------------------
// Edit pengajuan sebelum approve.
//   - editAndApproveTier1: dipakai dosen/admin (tier-1)
//   - editAndApproveFinal: dipakai admin AS/SA dgn validasi_final
//
// Yang bisa di-edit: kategori_id, nama_icp_id, point, deskripsi.
// Original values di-snapshot ke kolom original_* (audit trail).
// ============================================================================

const db = require("../../../shared/config/db")
const validateNamaIcp = require("../../../shared/utils/validateNamaIcp")
const { logAudit } = require("../../audit/services/audit.service")
const { createLedger } = require("../../../core/ledger.engine")
const { ICP_SOURCE } = require("../../../shared/constants/icpSourceType")

const isSuperAdmin = (u) => {
  const r = Array.isArray(u.roles) ? u.roles : [u.role]
  return r.includes("super_admin")
}
const hasAccess = (u, k) => isSuperAdmin(u) || (u.access && u.access[k])

// Snapshot original (hanya field yang berubah)
const snapshotOriginal = (current, edits) => {
  const snap = {}
  if (edits.kategori_id !== undefined && edits.kategori_id !== current.kategori_id) {
    snap.original_kategori_id = current.kategori_id
  }
  if (edits.nama_icp_id !== undefined && edits.nama_icp_id !== current.nama_icp_id) {
    snap.original_nama_icp_id = current.nama_icp_id
  }
  if (edits.point !== undefined && edits.point !== current.point) {
    snap.original_point = current.point
  }
  if (edits.deskripsi !== undefined && edits.deskripsi !== current.deskripsi) {
    snap.original_deskripsi = current.deskripsi
  }
  return snap
}

const applyEdit = async (pengajuanId, edits, editor, stage, conn) => {
  // 1. Ambil pengajuan
  const [rows] = await conn.query(
    `SELECT id, mahasiswa_id, unit_id, kategori_id, nama_icp_id, point,
            deskripsi, status, target_admin_final_id, edited_by
     FROM icp_pengajuan WHERE id = ? FOR UPDATE`,
    [pengajuanId])
  if (!rows.length) throw new Error("Pengajuan tidak ditemukan")
  const p = rows[0]

  // 2. Hanya bisa edit kalau belum pernah di-edit di stage yang sama
  // (boleh: tier1 edit lalu final edit lagi)
  if (p.edited_at && p.edit_stage === stage) {
    throw new Error("Pengajuan sudah pernah di-edit di stage ini")
  }

  // 3. Snapshot original
  const snap = snapshotOriginal(p, edits)

  // 4. Validasi field baru (kalau ada perubahan unit-related)
  const newKat = edits.kategori_id ?? p.kategori_id
  const newNi  = edits.nama_icp_id ?? p.nama_icp_id
  if (snap.original_kategori_id !== undefined || snap.original_nama_icp_id !== undefined) {
    await validateNamaIcp({
      unit_id: p.unit_id,
      kategori_id: newKat,
      nama_icp_id: newNi,
      target_user_id: null  // edit tidak ubah target user
    }, conn)
  }

  // 5. Validasi point
  if (edits.point !== undefined) {
    if (typeof edits.point !== "number" || edits.point <= 0) {
      throw new Error("point harus angka > 0")
    }
  }

  // 6. UPDATE pengajuan
  const sets = []
  const params = []
  for (const [k, v] of Object.entries(edits)) {
    if (["kategori_id","nama_icp_id","point","deskripsi"].includes(k) && v !== undefined) {
      sets.push(`${k} = ?`); params.push(v)
    }
  }
  for (const [k, v] of Object.entries(snap)) {
    sets.push(`${k} = ?`); params.push(v)
  }
  sets.push("edited_by = ?"); params.push(editor.id)
  sets.push("edited_at = NOW()")
  sets.push("edit_stage = ?"); params.push(stage)
  params.push(pengajuanId)

  await conn.query(
    `UPDATE icp_pengajuan SET ${sets.join(", ")} WHERE id = ?`, params)

  return { snap, applied: edits, current: p }
}

// ============================================================================
// EDIT + APPROVE TIER-1 (Dosen/Admin biasa)
// ============================================================================
const editAndApproveTier1 = async (user, pengajuanId, body) => {
  // body: { kategori_id?, nama_icp_id?, point?, deskripsi?,
  //          target_admin_final_id (wajib utk approve) }
  if (!body.target_admin_final_id) {
    throw new Error("target_admin_final_id wajib utk approve tier-1")
  }

  // Validasi target memang punya akses validasi_final
  const [t] = await db.query(
    `SELECT 1 FROM admin_access
     WHERE user_id = ? AND access_key = 'validasi_final' LIMIT 1`,
    [body.target_admin_final_id])
  const [tu] = await db.query(`SELECT role FROM users WHERE id = ?`, [body.target_admin_final_id])
  const isSA = tu.length && tu[0].role === "super_admin"
  if (!t.length && !isSA) {
    throw new Error("Target user tidak memiliki akses validasi_final")
  }

  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()

    // Cek status pengajuan = pending
    const [statRows] = await conn.query(
      `SELECT status FROM icp_pengajuan WHERE id = ? FOR UPDATE`, [pengajuanId])
    if (!statRows.length) throw new Error("Pengajuan tidak ditemukan")
    if (statRows[0].status !== "pending") {
      throw new Error(`Pengajuan sudah ${statRows[0].status}`)
    }

    // Apply edits (kalau ada)
    const hasEdits = Object.keys(body).some(k =>
      ["kategori_id","nama_icp_id","point","deskripsi"].includes(k) && body[k] !== undefined)
    if (hasEdits) {
      await applyEdit(pengajuanId, body, user, "tier1", conn)
    }

    // Approve (Tier 1 → Tier 2): tetapkan validator final + jejak approver.
    await conn.query(
      `UPDATE icp_pengajuan
       SET status = 'approved',
           target_admin_final_id = ?,
           approved_by = ?,
           pemberi_icp_id = COALESCE(pemberi_icp_id, ?),
           approved_at = NOW()
       WHERE id = ?`,
      [body.target_admin_final_id, user.id, user.id, pengajuanId])

    await logAudit({
      user_id: user.id, role: user.role,
      action: hasEdits ? "EDIT_AND_APPROVE_TIER1" : "APPROVE_TIER1",
      target_table: "icp_pengajuan", target_id: pengajuanId,
      detail: { edits: body, target_admin_final_id: body.target_admin_final_id },
      conn,
    })

    await conn.commit()
    return { pengajuan_id: pengajuanId, status: "approved", edited: hasEdits,
             target_admin_final_id: body.target_admin_final_id }
  } catch (err) { await conn.rollback(); throw err }
  finally { conn.release() }
}

// ============================================================================
// EDIT + APPROVE FINAL (Admin AS/SA dgn validasi_final)
// ============================================================================
const editAndApproveFinal = async (user, pengajuanId, body) => {
  if (!hasAccess(user, "validasi_final")) {
    throw new Error("Tidak punya akses validasi_final")
  }

  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()

    const [rows] = await conn.query(
      `SELECT id, status, target_admin_final_id, mahasiswa_id, point,
              semester_id, kategori_id, nama_icp_id, unit_id, deskripsi
       FROM icp_pengajuan WHERE id = ? FOR UPDATE`, [pengajuanId])
    if (!rows.length) throw new Error("Pengajuan tidak ditemukan")
    const p = rows[0]
    if (p.status !== "approved") {
      throw new Error(`Pengajuan harus berstatus 'approved' dulu (sekarang: ${p.status})`)
    }
    if (!isSuperAdmin(user) &&
        p.target_admin_final_id != null &&
        Number(p.target_admin_final_id) !== Number(user.id)) {
      throw new Error("Bukan target validator Anda. Super Admin bisa override.")
    }

    const hasEdits = Object.keys(body).some(k =>
      ["kategori_id","nama_icp_id","point","deskripsi"].includes(k) && body[k] !== undefined)
    if (hasEdits) {
      await applyEdit(pengajuanId, body, user, "final", conn)
    }

    // Ambil ulang nilai final setelah edit (point/kategori/nama_icp/deskripsi).
    const [freshRows] = await conn.query(
      `SELECT point, kategori_id, nama_icp_id, deskripsi
       FROM icp_pengajuan WHERE id = ?`, [pengajuanId])
    const fresh = freshRows[0]

    // Final approve: status approved_final + ledger MASUK (via ledger engine).
    await conn.query(
      `UPDATE icp_pengajuan
       SET status = 'approved_final',
           validated_by = ?,
           approved_by = COALESCE(approved_by, ?),
           approved_at = COALESCE(approved_at, NOW()),
           final_validated_at = NOW()
       WHERE id = ?`,
      [user.id, user.id, pengajuanId])

    await createLedger({
      payload: {
        mahasiswa_id: p.mahasiswa_id,
        source_type: ICP_SOURCE.PENGAJUAN,
        source_id: p.id,
        deskripsi: fresh.deskripsi,
        point: fresh.point,
        tipe: "masuk",
        semester_id: p.semester_id,
        kategori_id: fresh.kategori_id,
        nama_icp_id: fresh.nama_icp_id || null,
        unit_id: p.unit_id || null,
        created_by: user.id,
        idempotency_key: `VALIDASI-PENGAJUAN-${p.id}`,
        conn
      },
      actor: user,
      audit_action: hasEdits ? "EDIT_AND_APPROVE_FINAL" : "APPROVE_FINAL",
      audit_detail: { pengajuan_id: p.id, mahasiswa_id: p.mahasiswa_id, point: fresh.point }
    })

    await conn.commit()
    return { pengajuan_id: pengajuanId, status: "approved_final",
             edited: hasEdits, final_point: fresh.point }
  } catch (err) { await conn.rollback(); throw err }
  finally { conn.release() }
}

// ============================================================================
// GET EDIT HISTORY — lihat semua pengajuan yg pernah di-edit
// ============================================================================
const getEditHistory = async (filter = {}) => {
  const where = []; const params = []
  if (filter.editor_id) { where.push("edited_by = ?"); params.push(filter.editor_id) }
  if (filter.mahasiswa_id) { where.push("mahasiswa_id = ?"); params.push(filter.mahasiswa_id) }
  if (filter.stage) { where.push("edit_stage = ?"); params.push(filter.stage) }
  const wsql = where.length ? "WHERE " + where.join(" AND ") : ""
  const [rows] = await db.query(
    `SELECT * FROM v_pengajuan_edit_history ${wsql} ORDER BY edited_at DESC LIMIT 200`,
    params)
  return rows
}

module.exports = { editAndApproveTier1, editAndApproveFinal, getEditHistory }
