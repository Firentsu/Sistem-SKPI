const express = require("express")
const router = express.Router()

const kegiatanController = require("../controllers/kegiatan.controller")

const authMiddleware = require("../../../shared/middlewares/auth.middleware")
const roleMiddleware = require("../../../shared/middlewares/role.middleware")
const accessSuper = require("../../../shared/middlewares/accessSuper.middleware")

const guardKelolaKegiatan = accessSuper("kelola_kegiatan")

//Pengelola kegiatan
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["admin", "super_admin"]),
  guardKelolaKegiatan,
  kegiatanController.createKegiatan
)

router.get(
  "/",
  authMiddleware,
  kegiatanController.getAllKegiatan
)

//lengkapi crud
router.get(
  "/:id",
  authMiddleware,
  kegiatanController.getKegiatanById
)
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin", "super_admin"]),
  guardKelolaKegiatan,
  kegiatanController.updateKegiatan
)
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin", "super_admin"]),
  guardKelolaKegiatan,
  kegiatanController.deleteKegiatan
)

router.put(
  "/:id/buka-pendaftaran",
  authMiddleware,
  roleMiddleware(["admin", "super_admin"]),
  guardKelolaKegiatan,
  kegiatanController.dibukaPendaftaran
)

router.put(
  "/:id/tutup-pendaftaran",
  authMiddleware,
  roleMiddleware(["admin", "super_admin"]),
  guardKelolaKegiatan,
  kegiatanController.tutupPendaftaran
)

router.put(
  "/:id/mulai",
  authMiddleware,
  roleMiddleware(["admin", "super_admin"]),
  guardKelolaKegiatan,
  kegiatanController.mulaiKegiatan
)

router.put(
  "/:id/selesai",
  authMiddleware,
  roleMiddleware(["admin", "super_admin"]),
  guardKelolaKegiatan,
  kegiatanController.selesaiKegiatan
)

router.put(
  "/:id/batal",
  authMiddleware,
  roleMiddleware(["admin", "super_admin"]),
  guardKelolaKegiatan,
  kegiatanController.batalkanKegiatan
)

router.put(
  "/:id/sembunyikan",
  authMiddleware,
  roleMiddleware(["admin", "super_admin"]),
  guardKelolaKegiatan,
  kegiatanController.sembunyikanKegiatan
)

router.put(
  "/:id/tampilkan",
  authMiddleware,
  roleMiddleware(["admin", "super_admin"]),
  guardKelolaKegiatan,
  kegiatanController.tampilkanKegiatan
)

module.exports = router
