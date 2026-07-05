const icpPotonganService = require("../services/icpPotongan.service")
const finalValidatorPolicy = require("../../../shared/policies/finalValidator.policy")
const { success, fail } = require("../../../shared/utils/response")

const validateUser = (req) => {
  if (!req.user || !req.user.id) throw new Error("User tidak valid")
}
const validateId = (id) => {
  if (!id || isNaN(Number(id))) throw new Error("ID tidak valid")
}

// ============================================================================
// CREATE — dosen / admin biasa (pending → butuh validasi)
// Service yang validate role & limit, controller hanya forward + req.user
// ============================================================================
const createPotongan = async (req, res) => {
  try {
    validateUser(req)
    const {
      mahasiswa_id, jumlah_potong, kategori_id, kategori_pelanggaran,
      keterangan, target_admin_final_id
    } = req.body

    if (!mahasiswa_id) throw new Error("mahasiswa_id wajib diisi")
    if (!kategori_id) throw new Error("kategori_id wajib diisi")
    if (!jumlah_potong || Number(jumlah_potong) <= 0) {
      throw new Error("jumlah_potong tidak valid")
    }

    const result = await icpPotonganService.createPotongan({
      mahasiswa_id: Number(mahasiswa_id),
      kategori_id: Number(kategori_id),
      kategori_pelanggaran: kategori_pelanggaran || null,
      jumlah_potong: Number(jumlah_potong),
      keterangan: keterangan?.trim() || null,
      target_admin_final_id: target_admin_final_id ? Number(target_admin_final_id) : null
    }, req.user)

    return success(res, result)
  } catch (err) {
    return fail(res, err.message)
  }
}

// ============================================================================
// CREATE DIRECT — Super Admin / Admin AS ber-akses 'potongan_super'
// ============================================================================
const createPotonganDirect = async (req, res) => {
  try {
    validateUser(req)
    const {
      mahasiswa_id, jumlah_potong, kategori_id,
      kategori_pelanggaran, keterangan
    } = req.body

    if (!mahasiswa_id) throw new Error("mahasiswa_id wajib diisi")
    if (!kategori_id) throw new Error("kategori_id wajib diisi")
    if (!jumlah_potong || Number(jumlah_potong) <= 0) {
      throw new Error("jumlah_potong tidak valid")
    }

    const result = await icpPotonganService.createPotonganDirect({
      mahasiswa_id: Number(mahasiswa_id),
      kategori_id: Number(kategori_id),
      kategori_pelanggaran: kategori_pelanggaran || null,
      jumlah_potong: Number(jumlah_potong),
      keterangan: keterangan?.trim() || null
    }, req.user)

    return success(res, result, "Potongan ICP berhasil diterapkan langsung")
  } catch (err) {
    return fail(res, err.message)
  }
}

// ============================================================================
// APPROVE — admin AS 'validasi_potongan' / Super Admin
// ============================================================================
const approvePotongan = async (req, res) => {
  try {
    validateUser(req)
    validateId(req.params.id)

    const result = await icpPotonganService.approvePotongan(
      Number(req.params.id), req.user
    )
    return success(res, result)
  } catch (err) {
    return fail(res, err.message)
  }
}

// ============================================================================
// REJECT — admin AS 'validasi_potongan' / Super Admin
// ============================================================================
const rejectPotongan = async (req, res) => {
  try {
    validateUser(req)
    validateId(req.params.id)
    const { alasan } = req.body
    if (!alasan) throw new Error("alasan wajib diisi")

    const result = await icpPotonganService.rejectPotongan(
      Number(req.params.id), req.user, alasan
    )
    return success(res, result)
  } catch (err) {
    return fail(res, err.message)
  }
}

// ============================================================================
// GET MY (mahasiswa)
// ============================================================================
const getMyPotongan = async (req, res) => {
  try {
    validateUser(req)
    if (!req.user.mahasiswa_id) throw new Error("User bukan mahasiswa")
    const data = await icpPotonganService.getMyPotongan(req.user.mahasiswa_id)
    return success(res, data)
  } catch (err) {
    return fail(res, err.message)
  }
}

// ============================================================================
// LIST INBOX VALIDASI — admin AS 'validasi_potongan' / Super Admin
// ============================================================================
const listInboxValidasi = async (req, res) => {
  try {
    validateUser(req)
    const data = await icpPotonganService.listInboxValidasi(req.user)
    return success(res, data)
  } catch (err) {
    return fail(res, err.message)
  }
}

// ============================================================================
// ELIGIBLE VALIDATOR — dropdown untuk frontend pengaju
// ============================================================================
const eligibleValidators = async (req, res) => {
  try {
    validateUser(req)
    const data = await finalValidatorPolicy.listEligiblePotonganValidators()
    return success(res, data)
  } catch (err) {
    return fail(res, err.message)
  }
}

// ITEM #3: edit + approve potongan (validator)
const editAndApprovePotongan = async (req, res) => {
  try {
    const result = await icpPotonganService.editAndApprovePotongan(
      req.params.id, req.body || {}, req.user)
    return success(res, result, "Potongan diedit & disetujui")
  } catch (err) { return fail(res, err.message) }
}

module.exports = {
  createPotongan,
  createPotonganDirect,
  approvePotongan,
  editAndApprovePotongan,
  rejectPotongan,
  getMyPotongan,
  listInboxValidasi,
  eligibleValidators
}
