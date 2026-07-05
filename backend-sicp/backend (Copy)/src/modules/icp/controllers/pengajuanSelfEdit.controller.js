const service = require("../services/pengajuanSelfEdit.service")
const { success, fail } = require("../../../shared/utils/response")

exports.editPemberian = async (req, res) => {
  try { return success(res, await service.editPemberian(req.params.id, req.body || {}, req.user), "Pengajuan pemberian diperbarui") }
  catch (err) { return fail(res, err.message) }
}
exports.editPotongan = async (req, res) => {
  try { return success(res, await service.editPotongan(req.params.id, req.body || {}, req.user), "Pengajuan potongan diperbarui") }
  catch (err) { return fail(res, err.message) }
}
