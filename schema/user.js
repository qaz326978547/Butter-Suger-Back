const Joi = require('joi')

const userSchema = Joi.object({
  google_id: Joi.string().required(), //google_id 必填
  name: Joi.string().required(), //姓名必填
  email: Joi.string().email().required(), //email 必填
  nickname: Joi.string().optional(), //暱稱選填
  phone: Joi.string().optional(), //電話選填
  birthday: Joi.date().optional(), //生日選填
  sex: Joi.string().valid('male', 'female').optional(), //性別選填
  address: Joi.string().optional(), //地址選填
  role: Joi.string().valid('student', 'teacher', 'admin').required(), //角色必填
  is_active: Joi.boolean().optional(), //是否啟用選填
  is_verified: Joi.boolean().optional(), //是否驗證選填
  login_count: Joi.number().optional(), //登入次數選填
  profile_image_url: Joi.string().uri().optional(), //頭像選填
  google_token: Joi.string().optional(), //google token選填
  last_login_at: Joi.date().optional(), //最後登入時間選填
})

module.exports = { userSchema }
