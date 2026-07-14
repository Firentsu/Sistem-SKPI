const BaseModel = require("../../../shared/models/base.model")

// ===============================
// 🔍 GET CONFIG BY KEY
const findConfigByKey = async (key, conn = null) => {
  const row = await BaseModel.findOne(
    `SELECT nilai AS value
       FROM system_settings
      WHERE nama_setting = ?
      LIMIT 1`,
    [key],
    conn
  )

  return row ? row.value : null
}

// ===============================
// 🔍 GET FULL CONFIG (with deskripsi)
const findFullConfigByKey = async (key, conn = null) => {
  const row = await BaseModel.findOne(
    `SELECT id, nama_setting, nilai, deskripsi
       FROM system_settings
      WHERE nama_setting = ?
      LIMIT 1`,
    [key],
    conn
  )

  return row || null
}

// ===============================
// 🔍 GET ALL CONFIG (untuk halaman admin)
const findAllConfig = async (conn = null) => {
  const rows = await BaseModel.findAll(
    `SELECT id, nama_setting, nilai, deskripsi
       FROM system_settings
      ORDER BY nama_setting ASC`,
    [],
    conn
  )

  return rows || []
}

// ===============================
// ➕ UPSERT CONFIG (insert kalau belum ada, update kalau ada)
const upsertConfig = async (key, value, deskripsi = null, conn = null) => {
  // Cek apakah sudah ada
  const existing = await findFullConfigByKey(key, conn)

  if (existing) {
    // UPDATE
    await BaseModel.query(
      `UPDATE system_settings
          SET nilai = ?,
              deskripsi = COALESCE(?, deskripsi)
        WHERE nama_setting = ?`,
      [String(value), deskripsi, key],
      conn
    )
    return { id: existing.id, action: "updated" }
  }

  // INSERT
  const [result] = await BaseModel.query(
    `INSERT INTO system_settings (nama_setting, nilai, deskripsi)
     VALUES (?, ?, ?)`,
    [key, String(value), deskripsi],
    conn
  )

  return { id: result.insertId, action: "inserted" }
}

module.exports = {
  findConfigByKey,
  findFullConfigByKey,
  findAllConfig,
  upsertConfig
}