const router = require("express").Router()
const ctrl = require("../controllers/jurusan.controller")
const auth = require("../../../shared/middlewares/auth.middleware")
const role = require("../../../shared/middlewares/role.middleware")

router.use(auth)

// LIHAT jurusan — semua user login (admin biasa, dosen, dll) bisa lihat & pakai
router.get("/", role(["super_admin", "admin", "dosen", "mahasiswa"]), ctrl.getAll)

// CREATE / UPDATE / DELETE — hanya super_admin
router.post("/", role(["super_admin"]), ctrl.create)
router.put("/:id", role(["super_admin"]), ctrl.update)
router.delete("/:id", role(["super_admin"]), ctrl.remove)

module.exports = router 