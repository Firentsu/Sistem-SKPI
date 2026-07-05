const service = require("../services/icpApproval.service")

// ===============================
// 🔥 APPROVE (Tier 1 → wajib target_admin_final_id, atau finalisasi)
const approve = async (req, res) => {
  try {
    const user = req.user
    const { id } = req.params

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID pengajuan wajib diisi"
      })
    }

    const result = await service.approvePengajuan(id, user, req.body || {})

    return res.json({
      success: true,
      message:
        result.status === "approved"
          ? "Berhasil approve (Tier 1) — diteruskan ke validator final"
          : "Berhasil validasi final",
      data: result
    })

  } catch (err) {
    console.error("APPROVE ERROR:", err.message)
    return res.status(400).json({
      success: false,
      message: err.message
    })
  }
}

// ===============================
// 🔥 REJECT
const reject = async (req, res) => {
  try {
    const user = req.user
    const { id } = req.params

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID pengajuan wajib diisi"
      })
    }

    const result = await service.rejectPengajuan(
      id,
      user,
      (req.body && req.body.alasan) || null
    )

    return res.json({
      success: true,
      message: "Berhasil reject",
      data: result
    })

  } catch (err) {
    console.error("REJECT ERROR:", err.message)
    return res.status(400).json({
      success: false,
      message: err.message
    })
  }
}

// ===============================
// 📥 INBOX TIER 1 (dosen / admin biasa)
const inboxTier1 = async (req, res) => {
  try {
    const data = await service.getInboxTier1(req.user)
    return res.json({
      success: true,
      message: "Inbox Tier 1",
      data
    })
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    })
  }
}

module.exports = {
  approve,
  reject,
  inboxTier1
}
