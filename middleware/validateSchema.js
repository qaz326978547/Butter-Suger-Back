const { appError } = require('../utils/responseFormat')

// Joi 驗證 schema 中介層
const validateSchema = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false })

    if (error) {
      // 將所有錯誤訊息整合為單一字串
      const errorMessage = error.details.map((detail) => detail.message).join(', ')
      return next(appError(400, errorMessage))
    }

    req.validatedData = value
    next()
  }
}

module.exports = validateSchema
