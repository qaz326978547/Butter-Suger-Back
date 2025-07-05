const express = require('express')
const subsectionController = require('../controllers/subsection.controller')
const isAuth = require('../middleware/isAuth.middleware')
const isTeacher = require('../middleware/isTeacher.middleware')
const handleMiddleware = require('../utils/handleMiddleware')
const validateSchema = require('../middleware/validateSchema.middleware')
const { createSubsectionSchema, updateSubsectionSchema } = require('../schema/subsection.schema')

const router = express.Router()

//取得特定章節小節
router.get('/section/:sectionId/subsection', 
  ...handleMiddleware([isAuth, isTeacher],
  subsectionController.getSubsection))

//新增小節
router.post('/section/:sectionId/subsection', 
  ...handleMiddleware([isAuth, isTeacher],
  subsectionController.postSubsection))

//編輯小節
router.patch('/:courseId/subsection', 
  ...handleMiddleware([isAuth, isTeacher],
  subsectionController.patchSubsection))

  
/* router.get('/section/:sectionId/', subsectionController.getSubsectionsBySectionId) */

router.post(
  '/',
  ...handleMiddleware(
    [isAuth, isTeacher, validateSchema(createSubsectionSchema)],
    subsectionController.createSubsection
  )
)

// 將 PATCH 改為 POST 並保留 ID 更新功能
router.post(
  '/:id/update',
  ...handleMiddleware(
    [isAuth, isTeacher, validateSchema(updateSubsectionSchema)],
    subsectionController.patchSubsection
  )
)

// 刪除小節 (包含影片)
router.delete('/subsection/:subsectionId', ...handleMiddleware([isAuth, isTeacher], subsectionController.deleteSubsection))
/* router.delete('/:id', ...handleMiddleware([isAuth, isTeacher], subsectionController.deleteSubsection)) */

module.exports = router
