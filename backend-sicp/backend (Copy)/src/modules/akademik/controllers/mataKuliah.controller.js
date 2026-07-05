const service = require("../services/mataKuliah.service")
const wrap = (fn) => async (req, res) => {
  try { res.json({ success: true, data: await fn(req) }) }
  catch (e) { res.status(400).json({ success: false, message: e.message }) }
}
exports.getAll      = wrap(req => service.getAll(req.query.semester_id))
exports.getDetail   = wrap(req => service.getDetail(req.params.id))
exports.create      = wrap(req => service.create(req.body, req.user))
exports.update      = wrap(req => service.update(req.params.id, req.body, req.user))
exports.remove      = wrap(req => service.remove(req.params.id, req.user))
exports.addDosen    = wrap(req => service.addDosen(req.params.id, req.body.user_id, req.body.is_koordinator, req.user))
exports.removeDosen = wrap(req => service.removeDosen(req.params.id, req.params.uid))
exports.enroll      = wrap(req => service.enrollMahasiswa(req.params.id, req.body.mahasiswa_id, req.user))
exports.drop        = wrap(req => service.dropMahasiswa(req.params.id, req.params.mid))
