const db = require("../../../shared/config/db")
const KategoriModel = require("../models/kategori.model")

// ===============================
const normalizeNama = (nama) => {
  return nama.trim().toUpperCase()
}

// ===============================
const getAllKategori = async () => {
  const [rows] = await KategoriModel.getAllKategori()

  return rows.map(k => ({
    id: k.id,
    nama_kategori: k.nama_kategori,
    status: k.status
  }))
}

// ===============================
const createKategori = async (data) => {
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    let { nama_kategori } = data

    if (!nama_kategori || typeof nama_kategori !== "string") {
      throw new Error("nama_kategori harus berupa string")
    }

    nama_kategori = normalizeNama(nama_kategori)

    // 🔥 CEK DUPLIKAT
    const [exist] = await KategoriModel.findByName(nama_kategori, conn)
    if (exist.length) {
      throw new Error("Kategori sudah ada")
    }

    const [result] = await KategoriModel.createKategori(nama_kategori, conn)

    await conn.commit()

    return {
      id: result.insertId,
      nama_kategori,
      status: "aktif"
    }

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

// ===============================
const getKategoriById = async (id) => {
  if (!id || isNaN(id)) {
    throw new Error("ID tidak valid")
  }

  const [rows] = await KategoriModel.getKategoriById(id)

  if (!rows.length) {
    throw new Error("Kategori tidak ditemukan")
  }

  return rows[0]
}

// ===============================
const updateKategori = async (id, nama_kategori, status) => {
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    if (!id || isNaN(id)) {
      throw new Error("ID tidak valid")
    }

    const [rows] = await KategoriModel.getKategoriById(id, conn)

    if (!rows.length) {
      throw new Error("Kategori tidak ditemukan")
    }

    let finalNama = rows[0].nama_kategori

    if (nama_kategori) {
      finalNama = normalizeNama(nama_kategori)

      const [exist] = await KategoriModel.findByName(finalNama, conn)
      if (exist.length && exist[0].id !== id) {
        throw new Error("Kategori sudah ada")
      }
    }

    await KategoriModel.updateKategori(id, finalNama, status, conn)

    await conn.commit()

    return {
      id,
      nama_kategori: finalNama,
      status: status || rows[0].status
    }

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

// ===============================
const deleteKategori = async (id) => {
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    if (!id || isNaN(id)) {
      throw new Error("ID tidak valid")
    }

    const [rows] = await KategoriModel.getKategoriById(id, conn)

    if (!rows.length) {
      throw new Error("Kategori tidak ditemukan")
    }

    // 🔥 OPTIONAL RULE (bisa kamu aktifkan nanti)
    // if (rows[0].nama_kategori === "MORAL") {
    //   throw new Error("Kategori inti tidak boleh dihapus")
    // }

    await KategoriModel.deactivateKategori(id, conn)

    await conn.commit()

    return {
      id,
      status: "nonaktif"
    }

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

// POIN 2: aktifkan kembali kategori yang nonaktif
const reactivateKategori = async (id) => {
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()
    if (!id || isNaN(id)) throw new Error("ID tidak valid")
    const [rows] = await KategoriModel.getKategoriById(id, conn)
    if (!rows.length) throw new Error("Kategori tidak ditemukan")
    if (rows[0].status === "aktif") throw new Error("Kategori sudah aktif")
    await KategoriModel.reactivateKategori(id, conn)
    await conn.commit()
    return { id, status: "aktif" }
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

// POIN 3: HAPUS PERMANEN kategori (hard delete) — hanya bila tidak terpakai
const hardDeleteKategori = async (id) => {
  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()
    if (!id || isNaN(id)) throw new Error("ID tidak valid")
    const [rows] = await KategoriModel.getKategoriById(id, conn)
    if (!rows.length) throw new Error("Kategori tidak ditemukan")
    // cegah hapus bila masih dipakai pengajuan
    const [used] = await conn.query(
      `SELECT COUNT(*) AS total FROM icp_pengajuan WHERE kategori_id = ?`, [id])
    if (used[0].total > 0)
      throw new Error("Kategori masih dipakai pengajuan ICP — nonaktifkan saja, tidak bisa dihapus permanen")
    await conn.query(`DELETE FROM kategori_icp WHERE id = ?`, [id])
    await conn.commit()
    return { id, deleted: true }
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

module.exports = {
  hardDeleteKategori,
  getAllKategori,
  createKategori,
  getKategoriById,
  updateKategori,
  deleteKategori,
  reactivateKategori
}