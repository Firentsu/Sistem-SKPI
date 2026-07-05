const express = require("express")
const router = express.Router()
const ctrl = require("../controllers/pengajuanSelfEdit.controller")
const auth = require("../../../shared/middlewares/auth.middleware")

router.use(auth)

// Edit pengajuan PEMBERIAN saat pending — pengaju sendiri (dosen/admin/mahasiswa)
router.put("/pemberian/:id", ctrl.editPemberian)

// Edit pengajuan POTONGAN saat pending — pengaju sendiri (dosen/admin)
router.put("/potongan/:id", ctrl.editPotongan)

module.exports = router
