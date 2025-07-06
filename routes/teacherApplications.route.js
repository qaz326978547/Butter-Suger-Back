const express = require('express')
const router = express.Router()
const teacherApplicationsController = require('../controllers/teacherApplications.controller')
const isAuth = require('../middleware/isAuth.middleware')
const validateSchema = require('../middleware/validateSchema.middleware')
const { updateTeacherSchema } = require('../schema/teacher.schema')
const handleMiddleware = require('../utils/handleMiddleware')


// 取得教師申請狀態
router.get('/', ...handleMiddleware([isAuth], teacherApplicationsController.getApplicationsData))

// 申請成為教師
router.post('/', ...handleMiddleware([isAuth], teacherApplicationsController.postApplicationsData))

// 修改教師申請資料
router.patch('/:applicationId', ...handleMiddleware([isAuth], teacherApplicationsController.patchApplicationsData))

module.exports = router