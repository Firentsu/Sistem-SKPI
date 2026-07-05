const service = require("../services/pengajuanEdit.service")
const wrap = (fn) => async (req, res) => {
  try { res.json({ success: true, data: await fn(req) }) }
  catch (e) { res.status(400).json({ success: false, message: e.message }) }
}

exports.editAndApproveTier1 = wrap(req => service.editAndApproveTier1(req.user, req.params.id, req.body))
exports.editAndApproveFinal = wrap(req => service.editAndApproveFinal(req.user, req.params.id, req.body))
exports.getHistory          = wrap(req => service.getEditHistory(req.query))
