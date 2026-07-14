const db = require("../../../shared/config/db");

// ===============================
const getAllKategori = (conn = null) => {
  const connection = conn || db;

  return connection.query(`
    SELECT id, nama_kategori, status
    FROM kategori_icp
  `);
};

// ===============================
const createKategori = (nama_kategori, conn = null) => {
  const connection = conn || db;

  return connection.query(`
    INSERT INTO kategori_icp (nama_kategori, status)
    VALUES (?, 'aktif')
  `, [nama_kategori]);
};

// ===============================
const getKategoriById = (id, conn = null) => {
  const connection = conn || db;

  return connection.query(`
    SELECT * FROM kategori_icp WHERE id = ?
  `, [id]);
};

// ===============================
const findByName = (nama_kategori, conn = null) => {
  const connection = conn || db;

  return connection.query(`
    SELECT id FROM kategori_icp WHERE nama_kategori = ?
  `, [nama_kategori]);
};

// ===============================
const updateKategori = (id, nama_kategori, status, conn = null) => {
  const connection = conn || db;

  return connection.query(`
    UPDATE kategori_icp 
    SET nama_kategori = COALESCE(?, nama_kategori),
        status = COALESCE(?, status)
    WHERE id = ?
  `, [nama_kategori, status, id]);
};

// ===============================
const deactivateKategori = (id, conn = null) => {
  const connection = conn || db;
  return connection.query(`UPDATE kategori_icp SET status = 'nonaktif' WHERE id = ?`, [id]);
};

// POIN 2: aktifkan kembali kategori
const reactivateKategori = (id, conn = null) => {
  const connection = conn || db;
  return connection.query(`UPDATE kategori_icp SET status = 'aktif' WHERE id = ?`, [id]);
};

module.exports = {
  getAllKategori,
  createKategori,
  getKategoriById,
  findByName,
  updateKategori,
  deactivateKategori,
  reactivateKategori
}; 