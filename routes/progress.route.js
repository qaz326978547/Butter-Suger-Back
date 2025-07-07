const express = require('express')
const router = express.Router()
const progressController = require('../controllers/progress.controller')
const isAuth = require('../middleware/isAuth.middleware')
const validateSchema = require('../middleware/validateSchema.middleware')
const { updateTeacherSchema } = require('../schema/teacher.schema')
const handleMiddleware = require('../utils/handleMiddleware')


// 新增章節進度
router.post('/subsections/:subsectionId/progress', ...handleMiddleware([isAuth], progressController.postProgress))

// 標記章節進度
router.patch('/subsections/:subsectionId/progress', ...handleMiddleware([isAuth], progressController.patchProgress))

module.exports = router