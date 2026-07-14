const db = require("../../../shared/config/db")

const mahasiswaModel =
  require("../../akademik/models/mahasiswa.model")

const userLimitService =
  require("../../unit/services/userLimit.service")

const validateNamaIcp =
  require("../../../shared/utils/validateNamaIcp")

const semesterService =
  require("../../akademik/services/semester.service")

const { logAudit } =
  require("../../audit/services/audit.service")

const finalValidatorPolicy =
  require("../../../shared/policies/finalValidator.policy")

// ITEM Sys-1 — keanggotaan unit / pengampu mata kuliah
const isMemberOfUnit = async (userId, unitId, conn) => {
  const [r] = await conn.query(
    `SELECT 1 FROM user_unit_member WHERE user_id=? AND unit_id=? LIMIT 1`,
    [userId, unitId])
  return r.length > 0
}
const isPengampu = async (userId, mkId, conn) => {
  const [r] = await conn.query(
    `SELECT 1 FROM mata_kuliah_dosen WHERE user_id=? AND mata_kuliah_id=? LIMIT 1`,
    [userId, mkId])
  return r.length > 0
}
const userHasAccess = async (userId, key, conn) => {
  const [r] = await conn.query(
    `SELECT 1 FROM admin_access WHERE user_id=? AND access_key=? LIMIT 1`,
    [userId, key])
  return r.length > 0
}

const {
  ICP_SOURCE
} = require("../../../shared/constants/icpSourceType")

// ===============================
const toNumber = (
  val,
  field = "Field"
) => {

  const num = Number(val)

  if (
    isNaN(num) ||
    num <= 0
  ) {
    throw new Error(
      `${field} tidak valid`
    )
  }

  return num
}

