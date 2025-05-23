// routes/course.js
const express = require('express')
const multer = require('multer')
const courseController = require('../controllers/course.controller')
const isAuth = require('../middleware/isAuth.middleware')
const handleMiddleware = require('../utils/handleMiddleware')

const router = express.Router()

// 設定 Multer 來處理文件上傳
const upload = multer({ storage: multer.memoryStorage() })


router.post('/create/title',...handleMiddleware([isAuth], courseController.createCourseTitle) ) // 新增課程
// 單個圖片上傳
router.post('/:course_id/upload/course-banner-image', upload.single('banner'), ...handleMiddleware([isAuth], courseController.uploadCourseBanner))

// ...handleMiddleware([isAuth], userController.getUserData)
// 多個文件上傳
router.post('/upload-course-materials', upload.array('materials', 5), courseController.uploadCourseMaterials)

module.exports = router
