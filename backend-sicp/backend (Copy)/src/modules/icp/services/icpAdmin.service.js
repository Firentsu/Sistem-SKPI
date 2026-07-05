const db = require("../../../shared/config/db")
const mahasiswaModel = require("../../akademik/models/mahasiswa.model")
const userLimitService = require("../../unit/services/userLimit.service")
const validateNamaIcp = require("../../../shared/utils/validateNamaIcp")
const semesterService = require("../../akademik/services/semester.service")
const finalValidatorPolicy = require("../../../shared/policies/finalValidator.policy")
const { logAudit } = require("../../audit/services/audit.service")

// ===============================
const toNumber = (val) => {

  const num = Number(val)

  if (
    isNaN(num) ||
    num <= 0
  ) {
    throw new Error(
      "Point tidak valid"
    )
  }

  return num
}

// ===============================
// CREATE PENGAJUAN PENDING-VALIDASI
// ----------------------------------------------------------------
// ATURAN: Aksi admin (manual ICP / kepanitiaan ICP) TIDAK langsung
// masuk ledger. Admin hanya membuat icp_pengajuan berstatus
// 'approved' (Tier 1 selesai oleh admin), lalu WAJIB divalidasi
// final oleh Super Admin (Tier 2). Ledger ditulis saat super admin
// menjalankan validasiPengajuan.
// ----------------------------------------------------------------
const createPengajuanMenungguValidasi =
  async ({
    conn,
    mahasiswa_id,
    unit_id,
    kategori_id,
    nama_icp_id,
    semester_id,
    point,
    deskripsi,
    user,
    target_admin_final_id = null,
    source_label
  }) => {

    const [result] =
      await conn.query(
        `
        INSERT INTO icp_pengajuan (
          mahasiswa_id,
          unit_id,
          kategori_id,
          nama_icp_id,
          semester_id,
          point,
          deskripsi,
          status,
          pemberi_icp_id,
          approved_by,
          approved_at,
          target_role,
          target_admin_final_id
        )
        VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          'approved',
          ?, ?, NOW(),
          'super_admin',
          ?
        )
        `,
        [
          mahasiswa_id,
          unit_id,
          kategori_id,
          nama_icp_id,
          semester_id,
          point,
          deskripsi,
          user.id,
          user.id,
          target_admin_final_id || null
        ]
      )

    const pengajuan_id =
      result.insertId

    // AUDIT — TIDAK ada penulisan ledger di sini
    await logAudit({
      user_id: user.id,
      role: user.role,
      action: "ADMIN_AJUKAN_ICP",
      target_table: "icp_pengajuan",
      target_id: pengajuan_id,
      detail: {
        mahasiswa_id,
        pengajuan_id,
        point,
        source_label,
        status: "approved",
        target_admin_final_id: target_admin_final_id || null,
        menunggu: "validasi_final_super_admin"
      },
      conn
    })

    return pengajuan_id
  }

// ===============================
// ITEM Sys-1 — cek keanggotaan unit (pemberi non-SA wajib member unit).
const isMemberOfUnit = async (userId, unitId, conn) => {
  const [r] = await conn.query(
    `SELECT 1 FROM user_unit_member WHERE user_id=? AND unit_id=? LIMIT 1`,
    [userId, unitId])
  return r.length > 0
}
const userHasAccess = async (userId, key, conn) => {
  const [r] = await conn.query(
    `SELECT 1 FROM admin_access WHERE user_id=? AND access_key=? LIMIT 1`,
    [userId, key])
  return r.length > 0
}

const baseInsert = async (
  payload,
  user
) => {

  const conn =
    await db.getConnection()

  try {

    await conn.beginTransaction()

    // ===============================
    // ROLE

    if (
      ![
        "admin",
        "super_admin"
      ].includes(user.role)
    ) {
      throw new Error(
        "Hanya admin / super admin"
      )
    }

    // ===============================
    // PAYLOAD

    const {
      mahasiswa_id,
      unit_id,
      kategori_id,
      nama_icp_id,
      point,
      deskripsi,
      target_admin_final_id
    } = payload

    // ===============================
    // REQUIRED

    if (!mahasiswa_id) {
      throw new Error("mahasiswa_id wajib")
    }

    if (!unit_id) {
      throw new Error("unit_id wajib")
    }

    if (!kategori_id) {
      throw new Error("kategori_id wajib")
    }

    if (!nama_icp_id) {
      throw new Error("nama_icp_id wajib")
    }

    if (!deskripsi) {
      throw new Error("deskripsi wajib")
    }

    // ITEM Sys-1 — keanggotaan unit. Super Admin bebas pakai unit mana pun;
    // selain SA wajib menjadi anggota unit tersebut.
    if (user.role !== "super_admin") {
      const member = await isMemberOfUnit(user.id, unit_id, conn)
      if (!member) {
        throw new Error(
          "Anda bukan anggota unit ini — tidak bisa memberi ICP pada unit ini")
      }
    }

    // ITEM Sys-2 — self-give: jika pemberi adalah Super Admin atau Admin
    // Akses-Super (validasi_final), target validasi final = dirinya sendiri
    // tanpa perlu memilih. Selain itu WAJIB pilih target.
    let finalTarget = target_admin_final_id
    const selfFinal =
      user.role === "super_admin" ||
      await userHasAccess(user.id, "validasi_final", conn)

    if (!finalTarget && selfFinal) {
      finalTarget = user.id
    }
    if (!finalTarget) {
      throw new Error(
        "target_admin_final_id wajib — pilih Super Admin / Admin Akses-Super yang akan memvalidasi"
      )
    }

    // Validasi validator final yang dipilih benar-benar berhak.
    await finalValidatorPolicy.assertValidFinalTarget(
      finalTarget,
      conn
    )

    // ===============================
    // SEMESTER AKTIF

    const activeSemester =
      await semesterService.getActiveSemester(conn)

    const semester_id =
      activeSemester.id

    // ===============================
    // VALIDASI MAHASISWA

    const mahasiswa =
      await mahasiswaModel.getActiveById(
        mahasiswa_id,
        conn
      )

    if (!mahasiswa) {
      throw new Error(
        "Mahasiswa tidak valid"
      )
    }

    // ===============================
    // VALIDASI NAMA ICP

    await validateNamaIcp({
      unit_id,
      kategori_id,
      nama_icp_id
    })

    // ===============================
    // POINT

    const numericPoint =
      toNumber(point)

    // ===============================
    // LIMIT

    await userLimitService.checkLimit({
      user_id: user.id,
      semester_id,
      limit_type:
        "beri_partisipasi",
      unit_id,
      tambahan: 1,
      conn
    })

    // ===============================
    // CREATE — status 'approved', menunggu super admin

    const pengajuan_id =
      await createPengajuanMenungguValidasi({
        conn,
        mahasiswa_id,
        unit_id,
        kategori_id,
        nama_icp_id,
        semester_id,
        point: numericPoint,
        deskripsi,
        user,
        target_admin_final_id: finalTarget,
        source_label: "admin_manual"
      })

    await conn.commit()

    return {
      id: pengajuan_id,
      status: "approved",
      keterangan:
        "Manual ICP diajukan. Menunggu validasi final Super Admin."
    }

  } catch (err) {

    await conn.rollback()
    throw err

  } finally {

    conn.release()

  }
}

