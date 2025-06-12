const Joi = require('joi')

//最後再加
const cartSchema = Joi.object({
    course_id: Joi.string().required().messages({
    'string.guid': 'course_id 必須是合法的 UUID 格式',
    'string.base': 'course_id 必須是字串',
    'any.required': 'course_id 為必須',
  })
})

const deleteCartSchema = Joi.object({
    cartItem_Id: Joi.string().required().messages({
    'string.guid': 'course_id 必須是合法的 UUID 格式',
    'string.base': 'course_id 必須是字串',
    'any.required': 'course_id 為必須',
  })
})

module.exports = { cartSchema, deleteCartSchema }
