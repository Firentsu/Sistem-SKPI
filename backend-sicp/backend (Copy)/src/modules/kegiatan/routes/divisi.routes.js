const express = require("express")
const router = express.Router()
const controller = require("../controllers/divisi.controller")
const auth = require("../../../shared/middlewares/auth.middleware")
const role = require("../../../shared/middlewares/role.middleware")
const accessSuper = require("../../../shared/middlewares/accessSuper.middleware")

// Kelola divisi butuh akses "kelola_kegiatan" (super_admin auto-bypass)
const guard = [auth, role(["admin", "super_admin"]), accessSuper("kelola_kegiatan")]

router.get("/", ...guard, controller.getDivisi)
router.get("/:id", ...guard, controller.getDivisiById)
router.post("/", ...guard, controller.createDivisi)
router.put("/:id", ...guard, controller.updateDivisi)
router.delete("/:id", ...guard, controller.deleteDivisi)

module.exports = router
