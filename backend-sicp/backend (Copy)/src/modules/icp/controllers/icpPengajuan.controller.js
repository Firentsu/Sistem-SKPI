const service = require("../services/icpPengajuan.service")

// ===============================
// CREATE PENGAJUAN
const create = async (req, res) => {
  try {
    const result = await service.createPengajuan(req.user, req.body)

    return res.json({
      success: true,
      message: "Pengajuan berhasil dibuat",
      data: result
    })
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    })
  }
}

// ===============================
// HISTORY (MAHASISWA)
const history = async (req, res) => {
  try {
    const result = await service.getHistory(req.user)

    return res.json({
      success: true,
      message: "History berhasil diambil",
      data: result
    })
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    })
  }
}

// ===============================
// INBOX (DOSEN / ADMIN / SUPER ADMIN)
const inbox = async (req, res) => {
  try {
    const result = await service.getInbox(req.user)

    return res.json({
      success: true,
      message: "Inbox berhasil diambil",
      data: result
    })
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    })
  }
}

// ===============================
module.exports = {
  create,
  history,
  inbox
}