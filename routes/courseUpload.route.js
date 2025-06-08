// routes/courseUpload.route.js
const express = require('express')
const multer = require('multer')
const courseController = require('../controllers/course.controller')
const isAuth = require('../middleware/isAuth.middleware')
const handleMiddleware = require('../utils/handleMiddleware')

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

// 課程 banner 圖片
router.post(
  '/:courseId/upload/course-banner-image',
  upload.single('banner'),
  ...handleMiddleware([isAuth], courseController.uploadCourseBanner)
)
router.delete(
  '/:courseId/upload/course-banner-image',
  ...handleMiddleware([isAuth], courseController.deleteCourseBanner)
)

// 課程封面圖
router.post(
  '/:courseId/upload/small-image',
  upload.single('course-small-image'),
  ...handleMiddleware([isAuth], courseController.uploadCourseSmallImage)
)
router.delete(
  '/:courseId/upload/small-image',
  ...handleMiddleware([isAuth], courseController.deleteCourseSmallImage)
)

// 課程描述圖
router.post(
  '/:courseId/upload/description-image',
  upload.single('course-description-image'),
  ...handleMiddleware([isAuth], courseController.uploadCourseDescriptionImage)
)
router.delete(
  '/:courseId/upload/description-image',
  ...handleMiddleware([isAuth], courseController.deleteCourseDescriptionImage)
)

// 多講義上傳
router.post(
  '/:courseId/upload/course-handouts',
  upload.array('handout', 5),
  ...handleMiddleware([isAuth], courseController.uploadCourseHandOuts)
)
// 刪除課程講義
router.delete(
  '/:courseId/upload/course-handouts',
  ...handleMiddleware([isAuth], courseController.deleteCourseHandOuts)
)

module.exports = router
