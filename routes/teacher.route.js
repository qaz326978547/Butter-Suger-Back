const express = require('express')
const router = express.Router()
const teacherController = require('../controllers/teacher.controller')
const isAuth = require('../middleware/isAuth.middleware')
const validateSchema = require('../middleware/validateSchema.middleware')
const { updateTeacherSchema } = require('../schema/teacher.schema')
const handleMiddleware = require('../utils/handleMiddleware')
const multer = require('multer');
const upload = multer();

// 老師權限最後再加
// 取得教師資料
router.get('/profile', ...handleMiddleware([isAuth], teacherController.getTeacherData))

//更新教師資料
router.patch('/profile', ...handleMiddleware([upload.single('file'), isAuth, validateSchema(updateTeacherSchema), teacherController.updateTeacherData]))

// 取得教師精選資料(評價分數前 10 個)
router.get('/featured', teacherController.getTeacherFeatured)

// 取得單一精選教師資料
router.get('/:teacherId', teacherController.getSingleFeaturedTeacherData)

module.exports = router
