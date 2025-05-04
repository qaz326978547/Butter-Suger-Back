// 統一 API 回傳格式
const responseFormat = (status, message, data = null, extra = {}) => ({
  status,
  message,
  ...extra, // ⬅️ 擴充額外欄位，例如 accessToken
  data,
})
// 自訂錯誤格式
const appError = (status, message) => {
  const error = new Error(message)
  error.status = status
  return error
}

/*
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {boolean} status - Response status (true/false)
 * @param {string} message - Response message
 * @param {Object| array | null} data - Response data (default: null)
 * @param {Object} extra - Extra fields to include in the response (default: {})
 */
const sendResponse = (res, statusCode, status, message, data = null, extra = {}) => {
  res.status(statusCode).json(responseFormat(status, message, data, extra))
}
module.exports = {
  responseFormat,
  appError,
  sendResponse,
}
