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
router.post('/:courseId/upload/course-banner-image', upload.single('banner'), ...handleMiddleware([isAuth], courseController.uploadCourseBanner))

// ...handleMiddleware([isAuth], userController.getUserData)
// 多個文件上傳
router.post('/upload-course-materials', upload.array('materials', 5), courseController.uploadCourseMaterials)

// 取得首頁熱門課程資料
router.get('/popular', courseController.getPopularCourses)

//取得所有課程, 測試用，塞資料，非正式格式 
router.get('/', courseController.getCourseList)

//建立新課程, 測試用，塞資料，非正式格式 
router.post('/', courseController.postCourse)

//取得所有類別, 測試用，塞資料，非正式格式 
router.get('/course-category', courseController.getCategory)

//建立新類別, 測試用，塞資料，非正式格式 
router.post('/course-category', courseController.postCategory)

//取得所有評價, 測試用，塞資料，非正式格式 
router.get('/ratings', courseController.getRatings)

//新增評價, 測試用，塞資料，非正式格式  
router.post('/:courseId/ratings', ...handleMiddleware([isAuth], courseController.postRatings))


//取得單一課程, 測試用，塞資料，非正式格式 
router.get('/:courseId', courseController.getCourse)

module.exports = router
