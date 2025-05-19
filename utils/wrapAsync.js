// utils/wrapAsync.js
const { appError } = require('./responseFormat')

module.exports = (handler, defaultErrorMessage = '伺服器錯誤') => {
  return async (req, res, next) => {
    try {
      await handler(req, res, next)
    } catch (err) {
      console.error('錯誤:', err)
      return next(appError(500, err.message || defaultErrorMessage))
    }
  }
}
