const validationService = require("../services/icpValidation.service")
const finalValidatorPolicy = require("../../../shared/policies/finalValidator.policy")
const { success, fail } = require("../../../shared/utils/response")

// ===============================
// 🔵 VALIDASI FINAL PENGAJUAN
const validasiPengajuan = async (req, res) => {
  try {
    const result = await validationService.validasiPengajuan(
      req.params.id,
      req.user
    )
    return success(res, result)
  } catch (err) {
    return fail(res, err.message)
  }
}

// ===============================
// 🔴 REJECT FINAL PENGAJUAN
const rejectValidasi = async (req, res) => {
  try {
    const result = await validationService.rejectValidasi(
      req.params.id,
      req.user,
      (req.body && req.body.alasan) || null
    )
    return success(res, result)
  } catch (err) {
    return fail(res, err.message)
  }
}

// ===============================
// 📊 LIST INBOX VALIDASI FINAL
const getValidasiPengajuan = async (req, res) => {
  try {
    const data = await validationService.getValidasiPengajuan(req.user)
    return success(res, data)
  } catch (err) {
    return fail(res, err.message)
  }
}

// 📋 LIST ELIGIBLE FINAL VALIDATOR (dropdown frontend pengaju)
const eligibleValidators = async (req, res) => {
  try {
    const data = await finalValidatorPolicy.listEligibleFinalValidators()
    return success(res, data)
  } catch (err) {
    return fail(res, err.message)
  }
}

module.exports = {
  validasiPengajuan,
  rejectValidasi,
  getValidasiPengajuan,
  eligibleValidators
}
