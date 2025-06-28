const express = require('express')
const multer = require('multer')
const subsectionController = require('../controllers/subsection.controller')
const isAuth = require('../middleware/isAuth.middleware')
const handleMiddleware = require('../utils/handleMiddleware')

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

// 上傳小節影片
//{{host}}/api/v1/subsection/upload/{{subSection_id}}/upload-video
router.post(
  '/:subsectionId/upload-video',
  upload.single('video'),
  ...handleMiddleware([isAuth], subsectionController.uploadSubsectionVideo)
)

// ✅ 刪除小節影片（不是刪整個小節！）
router.delete(
  '/:subsectionId/upload-video',
  ...handleMiddleware([isAuth], subsectionController.deleteSubsectionVideo)
)

module.exports = router
