const express = require('express')
const router = express.Router()
const adminController = require('../controllers/admin.controller')
const isAuth = require('../middleware/isAuth.middleware')
const isAdmin = require('../middleware/isAdmin.middleware')
const handleMiddleware = require('../utils/handleMiddleware')


//取得系統日誌
router.get('/system-log', ...handleMiddleware([isAuth, isAdmin], adminController.getSystemLog))

// 取得所有申請者資料
router.get('/teacher-applications', ...handleMiddleware([isAuth, isAdmin], adminController.getApplicationsData))

// 取得單一申請者資料
router.get('/teacher-applications/:applicationId', ...handleMiddleware([isAuth, isAdmin], adminController.getOneApplicationData))

// 審核教師申請
router.patch('/teacher-applications/:applicationId/status', ...handleMiddleware([isAuth, isAdmin], adminController.patchApplicationsData))


module.exports = router
