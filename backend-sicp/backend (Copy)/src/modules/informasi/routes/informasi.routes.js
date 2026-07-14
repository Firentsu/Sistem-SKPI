const express = require("express")
const router = express.Router()

const controller = require("../controllers/informasi.controller")
const auth = require("../../../shared/middlewares/auth.middleware")
const role = require("../../../shared/middlewares/role.middleware")
const { uploadInformasiFoto } = require("../../../shared/middlewares/upload.middleware")

// ============================================================================
// /api/informasi
// ----------------------------------------------------------------------------
// READ untuk semua user login.
// WRITE (create/update/hide/publish/delete) khusus Super Admin.
// Upload foto via multipart/form-data field "foto" (jpg/jpeg/png/webp, ≤ 5MB).
// ============================================================================

router.use(auth)

const onlySuperAdmin = role(["super_admin"])

// READ - publik (semua role login)
router.get("/", controller.getInformasi)
router.get("/:id", controller.getDetail)

// Super Admin: lihat semua (termasuk hidden), filter via ?status=
router.get("/admin/list", onlySuperAdmin, controller.listForAdmin)

// CREATE
router.post(
  "/",
  onlySuperAdmin,
  uploadInformasiFoto.single("foto"),
  controller.create
)

// UPDATE (semua field opsional)
router.put(
  "/:id",
  onlySuperAdmin,
  uploadInformasiFoto.single("foto"),
  controller.update
)

// HIDE / PUBLISH
router.put("/:id/hide", onlySuperAdmin, controller.hide)
router.put("/:id/publish", onlySuperAdmin, controller.publish)

// DELETE (soft)
router.delete("/:id", onlySuperAdmin, controller.remove)

module.exports = router
