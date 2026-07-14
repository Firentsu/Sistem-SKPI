const db = require("../../../shared/config/db")
const model = require("../models/panitia.model")
const { logAudit } = require("../../audit/services/audit.service")

//Lihat Semua Panitia
const getAllPanitia = async () => {
  return await model.getAllPanitiaWithDetail()
}

const validateCO = async (pendaftaran_id, user) => {
  if (!user.mahasiswa_id) {
    throw new Error("Akses ditolak")
  }

  const data = await model.findCOByPendaftaranId(pendaftaran_id)

  if (!data) {
    throw new Error("Data tidak ditemukan")
  }

  if (Number(data.co_mahasiswa_id) !== Number(user.mahasiswa_id)) {
    throw new Error("Akses ditolak (bukan CO)")
  }
}

const validateCODivisi = async (divisi_id, user, conn = null) => {
  if (!user.mahasiswa_id) {
    throw new Error("Akses ditolak")
  }

  const runner = conn || db

  const [[divisi]] = await runner.query(
    `SELECT co_mahasiswa_id FROM divisi_kegiatan WHERE id = ?`,
    [divisi_id]
  )

  if (!divisi) {
    throw new Error("Divisi tidak ditemukan")
  }

  if (Number(divisi.co_mahasiswa_id) !== Number(user.mahasiswa_id)) {
    throw new Error("Akses ditolak (bukan CO divisi ini)")
  }
}

