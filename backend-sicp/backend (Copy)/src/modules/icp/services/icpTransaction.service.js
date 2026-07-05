const db = require("../../../shared/config/db")
const mahasiswaModel = require("../../akademik/models/mahasiswa.model")
const { logAudit } = require("../../audit/services/audit.service")

// ===============================
const toNumber = (val, field) => {
  const num = Number(val)
  if (isNaN(num) || num <= 0) {
    throw new Error(`${field} tidak valid`)
  }
  return num
}

const checkUserLimit = async (conn, mahasiswa_id, semester_id, point) => {
  return
}

const checkUnitLimit = async (conn, unit_id, semester_id, point) => {
  return
}

const createTransaction = async (payload, user) => {
  const {
    mahasiswa_id,
    source_type,
    source_id,
    deskripsi,
    point,
    tipe,
    semester_id,
    kategori_id,
    nama_icp_id, 
    created_by,
    conn,
    idempotency_key,
    force,
    unit_id
  } = payload

  if (!conn) throw new Error("Connection (conn) wajib")

  const connection = conn

  // VALIDASI DASAR
  const mahasiswa = await mahasiswaModel.getActiveById(mahasiswa_id, connection)
  if (!mahasiswa) {
    throw new Error("Mahasiswa tidak valid / tidak aktif")
  }

  if (!kategori_id) throw new Error("kategori_id wajib")
  if (!semester_id) throw new Error("semester_id wajib")
  if (!deskripsi) throw new Error("Deskripsi wajib")

  if (!["masuk", "keluar"].includes(tipe)) {
    throw new Error("tipe tidak valid")
  }

  const numericPoint = toNumber(point, "point")

  if (source_type && source_id) {
    const [exist] = await connection.query(
      `SELECT id FROM icp_transactions
       WHERE source_type = ?
       AND source_id = ?
       AND mahasiswa_id = ?
       AND tipe = ?
       LIMIT 1
       FOR UPDATE`,
      [source_type, source_id, mahasiswa_id, tipe]
    )

    if (exist.length) {
      return { duplicated: true, id: exist[0].id }
    }
  }

  if (idempotency_key) {
    const [exist] = await connection.query(
      `SELECT id FROM icp_transactions 
       WHERE idempotency_key = ? 
       LIMIT 1 
       FOR UPDATE`,
      [idempotency_key]
    )

    if (exist.length) {
      return { duplicated: true, id: exist[0].id }
    }
  }

  if (!force) {
    await checkUserLimit(connection, mahasiswa_id, semester_id, numericPoint)
    await checkUnitLimit(connection, unit_id, semester_id, numericPoint)
  }

  const [result] = await connection.query(
    `INSERT INTO icp_transactions
    (mahasiswa_id, source_type, source_id, deskripsi, point, tipe, semester_id, 
     kategori_id, nama_icp_id, status, created_by, idempotency_key)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?)`,
    [
      mahasiswa_id,
      source_type || "manual",
      source_id || null,
      deskripsi,
      numericPoint,
      tipe,
      semester_id,
      kategori_id || null,
      nama_icp_id || null,
      created_by || user?.id,
      idempotency_key || null
    ]
  )

  //DEBT REDUCTION: jika pemberian masuk, kurangi hutang kategori yang sama
  if (tipe === "masuk" && kategori_id) {
    await connection.query(
      `UPDATE icp_debt
       SET amount = GREATEST(0, amount - ?)
       WHERE mahasiswa_id = ?
         AND kategori_id  = ?
         AND amount > 0`,
      [numericPoint, mahasiswa_id, kategori_id]
    )

    // Hapus baris hutang jika sudah lunas (amount = 0)
    await connection.query(
      `DELETE FROM icp_debt
       WHERE mahasiswa_id = ?
         AND kategori_id  = ?
         AND amount = 0`,
      [mahasiswa_id, kategori_id]
    )
  }

  return {
    id: result.insertId,
    duplicated: false
  }
}

// ===============================
const createManualTransaction = async (payload, user) => {
  if (user.role !== "super_admin") {
    throw new Error("Hanya super admin yang boleh melakukan manual ICP")
  }

  return await db.withTransaction(async (conn) => {
    const result = await createTransaction(
      {
        ...payload,
        conn,
        source_type: "manual",
        source_id: null,
        tipe: "masuk"
      },
      user
    )

    await logAudit({
      user_id: user.id,
      role: user.role,
      action: payload.force ? "FORCE_MANUAL_ICP" : "MANUAL_ICP_ADJUSTMENT",
      target_table: "icp_transactions",
      target_id: result.id,
      detail: {
        mahasiswa_id: payload.mahasiswa_id,
        point: payload.point,
        nama_icp_id: payload.nama_icp_id
      },
      conn
    })

    return result
  })
}

// ===============================
const getMyTransaction = async (mahasiswa_id) => {
  const [rows] = await db.query(
    `SELECT 
      id, source_type, source_id, deskripsi,
      point, tipe, semester_id, kategori_id, nama_icp_id,
      status, created_at
     FROM icp_transactions 
     WHERE mahasiswa_id = ?
     ORDER BY created_at DESC`,
    [mahasiswa_id]
  )

  return rows
}

module.exports = {
  createTransaction,
  createManualTransaction,
  getMyTransaction
} 