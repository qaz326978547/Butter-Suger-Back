const Joi = require('joi')

const userSchema = Joi.object({
  google_id: Joi.string().required().messages({
    'any.required': 'Google ID 為必填欄位',
    'string.base': 'Google ID 必須是字串',
  }),
  name: Joi.string().required().messages({
    'any.required': '姓名為必填欄位',
    'string.base': '姓名必須是字串',
  }),
  email: Joi.string().email().required().messages({
    'any.required': '電子郵件為必填欄位',
    'string.email': '請提供有效的電子郵件格式',
  }),
  nickname: Joi.string().optional().messages({
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
  birthday: Joi.date().optional().messages({
    'date.base': '生日格式錯誤，請使用有效日期',
  }),
  sex: Joi.string().valid('male', 'female').optional().messages({
    'any.only': '性別只能是 male 或 female',
    'string.base': '性別必須是字串',
  }),
  address: Joi.string().optional().messages({
    'string.base': '地址必須是字串',
  }),
  role: Joi.string().valid('student', 'teacher', 'admin').required().messages({
    'any.required': '角色為必填欄位',
    'any.only': '角色必須是 student、teacher 或 admin 其中之一',
  }),
  is_active: Joi.boolean().optional().messages({
    'boolean.base': '是否啟用必須是布林值',
  }),
  is_verified: Joi.boolean().optional().messages({
    'boolean.base': '是否驗證必須是布林值',
  }),
  login_count: Joi.number().optional().messages({
    'number.base': '登入次數必須是數字',
  }),
  profile_image_url: Joi.string().uri().optional().messages({
    'string.uri': '頭像網址必須是合法的 URI',
  }),
  google_token: Joi.string().optional().messages({
    'string.base': 'Google Token 必須是字串',
  }),
  last_login_at: Joi.date().optional().messages({
    'date.base': '最後登入時間格式錯誤',
  }),
})

const updateUserSchema = Joi.object({
  name: Joi.string().required().messages({
    'any.required': '姓名為必填欄位',
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
  email: Joi.string().email().allow('').optional().messages({
    'string.email': '請輸入有效的電子郵件格式',
    'string.base': '電子郵件必須是字串',
  }),
  profile_image_url: Joi.string().uri().allow('').optional().messages({
    'string.uri': '頭像網址必須是合法的 URI 格式',
    'string.base': '頭像網址必須是字串',
  }),
})

module.exports = { userSchema, updateUserSchema }
