const service = require("../services/userLimit.service")
const wrap = (fn) => async (req, res) => {
  try { res.json({ success: true, data: await fn(req) }) }
  catch (e) { res.status(400).json({ success: false, message: e.message }) }
}
exports.set    = wrap(req => service.setLimit(req.user, req.body))
exports.list   = wrap(req => service.getLimits(req.query))
exports.delete = wrap(req => service.deleteLimit(req.user, req.params.id))
