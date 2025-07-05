// routes/section.route.js
const express = require('express')
const sectionController = require('../controllers/section.controller')
const isAuth = require('../middleware/isAuth.middleware')
const isTeacher = require('../middleware/isTeacher.middleware')
const handleMiddleware = require('../utils/handleMiddleware')
const validateSchema = require('../middleware/validateSchema.middleware')
const { createSectionSchema, updateSectionSchema } = require('../schema/section.schema')

const router = express.Router()

// 取得某課程的所有章節
router.get('/:courseId/section',...handleMiddleware(
  [isAuth, isTeacher], sectionController.getSection))
/* ...handleMiddleware(
  [isAuth, isTeacher]),  */

// 新增章節
router.post('/:courseId/section',   ...handleMiddleware(
  [isAuth, isTeacher], sectionController.postSection))

// 修改章節
router.patch('/section/:sectionId',   ...handleMiddleware(
  [isAuth, isTeacher], sectionController.patchSection))

// 刪除章節
router.delete('/section/:sectionId',   ...handleMiddleware(
  [isAuth, isTeacher], sectionController.deleteSection))

// 新增章節
/* router.post(
  '/',
  ...handleMiddleware(
    [isAuth, isTeacher, validateSchema(createSectionSchema)],
    sectionController.createSection
  )
) */

// 更新章節
/* router.post(
  '/:id/update',
  ...handleMiddleware(
    [isAuth, isTeacher, validateSchema(updateSectionSchema)],
    sectionController.updateSection
  )
) */

// 刪除章節
/* router.delete('/:id', ...handleMiddleware([isAuth, isTeacher], sectionController.deleteSection)) */

module.exports = router
