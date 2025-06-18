// routes/subsectionUpload.route.js
const express = require('express')
const multer = require('multer')
const subsectionController = require('../controllers/subsection.controller')
const isAuth = require('../middleware/isAuth.middleware')
const handleMiddleware = require('../utils/handleMiddleware')

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

// 上傳小節影片
router.post(
  '/:subsectionId/upload/video',
  upload.single('video'),
  ...handleMiddleware([isAuth], subsectionController.uploadSubsectionVideo)
)

// 刪除小節影片
router.delete(
  '/:subsectionId/upload/video',
  ...handleMiddleware([isAuth], subsectionController.deleteSubsectionVideo)
)

module.exports = router
