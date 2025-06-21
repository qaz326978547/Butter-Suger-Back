const express = require('express')
const subsectionController = require('../controllers/subsection.controller')
const isAuth = require('../middleware/isAuth.middleware')
const handleMiddleware = require('../utils/handleMiddleware')
const validateSchema = require('../middleware/validateSchema.middleware')
const { createSubsectionSchema, updateSubsectionSchema } = require('../schema/subsection.schema')

const router = express.Router()

router.get('/section/:sectionId', subsectionController.getSubsectionsBySectionId)

router.post(
  '/',
  ...handleMiddleware(
    [isAuth, validateSchema(createSubsectionSchema)],
    subsectionController.createSubsection
  )
)

// ❗️將 PATCH 改為 POST 並保留 ID 更新功能
router.post(
  '/:id/update',
  ...handleMiddleware(
    [isAuth, validateSchema(updateSubsectionSchema)],
    subsectionController.updateSubsection
  )
)

// 刪除小節 (包含影片)
router.delete('/:id', ...handleMiddleware([isAuth], subsectionController.deleteSubsection))

module.exports = router
