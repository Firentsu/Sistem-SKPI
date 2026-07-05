const express = require("express")
const router = express.Router()

const ctrl = require("../controllers/semester.controller")
const auth = require("../../../shared/middlewares/auth.middleware")
const role = require("../../../shared/middlewares/role.middleware")

// ===============================
// PUBLIC AUTH (READ)
router.get("/", auth, ctrl.getAllSemester)
router.get("/active", auth, ctrl.getActive)

// ===============================
// SUPER ADMIN ONLY (WRITE)
router.post("/", auth, role(["super_admin"]), ctrl.createSemester)
router.put("/:id/activate", auth, role(["super_admin"]), ctrl.setActiveSemester)

// REVISI 11POIN #10: nyalakan semester lama sementara (edit-window)
router.put("/:id/edit-window", auth, role(["super_admin"]), ctrl.openEditWindow)
router.delete("/:id/edit-window", auth, role(["super_admin"]), ctrl.closeEditWindow)

module.exports = router 