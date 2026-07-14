const service = require("../services/icpTransaction.service")
const { success, fail } = require("../../../shared/utils/response")

const validateUser = (req) => {
  if (!req.user) throw new Error("User tidak valid")
}

const safeError = (err) => err?.message || "Terjadi kesalahan"

// ===============================
// CREATE MANUAL TRANSACTION (SUPER ADMIN)
// Transaksi DB dikelola di service layer (db.withTransaction).
const createTransaction = async (req, res) => {
  try {
    validateUser(req)

    const payload = {
      mahasiswa_id: req.body.mahasiswa_id,
      kategori_id: req.body.kategori_id,
      semester_id: req.body.semester_id,
      deskripsi: req.body.deskripsi,
      point: req.body.point,
      nama_icp_id: req.body.nama_icp_id || null,
      unit_id: req.body.unit_id || null,
      idempotency_key:
        req.headers["x-idempotency-key"] ||
        req.body.idempotency_key ||
        null
    }

    const result = await service.createManualTransaction(payload, req.user)

    return success(res, result, "Manual ICP berhasil ditambahkan")

  } catch (err) {
    return fail(res, safeError(err))
  }
}

// ===============================
const getMyTransaction = async (req, res) => {
  try {
    validateUser(req)

    if (!req.user.mahasiswa_id) {
      throw new Error("User bukan mahasiswa")
    }

    const data = await service.getMyTransaction(req.user.mahasiswa_id)

    return success(res, data)

  } catch (err) {
    return fail(res, safeError(err))
  }
}

module.exports = {
  createTransaction,
  getMyTransaction
}
