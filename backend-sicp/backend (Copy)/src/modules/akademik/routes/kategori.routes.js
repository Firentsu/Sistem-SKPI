const express = require("express")
const router = express.Router()

const ctrl = require("../controllers/kategori.controller")
const auth = require("../../../shared/middlewares/auth.middleware")
const role = require("../../../shared/middlewares/role.middleware")
const accessSuper = require("../../../shared/middlewares/accessSuper.middleware")

// ===============================
// READ (ALL AUTH)
router.get("/", auth, ctrl.getAllKategori)
router.get("/:id", auth, ctrl.getKategoriById)

// ===============================
// WRITE — super_admin atau admin dgn akses kelola_unit_kategori
router.post("/", auth, role(["admin", "super_admin"]), accessSuper("kelola_unit_kategori"), ctrl.createKategori)
router.put("/:id", auth, role(["admin", "super_admin"]), accessSuper("kelola_unit_kategori"), ctrl.updateKategori)

// 🔥 DEACTIVATE (SOFT)
router.put("/:id/deactivate", auth, role(["admin", "super_admin"]), accessSuper("kelola_unit_kategori"), ctrl.deleteKategori)

// 🔥 POIN 2: REACTIVATE
router.put("/:id/reactivate", auth, role(["admin", "super_admin"]), accessSuper("kelola_unit_kategori"), ctrl.reactivateKategori)

// 🔥 POIN 3: HAPUS PERMANEN (hard delete) — super_admin / admin dgn key kelola_unit_kategori
router.delete("/:id", auth, role(["admin", "super_admin"]), accessSuper("kelola_unit_kategori"), ctrl.hardDeleteKategori)

module.exports = router 