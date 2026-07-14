const express = require("express")
const router = express.Router()

const authController = require("../controllers/auth.controller")
const validate = require("../../../shared/middlewares/validate.middleware")

// ===============================
// 🔒 LOGIN
router.post(
  "/login",
  validate({
    username: "required|string",
    password: "required|string|min:6"
  }),
  authController.login
)

module.exports = router 