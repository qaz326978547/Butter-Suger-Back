const express = require('express')
const router = express.Router()
const teacherController = require('../controllers/teacher.controller')
const isAuth = require('../middleware/isAuth.middleware')
const isTeacher = require('../middleware/isTeacher.middleware')
const isAdmin = require('../middleware/isAdmin.middleware')
const validateSchema = require('../middleware/validateSchema.middleware')
const { updateTeacherSchema } = require('../schema/teacher.schema')
const handleMiddleware = require('../utils/handleMiddleware')
const multer = require('multer');
const upload = multer();


// 取得教師資料
router.get('/profile', ...handleMiddleware([isAuth, isTeacher], teacherController.getTeacherData))

// 取得教師課程
router.get('/teacherCourse', ...handleMiddleware([isAuth, isTeacher], teacherController.getTeacherCourse))

// 取得教師收益表
router.get('/revenue', ...handleMiddleware([isAuth, isTeacher], teacherController.getTeacherRevenue))

//更新教師資料
router.patch('/profile', ...handleMiddleware([upload.single('file'), isAuth, validateSchema(updateTeacherSchema), teacherController.updateTeacherData]))

//更新教師狀態
router.patch('/teacherStatus/:studentId', ...handleMiddleware([isAuth, isAdmin], teacherController.updateTeacherStatus))

// 取得教師精選資料(評價分數前 10 個)
router.get('/featured', teacherController.getTeacherFeatured)

// 取得單一精選教師資料
router.get('/:teacherId', teacherController.getSingleFeaturedTeacherData)

module.exports = router
