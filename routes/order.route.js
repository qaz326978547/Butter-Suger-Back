const express = require('express')
const router = express.Router()
const orderController = require('../controllers/order.controller')
const isAuth = require('../middleware/isAuth.middleware')
const handleMiddleware = require('../utils/handleMiddleware')

// 確認付款狀態
router.get('/', ...handleMiddleware([isAuth], orderController.getOrder))

module.exports = router
