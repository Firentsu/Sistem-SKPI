const service = require("../services/informasi.service")
const { success, fail } = require("../../../shared/utils/response")

// ============================================================================
// informasi.controller.js
// ----------------------------------------------------------------------------
// Controller tipis — validasi presence req.user, delegasi ke service.
// Foto kampus diunggah lewat multer (req.file); kita simpan path relatifnya.
// ============================================================================

const requireUser = (req) => {
  if (!req.user || !req.user.id) throw new Error("User tidak valid")
}

const fotoPath = (req) =>
  req.file ? `src/uploads/informasi/${req.file.filename}` : null

// ===============================
// GET / — publik untuk semua user login (mahasiswa/dosen/admin)
exports.getInformasi = async (req, res) => {
  try {
    requireUser(req)
    const data = await service.getInformasi()
    return success(res, data)
  } catch (err) {
    return fail(res, err.message)
  }
}

// ===============================
// GET /admin — Super Admin: lihat semua (filter ?status=published|hidden)
exports.listForAdmin = async (req, res) => {
  try {
    requireUser(req)
    const filter = {}
    if (req.query.status) filter.status = req.query.status
    const data = await service.listForAdmin(filter)
    return success(res, data)
  } catch (err) {
    return fail(res, err.message)
  }
}

// ===============================
// GET /:id — detail
exports.getDetail = async (req, res) => {
  try {
    requireUser(req)
    const data = await service.getDetail(Number(req.params.id))
    return success(res, data)
  } catch (err) {
    return fail(res, err.message)
  }
}

// ===============================
// POST / — Super Admin: tambah informasi (multipart/form-data)
//   field: judul, deskripsi, foto (file)
exports.create = async (req, res) => {
  try {
    requireUser(req)
    const { judul, deskripsi } = req.body
    const data = await service.create(
      { judul, deskripsi, foto_path: fotoPath(req) },
      req.user
    )
    return success(res, data, "Informasi berhasil ditambahkan")
  } catch (err) {
    return fail(res, err.message)
  }
}

// ===============================
// PUT /:id — Super Admin: update (multipart/form-data, semua field opsional)
//   field: judul, deskripsi, foto (file)  - foto baru → ganti & hapus lama
exports.update = async (req, res) => {
  try {
    requireUser(req)
    const id = Number(req.params.id)
    const payload = {}
    if (req.body.judul !== undefined) payload.judul = req.body.judul
    if (req.body.deskripsi !== undefined) payload.deskripsi = req.body.deskripsi
    if (req.file) payload.foto_path = fotoPath(req)

    const data = await service.update(id, payload, req.user)
    return success(res, data, "Informasi berhasil diupdate")
  } catch (err) {
    return fail(res, err.message)
  }
}

// ===============================
// PUT /:id/hide — Super Admin: sembunyikan
exports.hide = async (req, res) => {
  try {
    requireUser(req)
    const data = await service.setVisibility(Number(req.params.id), false, req.user)
    return success(res, data, "Informasi disembunyikan")
  } catch (err) {
    return fail(res, err.message)
  }
}

// ===============================
// PUT /:id/publish — Super Admin: tampilkan kembali
exports.publish = async (req, res) => {
  try {
    requireUser(req)
    const data = await service.setVisibility(Number(req.params.id), true, req.user)
    return success(res, data, "Informasi ditampilkan kembali")
  } catch (err) {
    return fail(res, err.message)
  }
}

// ===============================
// DELETE /:id — Super Admin: hapus (soft)
exports.remove = async (req, res) => {
  try {
    requireUser(req)
    const data = await service.remove(Number(req.params.id), req.user)
    return success(res, data, "Informasi dihapus")
  } catch (err) {
    return fail(res, err.message)
  }
}
