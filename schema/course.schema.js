const Joi = require('joi')

const saveCourseSchema = Joi.object({
  suitable_for: Joi.string().required().messages({
    'string.base': '適合對象必須是文字格式',
    'any.required': '請填寫適合對象',
    'string.empty': '適合對象不能為空',
  }),
  course_goal: Joi.string().required().messages({
    'string.base': '課程目標必須是文字格式',
    'any.required': '請填寫課程目標',
    'string.empty': '課程目標不能為空',
  }),
  course_description: Joi.string().required().messages({
    'string.base': '課程簡介必須是文字格式',
    'any.required': '請填寫課程簡介',
    'string.empty': '課程簡介不能為空',
  }),
  course_banner_description: Joi.string().required().messages({
    'string.base': '課程描述必須是文字格式',
    'any.required': '請填寫課程描述',
    'string.empty': '課程描述不能為空',
  }),
})

//'all', 'bread', 'cookie', 'cake'
const courseCategorySchema = Joi.object({
  category: Joi.string().valid('all', 'bread', 'cookie', 'cake').required().messages({
    'string.base': '課程類別必須是文字格式',
    'any.required': '請選擇課程類別',
    'string.empty': '課程類別不能為空',
    'any.only': '課程類別必須是 all、bread、cookie 或 cake',
  }),
})

module.exports = { saveCourseSchema, courseCategorySchema }
