const service = require("../services/jurusan.service")
const { success, fail } = require("../../../shared/utils/response")

const validateUser = (req) => {
  if (!req.user) throw new Error("Unauthorized")
}

const getAll = async (req, res) => {
  try {
    validateUser(req)
    const data = await service.getAll()
    return success(res, data)
  } catch (err) {
    return fail(res, err.message)
  }
}

const create = async (req, res) => {
  try {
    validateUser(req)
    const result = await service.create(req.body, req.user)
    return success(res, result)
  } catch (err) {
    return fail(res, err.message)
  }
}

const update = async (req, res) => {
  try {
    validateUser(req)
    const result = await service.update(req.params.id, req.body, req.user)
    return success(res, result)
  } catch (err) {
    return fail(res, err.message)
  }
}

const remove = async (req, res) => {
  try {
    validateUser(req)
    const result = await service.remove(req.params.id, req.user)
    return success(res, result)
  } catch (err) {
    return fail(res, err.message)
  }
}

module.exports = {
  getAll,
  create,
  update,
  remove
} 