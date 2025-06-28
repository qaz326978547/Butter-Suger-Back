/**
 * 取得分頁參數
 * @param {Request} req - Express request object
 * @returns {Object} { page, perPage, skip, take }
 */
const getPagination = (req) => {
  const page = parseInt(req.query.page, 10) || 1
  const perPage = parseInt(req.query.perPage, 10) || 10
  const skip = (page - 1) * perPage
  const take = perPage

  return { page, perPage, skip, take }
}

module.exports = {
  getPagination,
}
