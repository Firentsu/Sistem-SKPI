const express = require("express")
const router = express.Router()

const controller = require("../controllers/icpAdmin.controller")

const auth = require("../../../shared/middlewares/auth.middleware")
const role = require("../../../shared/middlewares/role.middleware")
const accessSuper = require("../../../shared/middlewares/accessSuper.middleware")
const idempotency = require("../../../shared/middlewares/idempotency")

router.use(auth, role(["admin", "super_admin"]))

// ICP MANUAL
router.post("/manual", idempotency, controller.createManual)

// ICP KEPANITIAAN — wajib akses "kelola_kegiatan"
router.post(
  "/kepanitiaan",
  accessSuper("kelola_kegiatan"),
  idempotency,
  controller.createKepanitiaan
)

module.exports = router