const service = require("../services/unitManagement.service")

const wrap = (fn) => async (req, res) => {
  try { res.json({ success: true, data: await fn(req) }) }
  catch (e) { res.status(400).json({ success: false, message: e.message }) }
}

exports.list           = wrap(req => service.listUnits())
exports.listAll        = wrap(req => service.listForAll())
exports.create         = wrap(req => service.createUnit(req.user, req.body))
exports.detail         = wrap(req => service.getUnitDetail(req.params.id))
exports.update         = wrap(req => service.updateUnit(req.user, req.params.id, req.body))
exports.delete         = wrap(req => service.deleteUnit(req.user, req.params.id))

exports.assignKategori = wrap(req => service.assignKategori(req.user, req.params.id, req.body.kategori_id))
exports.removeKategori = wrap(req => service.removeKategori(req.user, req.params.id, req.params.kid))

exports.addNamaIcp     = wrap(req => service.addNamaIcp(req.user, req.params.id, req.body.nama))
exports.updateNamaIcp  = wrap(req => service.updateNamaIcp(req.user, req.params.id, req.params.nid, req.body))
exports.deleteNamaIcp  = wrap(req => service.deleteNamaIcp(req.user, req.params.id, req.params.nid))

exports.addMember      = wrap(req => service.addMember(req.user, req.params.id, req.body.user_id))
exports.removeMember   = wrap(req => service.removeMember(req.user, req.params.id, req.params.uid))

exports.getOptions     = wrap(req => service.getUnitOptions(req.params.id))
exports.getMyUnits     = wrap(req => service.getMyUnits(req.user.id))
