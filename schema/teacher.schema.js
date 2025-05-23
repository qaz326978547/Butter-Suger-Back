const Joi = require('joi')

const updateTeacherSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.base': '姓名必須是字串',
  }),
  nickname: Joi.string().allow(null, '').optional().messages({
    'string.base': '暱稱必須是字串',
  }),
  phone: Joi.string()
    .pattern(/^09\d{8}$/)
    .allow(null, '')
    .optional()
    .messages({
      'string.base': '電話必須是字串',
      'string.pattern.base': '電話格式錯誤，需為 09 開頭的 10 位數字',
    }),
  birthday: Joi.date().allow(null, '').optional().messages({
    'date.base': '生日格式錯誤，請使用有效日期',
  }),
  sex: Joi.string().valid('male', 'female').allow(null, '').optional().messages({
    'any.only': '性別只能是 male 或 female',
    'string.base': '性別必須是字串',
  }),
  address: Joi.string().allow(null, '').optional().messages({
    'string.base': '地址必須是字串',
  }),
  profile_image_url: Joi.string().uri().allow('').optional().messages({
    'string.uri': '頭像網址必須是合法的 URI 格式',
    'string.base': '頭像網址必須是字串',
  }), 
  bank_name: Joi.string().optional().messages({
    'string.base': '地址必須是字串',
  }),  
  bank_account: Joi.string().optional().messages({
    'string.base': '地址必須是字串',
  }),  
  slogan: Joi.string().optional().messages({
    'string.base': '地址必須是字串',
  }),  
  description: Joi.string().optional().messages({
    'string.base': '地址必須是字串',
  }),  
  specialization: Joi.string().optional().messages({
    'string.base': '地址必須是字串',
  })
})

module.exports = { updateTeacherSchema }
