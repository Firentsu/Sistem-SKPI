const db = require("../../../shared/config/db")
const configModel = require("../models/config.model")
const { logAudit } = require("../../audit/services/audit.service")

// ===============================
// 🔍 GET ALL CONFIG
const getConfig = async () => {
  const [rows] = await db.query(
    `
    SELECT
      id,
      nama_setting,
      nilai,
      deskripsi
    FROM system_settings
    ORDER BY nama_setting
    `
  )

  return rows
}

// ===============================
// 🔍 GET SINGLE CONFIG BY KEY
const getConfigByKey = async (
  key,
  defaultValue = null,
  conn = null
) => {
  const value = await configModel.findConfigByKey(key, conn)

  if (value === null || value === undefined) {
    return defaultValue
  }

  try {
    return JSON.parse(value)
  } catch {}

  const num = Number(value)

  return isNaN(num)
    ? value
    : num
}

// ===============================
// ➕ SET CONFIG
const setConfig = async (
  key,
  value,
  user,
  conn = null
) => {
  if (!user || user.role !== "super_admin") {
    throw new Error("Unauthorized config update")
  }

  const connection = conn || await db.getConnection()
  const external = !!conn

  try {
    if (!external) {
      await connection.beginTransaction()
    }

    await configModel.upsertConfig(
      key,
      value,
      null,
      connection
    )

    await logAudit({
      user_id: user.id,
      role: user.role,
      action: "SYSTEM_CONFIG_UPDATE",
      target_table: "system_settings",
      target_id: key,
      detail: { key, value },
      conn: connection
    })

    if (!external) {
      await connection.commit()
    }

    return {
      key,
      value,
      message: "Config berhasil diperbarui"
    }

  } catch (err) {
    if (!external) {
      await connection.rollback()
    }

    throw err

  } finally {
    if (!external) {
      connection.release()
    }
  }
}

module.exports = {
  getConfig,
  getConfigByKey,
  setConfig
} 