const BaseModel = require("../../../shared/models/base.model")

// ===============================
// 🔒 GET POTONGAN (LOCK)
const findPotonganById = async (id, conn) => {
  const [rows] = await BaseModel.query(
    `SELECT * FROM icp_potongan WHERE id = ? FOR UPDATE`,
    [id],
    conn
  )
  return rows[0] || null
}

// ===============================
// 🔍 CEK SUDAH MASUK LEDGER
const findExistingLedger = async (potonganId, conn) => {
  const [rows] = await BaseModel.query(
    `SELECT id FROM icp_transactions
     WHERE source_type = 'icp_potongan'
     AND source_id = ?
     AND status = 'approved'
     LIMIT 1`,
    [potonganId],
    conn
  )

  return rows[0] || null
}

// ===============================
// 🔥 SALDO PER KATEGORI + SEMESTER (WAJIB)
const getSaldoByKategoriSemester = async (
  mahasiswa_id,
  kategori_id,
  semester_id,
  conn
) => {
  const [[row]] = await BaseModel.query(
    `SELECT COALESCE(SUM(
      CASE 
        WHEN tipe = 'masuk' THEN point
        ELSE -point
      END
    ), 0) AS saldo
    FROM icp_transactions
    WHERE mahasiswa_id = ?
    AND kategori_id = ?
    AND semester_id = ?
    AND status = 'approved'`,
    [mahasiswa_id, kategori_id, semester_id],
    conn
  )

  return row.saldo
}

// ===============================
// ⚠️ (OPTIONAL) GLOBAL SALDO (JANGAN DIPAKAI CORE)
const getGlobalSaldo = async (mahasiswa_id, conn) => {
  const [[row]] = await BaseModel.query(
    `SELECT COALESCE(SUM(
      CASE 
        WHEN tipe = 'masuk' THEN point
        ELSE -point
      END
    ), 0) AS saldo
    FROM icp_transactions
    WHERE mahasiswa_id = ?
    AND status = 'approved'`,
    [mahasiswa_id],
    conn
  )

  return row.saldo
}

// ===============================
// 💸 UPSERT DEBT (SAFE)
const upsertDebt = async (data, conn) => {
  const { mahasiswa_id, kategori_id, amount } = data

  // cek existing
  const [rows] = await BaseModel.query(
    `SELECT amount FROM icp_debt 
     WHERE mahasiswa_id = ? AND kategori_id = ?`,
    [mahasiswa_id, kategori_id],
    conn
  )

  if (!rows.length) {
    await BaseModel.query(
      `INSERT INTO icp_debt (mahasiswa_id, kategori_id, amount)
       VALUES (?, ?, ?)`,
      [mahasiswa_id, kategori_id, amount],
      conn
    )
  } else {
    // overwrite sesuai saldo terbaru (bukan akumulasi)
    await BaseModel.query(
      `UPDATE icp_debt 
       SET amount = ? 
       WHERE mahasiswa_id = ? AND kategori_id = ?`,
      [amount, mahasiswa_id, kategori_id],
      conn
    )
  }
}

module.exports = {
  findPotonganById,
  findExistingLedger,
  getSaldoByKategoriSemester,
  getGlobalSaldo,
  upsertDebt
} 