const express = require("express")
const router = express.Router()

const controller = require("../controllers/icpPotongan.controller")
const auth = require("../../../shared/middlewares/auth.middleware")
const role = require("../../../shared/middlewares/role.middleware")
const accessSuper = require("../../../shared/middlewares/accessSuper.middleware")
const idempotency = require("../../../shared/middlewares/idempotency")

// ============================================================================
// /api/icp-potongan
// ----------------------------------------------------------------------------
// REVISI:
//  - POST /super       : super_admin ATAU admin AS dgn 'potongan_super'
//  - POST /            : dosen / admin (biasa) — pending, butuh validasi
//                        Wajib pilih target_admin_final_id
//  - GET  /eligible-validators : dropdown frontend pengaju
//  - GET  /inbox       : admin AS 'validasi_potongan' / super_admin
//  - PUT  /:id/approve : admin AS 'validasi_potongan' / super_admin
//  - PUT  /:id/reject  : sama, body { alasan }
//  - GET  /            : mahasiswa lihat potongan dirinya
// ============================================================================

router.use(auth)

// CREATE DIRECT — harus sebelum /:id
router.post(
  "/super",
  role(["admin", "super_admin"]),
  accessSuper("potongan_super"),
  idempotency,
  controller.createPotonganDirect
)

// CREATE biasa (dosen / admin)
router.post(
  "/",
  role(["dosen", "admin"]),
  idempotency,
  controller.createPotongan
)

// LIST eligible validator (semua role login boleh lihat)
router.get("/eligible-validators", controller.eligibleValidators)

// INBOX validasi (admin AS / super_admin)
router.get(
  "/inbox",
  role(["admin", "super_admin"]),
  accessSuper("validasi_potongan"),
  controller.listInboxValidasi
)

// MAHASISWA lihat dirinya
router.get("/", controller.getMyPotongan)

// APPROVE / REJECT
router.put(
  "/:id/approve",
  role(["admin", "super_admin"]),
  accessSuper("validasi_potongan"),
  idempotency,
  controller.approvePotongan
)

// ITEM #3: edit + approve potongan (validator bisa ubah kategori/jumlah dosen)
router.put(
  "/:id/edit-approve",
  role(["admin", "super_admin"]),
  accessSuper("validasi_potongan"),
  idempotency,
  controller.editAndApprovePotongan
)

router.put(
  "/:id/reject",
  role(["admin", "super_admin"]),
  accessSuper("validasi_potongan"),
  idempotency,
  controller.rejectPotongan
)

module.exports = router
