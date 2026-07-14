const express = require("express")
const router = express.Router()

const ctrl = require("../controllers/icpPengajuan.controller")
const auth = require("../../../shared/middlewares/auth.middleware")
const role = require("../../../shared/middlewares/role.middleware")
const idempotency = require("../../../shared/middlewares/idempotency")

// ===============================
router.use(auth, role(["mahasiswa"]))

// ===============================
// CREATE
router.post("/", idempotency, ctrl.create)

// ===============================
// HISTORY
router.get("/history", ctrl.history)

// ===============================
// INBOX
router.get("/inbox", ctrl.inbox)

// ===============================
module.exports = router 