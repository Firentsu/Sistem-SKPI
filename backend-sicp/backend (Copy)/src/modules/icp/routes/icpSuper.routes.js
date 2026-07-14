const express = require("express")
const router = express.Router()

const controller = require("../controllers/icpSuper.controller")
const auth = require("../../../shared/middlewares/auth.middleware")
const role = require("../../../shared/middlewares/role.middleware")
const idempotency = require("../../../shared/middlewares/idempotency")

router.use(auth, role(["super_admin"]))

// ===============================
// 🔥 SUPER ICP MANUAL (UNLIMITED)
router.post("/manual", idempotency, controller.createSuperManual)

module.exports = router 