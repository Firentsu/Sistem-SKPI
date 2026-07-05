const express = require("express")
const router = express.Router()
const ctrl = require("../controllers/riwayat.controller")
const auth = require("../../../shared/middlewares/auth.middleware")
const role = require("../../../shared/middlewares/role.middleware")
const accessSuper = require("../../../shared/middlewares/accessSuper.middleware")

router.use(auth)

router.get("/kegiatan",
  role(["admin", "super_admin"]), accessSuper("kelola_kegiatan"),
  ctrl.riwayatKegiatan)

router.get("/login",
  role(["super_admin"]),
  ctrl.riwayatLogin)

router.get("/pemberian-validasi",
  role(["super_admin"]),
  ctrl.riwayatPemberianValidasi)

router.get("/mandiri",
  role(["admin", "super_admin"]),
  ctrl.riwayatMandiri)

router.get("/validasi",
  role(["admin", "super_admin"]),
  ctrl.riwayatValidasi)

router.get("/pengajuan-saya",
  role(["admin", "dosen", "super_admin"]),
  ctrl.riwayatPengajuanSaya)

router.get("/transaksi",
  role(["admin", "super_admin"]),
  ctrl.riwayatTransaksi)

router.get("/potongan-all",
  role(["admin", "super_admin"]),
  ctrl.riwayatPotonganAll)

router.get("/validasi-all",
  role(["admin", "super_admin"]),
  ctrl.riwayatValidasiAll)

module.exports = router
