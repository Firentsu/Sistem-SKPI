const service = require("../services/jurusanManagement.service");

const pindahkanJurusanDosen = async (
  req,
  res
) => {
  try {
    const result =
      await service.pindahkanJurusanDosen(
        req.params.id,
        req.body.jurusan_id
      );

    res.json(result);
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

const pindahkanJurusanAdmin = async (
  req,
  res
) => {
  try {
    const result =
      await service.pindahkanJurusanAdmin(
        req.params.id,
        req.body.jurusan_id
      );

    res.json(result);
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

module.exports = {
  pindahkanJurusanDosen,
  pindahkanJurusanAdmin
}; 