const service = require("../services/import.service")
const fs = require("fs")

const wrap = (handlerName, jenis) => async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "File wajib di-upload" })
  try {
    const result = await service[handlerName](req.file.path, req.user.id)
    fs.unlink(req.file.path, () => {})
    return res.json({ success: true, message: `Import ${jenis} berhasil`, data: result })
  } catch (err) {
    fs.unlink(req.file.path, () => {})
    return res.status(400).json({ success: false, message: err.message })
  }
}

exports.importMahasiswa  = wrap("importMahasiswa",  "mahasiswa")
exports.importDosen      = wrap("importDosen",      "dosen")
exports.importAdmin      = wrap("importAdmin",      "admin")
exports.importMataKuliah = wrap("importMataKuliahWithEnroll", "mata kuliah + enroll")
exports.importPotongan   = wrap("importPotongan",   "potongan ICP")
