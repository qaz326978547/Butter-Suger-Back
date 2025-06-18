const Joi = require('joi')

const createSubsectionSchema = Joi.object({
  section_id: Joi.string().guid({ version: 'uuidv4' }).required().messages({
    'string.base': '章節 ID 必須是文字格式',
    'string.guid': '章節 ID 格式錯誤',
    'any.required': '請提供章節 ID',
  }),
  subsection_title: Joi.string().max(255).required().messages({
    'string.base': '小節標題必須是文字格式',
    'string.empty': '小節標題不能為空',
    'string.max': '小節標題不能超過 255 字',
    'any.required': '請提供小節標題',
  }),
  video_file_url: Joi.string().uri().optional().messages({
    'string.uri': '影片網址格式錯誤',
  }),
  video_duration: Joi.number().integer().min(0).optional().messages({
    'number.base': '影片長度必須是數字',
    'number.min': '影片長度不能小於 0',
  }),
  uploaded_at: Joi.date().iso().optional().messages({
    'date.format': '上傳時間格式錯誤',
  }),
  status: Joi.string().valid('available', 'processing').optional().messages({
    'any.only': '狀態必須是 available 或 processing',
  }),
  is_preview_available: Joi.boolean().optional().messages({
    'boolean.base': '預覽可用狀態必須是布林值',
  }),
  order_index: Joi.number().integer().min(0).optional().messages({
    'number.base': '順序必須為整數',
    'number.min': '順序不能小於 0',
  }),
})

const updateSubsectionSchema = Joi.object({
  subsection_title: Joi.string().max(255).optional(),
  video_file_url: Joi.string().uri().optional(),
  video_duration: Joi.number().integer().min(0).optional(),
  uploaded_at: Joi.date().iso().optional(),
  status: Joi.string().valid('available', 'processing').optional(),
  is_preview_available: Joi.boolean().optional(),
  order_index: Joi.number().integer().min(0).optional(),
})

module.exports = {
  createSubsectionSchema,
  updateSubsectionSchema,
}