// ===============================
const createManual = (
  payload,
  user
) => {

  return baseInsert(
    payload,
    user
  )
}

// ===============================
const createKepanitiaan =
  async (
    payload,
    user
  ) => {

    const conn =
      await db.getConnection()

    try {

      await conn.beginTransaction()

      // ===============================
      // ROLE

      if (
        ![
          "admin",
          "super_admin"
        ].includes(user.role)
      ) {
        throw new Error(
          "Hanya admin / super admin"
        )
      }

      // ===============================
      // ACCESS KEGIATAN
      // FINAL CLEANUP — single source of truth = admin_access table
      // via req.user.access (diisi auth.middleware).

      if (user.role === "admin") {
        const ok = !!(user.access && user.access.kelola_kegiatan)
        if (!ok) {
          throw new Error(
            "Admin tidak memiliki akses kelola kegiatan"
          )
        }
      }

      // ===============================
      // PAYLOAD

      const {
        kegiatan_id,
        kategori_id,
        nama_icp_id,
        point,
        deskripsi,
        target_admin_final_id
      } = payload

      // ===============================
      // REQUIRED

      if (!kegiatan_id) {
        throw new Error("kegiatan_id wajib")
      }

      if (!kategori_id) {
        throw new Error("kategori_id wajib")
      }

      if (!nama_icp_id) {
        throw new Error("nama_icp_id wajib")
      }

      if (!deskripsi) {
        throw new Error("deskripsi wajib")
      }

      // ===============================
      // SEMESTER AKTIF

      const activeSemester =
        await semesterService.getActiveSemester(conn)

      const semester_id =
        activeSemester.id

      // ===============================
      // POINT

      const numericPoint =
        toNumber(point)

      // ===============================
      // KEGIATAN

      const [[kegiatan]] =
        await conn.query(
          `
          SELECT
            id,
            unit_id
          FROM kegiatan
          WHERE id = ?
          `,
          [kegiatan_id]
        )

      if (!kegiatan) {
        throw new Error(
          "Kegiatan tidak ditemukan"
        )
      }

      // ===============================
      // VALIDASI NAMA ICP

      await validateNamaIcp({
        unit_id:
          kegiatan.unit_id,
        kategori_id,
        nama_icp_id
      })

      // ===============================
      // PANITIA

      const [members] =
        await conn.query(
          `
          SELECT mahasiswa_id
          FROM panitia_kegiatan
          WHERE kegiatan_id = ?
          AND status = 'approved'
          AND removed_at IS NULL
          `,
          [kegiatan_id]
        )

      if (!members.length) {
        throw new Error(
          "Tidak ada panitia aktif"
        )
      }

      // ===============================
      // LIMIT

      await userLimitService.checkLimit({
        user_id: user.id,
        semester_id,
        limit_type:
          "beri_partisipasi",
        unit_id: kegiatan.unit_id,
        tambahan:
          members.length,
        conn
      })

      // ===============================
      // VALIDATOR FINAL (opsional untuk kepanitiaan) — validasi jika dikirim

      if (target_admin_final_id) {
        await finalValidatorPolicy.assertValidFinalTarget(
          target_admin_final_id,
          conn
        )
      }

      // ===============================
      // INSERT LOOP — semua menunggu validasi super admin

      const results = []

      for (const m of members) {

        const pengajuan_id =
          await createPengajuanMenungguValidasi({
            conn,
            mahasiswa_id:
              m.mahasiswa_id,
            unit_id:
              kegiatan.unit_id,
            kategori_id,
            nama_icp_id,
            semester_id,
            point:
              numericPoint,
            deskripsi,
            user,
            target_admin_final_id,
            source_label:
              "admin_kepanitiaan"
          })

        results.push(
          pengajuan_id
        )
      }

      await conn.commit()

      return {
        total:
          results.length,
        ids: results,
        status: "approved",
        keterangan:
          "ICP kepanitiaan diajukan. Menunggu validasi final Super Admin."
      }

    } catch (err) {

      await conn.rollback()
      throw err

    } finally {

      conn.release()

    }
  }

module.exports = {
  createManual,
  createKepanitiaan
} 