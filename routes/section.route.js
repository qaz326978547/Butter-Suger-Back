// routes/section.route.js
const express = require('express')
const sectionController = require('../controllers/section.controller')
const isAuth = require('../middleware/isAuth.middleware')
const handleMiddleware = require('../utils/handleMiddleware')
const validateSchema = require('../middleware/validateSchema.middleware')
const { createSectionSchema, updateSectionSchema } = require('../schema/section.schema')

const router = express.Router()

// 取得某課程的所有章節
router.get('/course/:courseId', sectionController.getSectionsByCourseId)

// 新增章節
router.post(
  '/',
  ...handleMiddleware(
    [isAuth, validateSchema(createSectionSchema)],
    sectionController.createSection
  )
)

// 更新章節
router.post(
  '/:id/update',
  ...handleMiddleware(
    [isAuth, validateSchema(updateSectionSchema)],
    sectionController.updateSection
  )
)

// 刪除章節
router.delete('/:id', ...handleMiddleware([isAuth], sectionController.deleteSection))

module.exports = router
