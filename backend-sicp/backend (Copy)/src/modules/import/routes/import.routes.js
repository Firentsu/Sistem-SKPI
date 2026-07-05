const express = require("express")
const router = express.Router()
const controller = require("../controllers/import.controller")
const auth = require("../../../shared/middlewares/auth.middleware")
const role = require("../../../shared/middlewares/role.middleware")
const { uploadExcel } = require("../../../shared/middlewares/upload.middleware")

router.post("/mahasiswa",   auth, role(["super_admin"]),          uploadExcel.single("file"), controller.importMahasiswa)
router.post("/dosen",       auth, role(["super_admin"]),          uploadExcel.single("file"), controller.importDosen)
router.post("/admin",       auth, role(["super_admin"]),          uploadExcel.single("file"), controller.importAdmin)
router.post("/mata-kuliah", auth, role(["super_admin"]),          uploadExcel.single("file"), controller.importMataKuliah)
router.post("/potongan",    auth, role(["admin","super_admin"]),  uploadExcel.single("file"), controller.importPotongan)

module.exports = router
