const db = require("../../../shared/config/db")
const ledgerModel = require("../models/icpPotonganLedger.model")
const transactionService = require("../../icp/services/icpTransaction.service")

const applyPotonganToLedger = async (potonganId, validatedBy, conn = null, force = false) => {
  const connection = conn || await db.getConnection()
  const isExternal = !!conn

  try {
    if (!isExternal) await connection.beginTransaction()

    // ===============================
    // 🔥 LOCK POTONGAN (ANTI RACE CONDITION)
    const [rows] = await connection.query(
      `SELECT * FROM icp_potongan WHERE id = ? FOR UPDATE`,
      [potonganId]
    )

    const p = rows[0]

    if (!p) throw new Error("Potongan tidak ditemukan")

    // ===============================
    // 🔒 VALIDASI WAJIB (TETAP)
    if (!p.mahasiswa_id) throw new Error("mahasiswa_id kosong")
    if (!p.jumlah_potong) throw new Error("jumlah_potong kosong")
    if (!p.semester_id) throw new Error("semester wajib")
    if (!p.kategori_id) throw new Error("kategori wajib")
    if (!validatedBy) throw new Error("validated_by wajib")

    // ===============================
    // 🔥 HARDEN: CEK DUPLICATE + LOCK
    const [exist] = await connection.query(
      `SELECT id FROM icp_transactions
       WHERE source_type = 'icp_potongan'
       AND source_id = ?
       AND mahasiswa_id = ?
       AND tipe = 'keluar'
       LIMIT 1
       FOR UPDATE`,
      [potonganId, p.mahasiswa_id]
    )

    if (exist.length) {
      throw new Error("Potongan sudah masuk ledger")
    }

    // ===============================
    // 🔥 INSERT VIA ENGINE (TETAP)
    await transactionService.createTransaction({
      mahasiswa_id: p.mahasiswa_id,
      source_type: "icp_potongan",
      source_id: p.id,
      deskripsi: p.keterangan || "Potongan ICP",
      point: p.jumlah_potong,
      tipe: "keluar",
      semester_id: p.semester_id,
      kategori_id: p.kategori_id,
      created_by: validatedBy,
      validated_by: validatedBy,
      force: force,
      idempotency_key: `POTONGAN-${p.id}`,
      conn: connection
    }, { id: validatedBy })

    // ===============================
    // 📊 CEK SALDO
    const saldo = await ledgerModel.getSaldoByKategoriSemester(
      p.mahasiswa_id,
      p.kategori_id,
      p.semester_id,
      connection
    )

    // ===============================
    // 💸 HANDLE DEBT (TETAP)
    if (saldo < 0) {
      await ledgerModel.upsertDebt({
        mahasiswa_id: p.mahasiswa_id,
        kategori_id: p.kategori_id,
        amount: Math.abs(saldo)
      }, connection)
    }

    if (!isExternal) await connection.commit()

    return {
      success: true,
      saldo
    }

  } catch (err) {
    if (!isExternal) await connection.rollback()
    throw err
  } finally {
    if (!isExternal) connection.release()
  }
}

module.exports = { applyPotonganToLedger }