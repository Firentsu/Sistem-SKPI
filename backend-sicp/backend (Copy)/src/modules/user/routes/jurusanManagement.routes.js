const express = require("express");

const router = express.Router();

const controller = require("../controllers/jurusanManagement.controller");

const authMiddleware =
  require("../../../shared/middlewares/auth.middleware");

const roleMiddleware =
  require("../../../shared/middlewares/role.middleware");

router.put(
  "/dosen/:id",
  authMiddleware,
  roleMiddleware(["super_admin"]),
  controller.pindahkanJurusanDosen
);

router.put(
  "/admin/:id",
  authMiddleware,
  roleMiddleware(["super_admin"]),
  controller.pindahkanJurusanAdmin
);

module.exports = router; 