// ===============================
// BASE INSERT
// ----------------------------------------------------------------
// ATURAN: Aksi dosen (beri ICP kelas / partisipasi) TIDAK langsung
// masuk ledger. Dosen hanya membuat icp_pengajuan berstatus
// 'approved' (Tier 1 selesai), lalu WAJIB divalidasi final oleh
// Super Admin (Tier 2). Ledger baru ditulis saat super admin
// melakukan validasiPengajuan.
// ----------------------------------------------------------------
const baseInsert = async (
  payload,
  user,
  limit_type,
  source_type
) => {

  const conn =
    await db.getConnection()

  try {

    await conn.beginTransaction()

    // ===============================
    // ROLE — dukung peran ganda: lolos bila salah satu role = dosen
    const userRoles =
      Array.isArray(user.roles) && user.roles.length
        ? user.roles
        : [user.role]

    if (
      !userRoles.includes("dosen")
    ) {
      throw new Error(
        "Hanya dosen yang boleh memberikan ICP"
      )
    }

    // ===============================
    // PAYLOAD

    const {
      mahasiswa_id,
      unit_id,
      mata_kuliah_id,
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

    // P7: pemberian via mata kuliah wajib menyertakan mata_kuliah_id
    if (limit_type === "beri_kelas_mk" && !mata_kuliah_id) {
      throw new Error("mata_kuliah_id wajib untuk pemberian ICP via mata kuliah")
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

    // ITEM Sys-1 — pemberi harus terikat: kelas → pengampu MK; unit → member.
    if (limit_type === "beri_kelas_mk") {
      const peng = await isPengampu(user.id, mata_kuliah_id, conn)
      if (!peng) {
        throw new Error("Anda bukan pengampu mata kuliah ini — tidak bisa memberi ICP kelas")
      }
    } else {
      const member = await isMemberOfUnit(user.id, unit_id, conn)
      if (!member) {
        throw new Error("Anda bukan anggota unit ini — tidak bisa memberi ICP pada unit ini")
      }
    }

    // ===============================
    // POINT

    const numericPoint =
      toNumber(point, "Point")

    // ===============================
    // SEMESTER AKTIF
    // Aksi hanya boleh pada semester aktif. Pengajuan otomatis
    // memakai semester aktif saat ini.

    const activeSemester =
      await semesterService.getActiveSemester(conn)

    const semester_id =
      activeSemester.id

    // ===============================
    // MAHASISWA

    const mahasiswa =
      await mahasiswaModel.getActiveById(
        mahasiswa_id,
        conn
      )

    if (!mahasiswa) {
      throw new Error(
        "Mahasiswa tidak valid / tidak aktif"
      )
    }

    // ===============================
    // VALIDASI NAMA ICP

    await validateNamaIcp({
      unit_id,
      kategori_id,
      nama_icp_id,
      target_user_id: user.id
    })

    // ===============================
    // LIMIT

    await userLimitService.checkLimit({
      user_id: user.id,
      semester_id,
      limit_type,
      unit_id,
      mata_kuliah_id,
      mahasiswa_id,
      tambahan: numericPoint,
      conn
    })

    // ===============================
    // INSERT PENGAJUAN
    // status = 'approved' → Tier 1 (dosen) selesai.
    // approved_by  = dosen (pelaku Tier 1)
    // validated_by = NULL  → menunggu Super Admin (Tier 2)
    // target_role  = 'super_admin' → tujuan validasi final

    // ===============================
    // VALIDATOR FINAL (opsional) — validasi jika dosen mengirim pilihannya

    // ITEM Sys-2 — target validasi final WAJIB (tak ada jalur tanpa target).
    // Jika dosen kebetulan punya validasi_final / super_admin → target = diri.
    let finalTarget = target_admin_final_id
    const selfFinal =
      user.role === "super_admin" ||
      await userHasAccess(user.id, "validasi_final", conn)
    if (!finalTarget && selfFinal) {
      finalTarget = user.id
    }
    if (!finalTarget) {
      throw new Error(
        "target_admin_final_id wajib — pilih Super Admin / Admin Akses-Super yang akan memvalidasi")
    }
    await finalValidatorPolicy.assertValidFinalTarget(finalTarget, conn)

    const [result] =
      await conn.query(
        `
        INSERT INTO icp_pengajuan
        (
          mahasiswa_id,
          unit_id,
          mata_kuliah_id,
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
        VALUES
        (
          ?, ?, ?, ?, ?, ?, ?, ?,
          'approved',
          ?, ?, NOW(),
          'super_admin',
          ?
        )
        `,
        [
          mahasiswa_id,
          unit_id,
          mata_kuliah_id || null,
          kategori_id,
          nama_icp_id,
          semester_id,
          numericPoint,
          deskripsi,
          user.id,
          user.id,
          finalTarget || null
        ]
      )

    const pengajuan_id =
      result.insertId

    // ===============================
    // AUDIT — pengajuan menunggu validasi super admin
    // CATATAN: TIDAK ada penulisan ledger di sini.

    await logAudit({
      user_id: user.id,
      role: user.role,
      action: "DOSEN_AJUKAN_ICP",
      target_table: "icp_pengajuan",
      target_id: pengajuan_id,
      detail: {
        mahasiswa_id,
        pengajuan_id,
        point: numericPoint,
        source_type,
        status: "approved",
        menunggu: "validasi_final_super_admin"
      },
      conn
    })

    await conn.commit()

    return {
      id: pengajuan_id,
      status: "approved",
      keterangan:
        "ICP diajukan. Menunggu validasi final Super Admin."
    }

  } catch (err) {

    await conn.rollback()
    throw err

  } finally {

    conn.release()

  }
}

// ===============================
const createKelas = (
  payload,
  user
) => {

  return baseInsert(
    payload,
    user,
    "beri_kelas_mk",
    ICP_SOURCE.DOSEN_KELAS
  )
}

// ===============================
const createPartisipasi = (
  payload,
  user
) => {

  return baseInsert(
    payload,
    user,
    "beri_partisipasi",
    ICP_SOURCE.DOSEN_PARTISIPASI
  )
}

module.exports = {
  createKelas,
  createPartisipasi
} 