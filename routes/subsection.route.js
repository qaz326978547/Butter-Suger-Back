const express = require('express')
const subsectionController = require('../controllers/subsection.controller')
const isAuth = require('../middleware/isAuth.middleware')
const handleMiddleware = require('../utils/handleMiddleware')
const validateSchema = require('../middleware/validateSchema.middleware')
const { createSubsectionSchema, updateSubsectionSchema } = require('../schema/subsection.schema')

const router = express.Router()

// 取得某章節的小節列表
router.get('/section/:sectionId', subsectionController.getSubsectionsBySectionId)

// 新增小節
router.post(
  '/',
  ...handleMiddleware(
    [isAuth, validateSchema(createSubsectionSchema)],
    subsectionController.createSubsection
  )
)

// 更新小節
router.patch(
  '/:id',
  ...handleMiddleware(
    [isAuth, validateSchema(updateSubsectionSchema)],
    subsectionController.updateSubsection
  )
)

// 刪除小節
router.delete('/:id', ...handleMiddleware([isAuth], subsectionController.deleteSubsection))

module.exports = router
