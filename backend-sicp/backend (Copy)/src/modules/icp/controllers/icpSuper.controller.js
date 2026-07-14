const service = require("../services/icpTransaction.service")
const { success, fail } = require("../../../shared/utils/response")

// ===============================
const validateUser = (req) => {
  if (!req.user) throw new Error("User tidak valid")
}

// ===============================
// SUPER MANUAL ICP — FORCE MODE (UNLIMITED, lewati limit)
// Transaksi DB dikelola di service layer (db.withTransaction).
const createSuperManual = async (req, res) => {
  try {
    validateUser(req)

    const payload = {
      mahasiswa_id: req.body.mahasiswa_id,
      kategori_id: req.body.kategori_id,
      semester_id: req.body.semester_id,
      deskripsi: req.body.deskripsi,
      point: req.body.point,
      nama_icp_id: req.body.nama_icp_id || null,

      // 🔥 FORCE MODE — lewati semua limit
      force: true,

      // SYSTEM
      idempotency_key:
        req.headers["x-idempotency-key"] ||
        req.body.idempotency_key ||
        null
    }

    const result = await service.createManualTransaction(payload, req.user)

    return success(res, result, "Super manual ICP berhasil")

  } catch (err) {
    return fail(res, err.message)
  }
}

module.exports = {
  createSuperManual
}
