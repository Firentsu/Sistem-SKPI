const express = require("express")
const router = express.Router()

const controller = require("../controllers/panitiaPendaftaran.controller")
const auth = require("../../../shared/middlewares/auth.middleware")
const role = require("../../../shared/middlewares/role.middleware")
const accessSuper = require("../../../shared/middlewares/accessSuper.middleware")

// ============================================================================
// PANITIA PENDAFTARAN — path alternatif approve/reject (Postman compat).
// FINAL CLEANUP: ditambahkan guard accessSuper("kelola_kegiatan") agar
// konsisten dengan jalur utama di panitia.routes.
// Catatan: path utama tetap PUT /api/panitia/:id/approve di panitia.routes.
// ============================================================================

const guardKelolaKegiatan = accessSuper("kelola_kegiatan")

router.put(
  "/approve/:id",
  auth,
  role(["admin", "super_admin"]),
  guardKelolaKegiatan,
  controller.approve
)

router.put(
  "/reject/:id",
  auth,
  role(["admin", "super_admin"]),
  guardKelolaKegiatan,
  controller.reject
)

module.exports = router
