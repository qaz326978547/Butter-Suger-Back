const { responseFormat } = require('../utils/responseFormat')

const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || 500
  const message = err.message || '系統發生錯誤，請稍後再試'

  res.status(statusCode).json(responseFormat(false, message))
}

module.exports = errorHandler
