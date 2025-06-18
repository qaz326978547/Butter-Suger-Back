// routes/course.js
const express = require('express')
const multer = require('multer')
const courseController = require('../controllers/course.controller')
const isAuth = require('../middleware/isAuth.middleware')
const handleMiddleware = require('../utils/handleMiddleware')
const { saveCourseSchema } = require('../schema/course.schema')
const router = express.Router()
const validateSchema = require('../middleware/validateSchema.middleware')

router.get('/list', courseController.getCourseList)
router.get('/category', courseController.getCourseCategoryList)
router.get('/category/:categoryId', courseController.getCourseCategory)
router.get('/:courseId/handouts', ...handleMiddleware([isAuth], courseController.getCourseHandOuts))
router.post(
  '/:courseId/category',
  ...handleMiddleware([isAuth], courseController.createCourseCategory)
)
router.post(
  '/:courseId/save',
  ...handleMiddleware([isAuth, validateSchema(saveCourseSchema)], courseController.saveCourse)
)
router.post('/create/title', ...handleMiddleware([isAuth], courseController.createCourseTitle))

// ❗️這一行放最後！
router.get('/:courseId', courseController.getCourse)

module.exports = router
