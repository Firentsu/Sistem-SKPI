const express = require("express")
const router = express.Router()

const controller = require("../controllers/icpTransaction.controller")
const auth = require("../../../shared/middlewares/auth.middleware")
const role = require("../../../shared/middlewares/role.middleware")
const idempotency = require("../../../shared/middlewares/idempotency")

// ===============================
// VALIDASI CONTROLLER
if (
  typeof controller.createTransaction !== "function" ||
  typeof controller.getMyTransaction !== "function"
) {
  throw new Error("Controller ICP Transaction tidak valid")
}

// ===============================
// 🔒 SUPER ADMIN ONLY (MANUAL ICP)
router.post(
  "/",
  auth,
  role(["super_admin"]),
  idempotency,
  controller.createTransaction
)

// ===============================
// 👤 GET MY TRANSACTION
router.get(
  "/",
  auth,
  controller.getMyTransaction
)

module.exports = router