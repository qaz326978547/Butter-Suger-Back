// routes/course.js
const express = require('express')
const multer = require('multer')
const courseController = require('../controllers/course.controller')

const router = express.Router()

// 設定 Multer 來處理文件上傳
const upload = multer({ storage: multer.memoryStorage() })


router.post('/create', courseController.createCourseTitle) // 新增課程
// 單個圖片上傳
router.post('/:id/upload-course-banner', upload.single('banner'), courseController.uploadCourseBanner)

// 多個文件上傳
router.post('/upload-course-materials', upload.array('materials', 5), courseController.uploadCourseMaterials)

module.exports = router