const removeAnggotaByAdmin = async ({ panitia_id, user, reason }) => {
  if (!user || !user.id) throw new Error("User tidak valid")
  
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    const data = await model.findPanitiaWithKegiatanForUpdate(panitia_id, conn)
    if (!data) throw new Error("Panitia tidak ditemukan")

    if (data.status !== "approved") {
      throw new Error("Belum menjadi panitia")
    }

    if (data.removed_at) {
      throw new Error("Sudah dikeluarkan")
    }

    if (data.kegiatan_status === "selesai") {
      throw new Error("Tidak bisa mengeluarkan anggota setelah kegiatan selesai")
    }

    const finalReason = reason || "Dikeluarkan admin"
    const actorId = Number(user.id)

    await model.softRemovePanitia({
      id: panitia_id,
      actor_id: actorId,
      reason: finalReason
    }, conn)

    await model.insertPanitiaLog({
      panitia_id,
      aksi: "remove",
      actor_id: actorId,
      keterangan: reason || "Remove anggota"
    }, conn)

    await logAudit({
      user_id: actorId,
      role: user.role,
      action: "REMOVE_PANITIA",
      target_table: "panitia_kegiatan",
      target_id: panitia_id,
      detail: {
        mahasiswa_id: data.mahasiswa_id,
        kegiatan_id: data.kegiatan_id,
        reason: finalReason
      },
      conn
    })

    await conn.commit()

    return { id: panitia_id, status: "cancelled" }

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

const cancelByMahasiswa = async ({ panitia_id, user }) => {
  if (!user?.mahasiswa_id) {
    throw new Error("User bukan mahasiswa")
  }

  const conn = await db.getConnection()
  const userId = Number(user.mahasiswa_id)

  try {
    await conn.beginTransaction()

    const data = await model.findPanitiaWithKegiatanForUpdate(panitia_id, conn)
    if (!data) throw new Error("Data panitia tidak ditemukan")

    if (Number(data.mahasiswa_id) !== userId) {
      throw new Error("Akses ditolak")
    }

    if (data.status !== "approved") {
      throw new Error("Belum menjadi panitia")
    }

    if (data.removed_at) {
      throw new Error("Sudah tidak aktif")
    }

    if (data.kegiatan_status === "selesai") {
      throw new Error("Tidak bisa keluar setelah kegiatan selesai")
    }

    await model.softRemovePanitia({
      id: panitia_id,
      actor_id: userId,
      reason: "Pembatalan oleh mahasiswa"
    }, conn)

    await model.insertPanitiaLog({
      panitia_id,
      aksi: "cancel",
      actor_id: userId,
      keterangan: "Mahasiswa keluar dari panitia"
    }, conn)

    await logAudit({
      user_id: user.id,
      role: user.role,
      action: "CANCEL_PANITIA",
      target_table: "panitia_kegiatan",
      target_id: panitia_id,
      detail: { mahasiswa_id: userId },
      conn
    })

    await conn.commit()

    return { id: panitia_id, status: "cancelled" }

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

const daftarPanitia = async (data, user) => {
  const { divisi_id } = data

  if (!divisi_id) throw new Error("divisi_id wajib diisi")
  if (!user.mahasiswa_id) throw new Error("Data mahasiswa tidak ditemukan")

  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    const mahasiswa_id = Number(user.mahasiswa_id)

    const div = await model.findDivisi(divisi_id, conn)
    if (!div) throw new Error("Divisi tidak ditemukan")

    const kegiatan = await model.findKegiatan(div.kegiatan_id, conn)
    if (!kegiatan) throw new Error("Kegiatan tidak ditemukan")

    if (kegiatan.status !== "pendaftaran_dibuka") {
      throw new Error("Pendaftaran panitia belum dibuka / sudah ditutup")
    }

    //hormati jadwal pendaftaran (WIB): tolak bila sudah ditutup
    //manual atau lewat jadwal penutupan.
    if (kegiatan.pendaftaran_closed_at) {
      throw new Error("Pendaftaran panitia sudah ditutup")
    }
    if (kegiatan.pendaftaran_selesai &&
        new Date() > new Date(kegiatan.pendaftaran_selesai)) {
      throw new Error("Pendaftaran panitia sudah berakhir sesuai jadwal")
    }

    const isDuplicateKegiatan = await model.checkDuplicateKegiatan(
      mahasiswa_id, div.kegiatan_id, conn
    )
    if (isDuplicateKegiatan) throw new Error("Sudah mendaftar di kegiatan ini")

    const isDuplicateDivisi = await model.checkDuplicateDivisi(
      mahasiswa_id, divisi_id, conn
    )
    if (isDuplicateDivisi) throw new Error("Sudah mendaftar di divisi ini")

    if (div.kuota > 0) {
      const total = await model.countPanitia(divisi_id, conn)
      if (total >= div.kuota) throw new Error("Kuota divisi sudah penuh")
    }

    const insertId = await model.insertPendaftaran(mahasiswa_id, divisi_id, conn)

    await logAudit({
      user_id: user.id,
      role: user.role,
      action: "DAFTAR_PANITIA",
      target_table: "pendaftaran_panitia",
      target_id: insertId,
      detail: { mahasiswa_id, divisi_id, kegiatan_id: div.kegiatan_id },
      conn
    })

    await conn.commit()

    return { id: insertId, mahasiswa_id, divisi_id, status: "pending" }

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

const approvePanitia = async (id, user) => {
  if (!user || !user.id) throw new Error("User tidak valid")

  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    const data = await model.findPendaftaranForUpdate(id, conn)
    if (!data) throw new Error("Pendaftaran tidak ditemukan")
    if (data.status !== "pending") throw new Error("Pendaftaran sudah diproses sebelumnya")

    if (data.kuota > 0) {
      const total = await model.countPanitia(data.divisi_id, conn)
      if (total >= data.kuota) throw new Error("Kuota divisi sudah penuh")
    }

    const panitiaId = await model.insertPanitia(data, conn)
    await model.updateStatus(id, "approved", conn)

    await logAudit({
      user_id: user.id,
      role: user.role,
      action: "APPROVE_PANITIA",
      target_table: "pendaftaran_panitia",
      target_id: id,
      detail: {
        mahasiswa_id: data.mahasiswa_id,
        divisi_id: data.divisi_id,
        kegiatan_id: data.kegiatan_id,
        panitia_id: panitiaId
      },
      conn
    })

    await conn.commit()

    return { id, panitia_id: panitiaId, status: "approved" }

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

const rejectPanitia = async (id, user, alasan = null) => {
  if (!user || !user.id) throw new Error("User tidak valid")

  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    const data = await model.findPendaftaranForUpdate(id, conn)
    if (!data) throw new Error("Pendaftaran tidak ditemukan")
    if (data.status !== "pending") throw new Error("Pendaftaran sudah diproses sebelumnya")

    await model.updateStatus(id, "rejected", conn)

    await logAudit({
      user_id: user.id,
      role: user.role,
      action: "REJECT_PANITIA",
      target_table: "pendaftaran_panitia",
      target_id: id,
      detail: {
        mahasiswa_id: data.mahasiswa_id,
        divisi_id: data.divisi_id,
        kegiatan_id: data.kegiatan_id,
        alasan: alasan || "Tidak ada alasan"
      },
      conn
    })

    await conn.commit()

    return { id, status: "rejected" }

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

const removeAnggotaPanitia = async (panitia_id, user, reason) => {
  return await removeAnggotaByAdmin({ panitia_id, user, reason })
}

const getPanitiaByKegiatan = async (kegiatan_id) => {
  const conn = await db.getConnection()
  try {
    return await model.getPanitiaByKegiatan(kegiatan_id, conn)
  } finally {
    conn.release()
  }
}

const getPendaftarByDivisi = async (divisi_id) => {
  const [rows] = await db.query(
    `SELECT pp.id, pp.mahasiswa_id, pp.status, pp.created_at,
            m.nama, m.nim
     FROM pendaftaran_panitia pp
     JOIN mahasiswa m ON m.id = pp.mahasiswa_id
     WHERE pp.divisi_id = ?
     ORDER BY pp.created_at DESC`,
    [divisi_id]
  )
  return rows
}

const getMyPendaftaran = async (user) => {
  if (!user.mahasiswa_id) throw new Error("User bukan mahasiswa")

  const [rows] = await db.query(
    `SELECT
       pp.id,
       pp.divisi_id,
       pp.status,
       pp.created_at,
       dk.nama_divisi,
       dk.kegiatan_id,
       dk.link_grup,
       k.nama_kegiatan,
       k.deskripsi,
       k.tanggal_acara_mulai,
       k.status               AS kegiatan_status,
       uo.nama_unit,
       ni.nama                AS nama_icp,
       ki.nama_kategori,
       CONCAT(s.tahun_ajaran, ' ', s.semester) AS semester_label
     FROM pendaftaran_panitia pp
     JOIN divisi_kegiatan  dk ON dk.id        = pp.divisi_id
     JOIN kegiatan         k  ON k.id         = dk.kegiatan_id
     LEFT JOIN unit_organisasi uo ON uo.id    = k.unit_id
     LEFT JOIN nama_icp        ni ON ni.id    = k.nama_icp_id
     LEFT JOIN kategori_icp    ki ON ki.id    = k.kategori_id
     LEFT JOIN semesters       s  ON s.id     = k.semester_id
     WHERE pp.mahasiswa_id = ?
     ORDER BY pp.created_at DESC`,
    [user.mahasiswa_id]
  )
  return rows
}

const setCO = async (divisi_id, mahasiswa_id, user) => {
  if (!divisi_id || !mahasiswa_id) {
    throw new Error("divisi_id dan mahasiswa_id wajib diisi")
  }

  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    const [[divisi]] = await conn.query(
      `SELECT id, kegiatan_id, co_mahasiswa_id FROM divisi_kegiatan WHERE id = ? FOR UPDATE`,
      [divisi_id]
    )
    if (!divisi) throw new Error("Divisi tidak ditemukan")

    const [[mhs]] = await conn.query(
      `SELECT id, nama, nim FROM mahasiswa WHERE id = ? AND status = 'aktif'`,
      [mahasiswa_id]
    )
    if (!mhs) throw new Error("Mahasiswa tidak ditemukan / tidak aktif")

    //Co_dalam Panitia
    const [[anggota]] = await conn.query(
      `SELECT id FROM panitia_kegiatan
       WHERE divisi_id = ?
       AND mahasiswa_id = ?
       AND status = 'approved'
       AND removed_at IS NULL
       LIMIT 1`,
      [divisi_id, mahasiswa_id]
    )
    if (!anggota) {
      throw new Error(
        "Mahasiswa harus menjadi panitia (approved) di divisi ini sebelum dijadikan CO"
      )
    }

    //batalkan jadi co, balik anggota lama
    if (divisi.co_mahasiswa_id) {
      await conn.query(
        `UPDATE panitia_kegiatan SET jabatan = 'anggota'
         WHERE divisi_id = ? AND mahasiswa_id = ? AND status = 'approved'`,
        [divisi_id, divisi.co_mahasiswa_id]
      )
    }

    //Set CO baru di divisi
    await conn.query(
      `UPDATE divisi_kegiatan SET co_mahasiswa_id = ? WHERE id = ?`,
      [mahasiswa_id, divisi_id]
    )

    //Tandai jabatan panitia menjadi 'co'
    await conn.query(
      `UPDATE panitia_kegiatan SET jabatan = 'co'
       WHERE divisi_id = ? AND mahasiswa_id = ? AND status = 'approved'`,
      [divisi_id, mahasiswa_id]
    )

    await logAudit({
      user_id: user.id,
      role: user.role,
      action: "SET_CO",
      target_table: "divisi_kegiatan",
      target_id: divisi_id,
      detail: { divisi_id, mahasiswa_id, kegiatan_id: divisi.kegiatan_id },
      conn
    })

    await conn.commit()

    return { divisi_id, mahasiswa_id, status: "co_set" }

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

const setLinkGroup = async (divisi_id, link_grup, user) => {
  if (!divisi_id || !link_grup) {
    throw new Error("divisi_id dan link_grup wajib diisi")
  }

  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    const [result] = await conn.query(
      `UPDATE divisi_kegiatan SET link_grup = ? WHERE id = ?`,
      [link_grup, divisi_id]
    )

    if (result.affectedRows === 0) {
      throw new Error("Divisi tidak ditemukan")
    }

    await logAudit({
      user_id: user.id,
      role: user.role,
      action: "SET_LINK_GROUP",
      target_table: "divisi_kegiatan",
      target_id: divisi_id,
      detail: { divisi_id, link_grup },
      conn
    })

    await conn.commit()

    return { divisi_id, link_grup, status: "updated" }

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

//atur atau set lagi point beda dari reward awal 
const setPanitiaReward = async (panitiaId, point, user) => {
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()

    const [[pk]] = await conn.query(
      `SELECT pk.id, pk.kegiatan_id, k.status
       FROM panitia_kegiatan pk
       JOIN kegiatan k ON k.id = pk.kegiatan_id
       WHERE pk.id = ? AND pk.removed_at IS NULL`, [panitiaId])
    if (!pk) throw new Error("Panitia tidak ditemukan")
    if (["selesai", "dibatalkan"].includes(pk.status)) {
      throw new Error("Kegiatan sudah selesai/dibatalkan — point tidak bisa diubah")
    }

    let val = null
    if (point !== null && point !== undefined && point !== "") {
      val = Number(point)
      if (isNaN(val) || val <= 0) throw new Error("point harus angka > 0")
    }

    await conn.query(
      `UPDATE panitia_kegiatan SET point_override = ? WHERE id = ?`,
      [val, panitiaId])

    await logAudit({
      user_id: user.id, role: user.role, action: "SET_PANITIA_REWARD",
      target_table: "panitia_kegiatan", target_id: panitiaId,
      detail: { point_override: val }, conn })

    await conn.commit()
    return { id: panitiaId, point_override: val }
  } catch (err) { await conn.rollback(); throw err }
  finally { conn.release() }
}

module.exports = {
  getAllPanitia,
  validateCO,
  validateCODivisi,
  removeAnggotaByAdmin,
  cancelByMahasiswa, 
  daftarPanitia,
  approvePanitia,
  rejectPanitia,
  removeAnggotaPanitia,
  getPanitiaByKegiatan,
  getPendaftarByDivisi,
  getMyPendaftaran,
  setCO,
  setLinkGroup,
  setPanitiaReward
} 