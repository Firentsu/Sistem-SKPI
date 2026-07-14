require("dotenv").config();
const mysql = require("mysql2/promise");

// ===============================
const isDev = process.env.NODE_ENV !== "production";

// ===============================
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  //WAKTU NASIONAL (WIB). Semua NOW()/CURRENT_TIMESTAMP & parsing
  //DATETIME memakai offset +07:00 (Asia/Jakarta) konsisten di seluruh sistem.
  timezone: "+07:00",
});

// Pastikan setiap koneksi memakai zona waktu WIB di sisi SQL juga.
pool.on("connection", (conn) => {
  conn.query("SET time_zone = '+07:00'");
});

// ===============================
const logError = (label, err, sql = null, params = null) => {
  console.error(`\n[${label}]`);
  console.error("Message:", err.message);

  if (isDev && sql) {
    console.error("SQL:", sql);
    console.error("Params:", params);
  }

  console.error("Stack:", err.stack);
};

// ===============================
const query = async (sql, params = []) => {
  try {
    return await pool.query(sql, params);
  } catch (err) {
    logError("DB QUERY ERROR", err, sql, params);
    throw err;
  }
};

// ===============================
const queryOne = async (sql, params = []) => {
  const [rows] = await query(sql, params);
  return rows[0] || null;
};

// ===============================
const getConnection = async () => {
  try {
    return await pool.getConnection();
  } catch (err) {
    logError("DB CONNECTION ERROR", err);
    throw err;
  }
};

// ===============================
const withTransaction = async (callback) => {
  const conn = await getConnection();

  try {
    if (isDev) console.log("[TX] BEGIN");

    await conn.beginTransaction();

    const result = await callback(conn);

    await conn.commit();

    if (isDev) console.log("[TX] COMMIT");

    return result;

  } catch (err) {
    await conn.rollback();

    logError("TRANSACTION ERROR", err);

    if (isDev) console.log("[TX] ROLLBACK");

    throw err;

  } finally {
    conn.release();
  }
};

// ===============================
// 🔥 EXPORT
// ===============================
module.exports = {
  pool,
  query,
  queryOne, 
  getConnection,
  withTransaction
}; 