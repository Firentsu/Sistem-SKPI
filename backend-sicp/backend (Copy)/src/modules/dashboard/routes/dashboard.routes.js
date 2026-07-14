const express = require("express")
const router = express.Router()

const dashboardController = require("../controllers/dashboard.controller")
const authMiddleware = require("../../../shared/middlewares/auth.middleware")

router.get("/", authMiddleware, dashboardController.getDashboard)

module.exports = router 