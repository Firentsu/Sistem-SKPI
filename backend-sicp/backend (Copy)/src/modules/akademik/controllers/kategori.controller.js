const kategoriService = require("../services/kategori.service");
const { success, fail } = require("../../../shared/utils/response");

// ===============================
const getAllKategori = async (req, res) => {
  try {
    const data = await kategoriService.getAllKategori();
    return success(res, data);
  } catch (err) {
    return fail(res, err.message);
  }
};

// ===============================
const createKategori = async (req, res) => {
  try {
    const result = await kategoriService.createKategori(req.body);

    return success(res, result, "Kategori berhasil dibuat");
  } catch (err) {
    return fail(res, err.message);
  }
};

// ===============================
const getKategoriById = async (req, res) => {
  try {
    const data = await kategoriService.getKategoriById(req.params.id);
    return success(res, data);
  } catch (err) {
    return fail(res, err.message);
  }
};

// ===============================
const updateKategori = async (req, res) => {
  try {
    const result = await kategoriService.updateKategori(
      req.params.id,
      req.body.nama_kategori,
      req.body.status
    );

    return success(res, result, "Kategori diupdate");
  } catch (err) {
    return fail(res, err.message);
  }
};

// ===============================
const deleteKategori = async (req, res) => {
  try {
    const result = await kategoriService.deleteKategori(req.params.id);
    return success(res, result, "Kategori dinonaktifkan");
  } catch (err) {
    return fail(res, err.message);
  }
};

// POIN 2: aktifkan kembali kategori
const reactivateKategori = async (req, res) => {
  try {
    const result = await kategoriService.reactivateKategori(req.params.id);
    return success(res, result, "Kategori diaktifkan kembali");
  } catch (err) {
    return fail(res, err.message);
  }
};

// POIN 3: hapus permanen kategori
const hardDeleteKategori = async (req, res) => {
  try {
    const result = await kategoriService.hardDeleteKategori(req.params.id);
    return success(res, result, "Kategori dihapus permanen");
  } catch (err) {
    return fail(res, err.message);
  }
};

module.exports = {
  getAllKategori,
  createKategori,
  getKategoriById,
  updateKategori,
  deleteKategori,
  hardDeleteKategori,
  reactivateKategori
}; 