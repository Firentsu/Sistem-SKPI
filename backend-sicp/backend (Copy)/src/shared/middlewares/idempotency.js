const db = require("../config/db")

// ============================================================================
// IDEMPOTENCY MIDDLEWARE (Hardened)
// ----------------------------------------------------------------------------
// FIX #4 — perbaikan dari versi sebelumnya:
//  1. Tidak menahan DB connection antar middleware → route → respons.
//     Konsekuensinya: tidak ada lagi connection leak bila error handler
//     menangkap exception sebelum res.json dipanggil.
//  2. INSERT idempotency_keys dilakukan via res.on('finish') — dipasang
//     SEBELUM res.json mengirim respons, sehingga listener terdaftar dan
//     dijamin tereksekusi setelah respons terkirim ke client.
//  3. INSERT IGNORE → bila ada race / retry yang nyaris bersamaan, tidak
//     melempar duplicate-key error.
// ============================================================================

const idempotencyMiddleware = async (req, res, next) => {
  const key = req.headers["x-idempotency-key"]

  if (!["POST", "PUT", "PATCH"].includes(req.method)) {
    return next()
  }

  if (!key) {
    return next()
  }

  // ===============================
  // STEP 1 — cek key sudah pernah dipakai? Bila ya, replay respons sebelumnya.
  try {
    const [rows] = await db.query(
      `SELECT response FROM idempotency_keys
       WHERE idempotency_key = ?
       LIMIT 1`,
      [key]
    )

    if (rows.length) {
      try {
        return res.json(JSON.parse(rows[0].response))
      } catch (parseErr) {
        // bila response tersimpan rusak, lanjut seolah belum ada
        console.error("[IDEMPOTENCY PARSE]", parseErr.message)
      }
    }
  } catch (err) {
    return next(err)
  }

  // ===============================
  // STEP 2 — tangkap body respons untuk disimpan SETELAH respons terkirim.
  let savedBody = null

  const originalJson = res.json.bind(res)
  res.json = (body) => {
    savedBody = body
    return originalJson(body)
  }

  // STEP 3 — daftarkan listener SEBELUM res.json dipanggil agar tetap fire.
  res.on("finish", () => {
    if (!savedBody || savedBody.success !== true) return

    db.query(
      `INSERT IGNORE INTO idempotency_keys
       (idempotency_key, response, created_at)
       VALUES (?, ?, NOW())`,
      [key, JSON.stringify(savedBody)]
    ).catch((err) => {
      console.error("[IDEMPOTENCY SAVE]", err.message)
    })
  })

  next()
}

module.exports = idempotencyMiddleware
