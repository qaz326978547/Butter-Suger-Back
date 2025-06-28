// schema/section.schema.js
const Joi = require('joi')

const createSectionSchema = Joi.object({
  course_id: Joi.string().guid({ version: 'uuidv4' }).required().messages({
    'string.base': '課程 ID 必須是文字格式',
    'string.guid': '課程 ID 格式錯誤',
    'any.required': '請提供課程 ID',
  }),
  main_section_title: Joi.string().max(255).required().messages({
    'string.base': '章節標題必須是文字格式',
    'string.empty': '章節標題不能為空',
    'string.max': '章節標題不能超過 255 字',
    'any.required': '請提供章節標題',
  }),
  order_index: Joi.number().integer().min(0).optional().messages({
    'number.base': '順序必須為整數',
    'number.integer': '順序必須為整數',
    'number.min': '順序不能小於 0',
  }),
})

const updateSectionSchema = Joi.object({
  main_section_title: Joi.string().max(255).optional().messages({
    'string.base': '章節標題必須是文字格式',
    'string.max': '章節標題不能超過 255 字',
  }),
  order_index: Joi.number().integer().min(0).optional().messages({
    'number.base': '順序必須為整數',
    'number.integer': '順序必須為整數',
    'number.min': '順序不能小於 0',
  }),
})

module.exports = {
  createSectionSchema,
  updateSectionSchema,
}
