const express = require('express')
const router = express.Router()
const cartController = require('../controllers/cart.controller')
const isAuth = require('../middleware/isAuth.middleware')
const handleMiddleware = require('../utils/handleMiddleware')

// 取得購物車資料
router.get('/', ...handleMiddleware([isAuth], cartController.getCartItems))

// 購物車加入課程
router.post('/', ...handleMiddleware([isAuth], cartController.postCartItems))

// 登入後整合購物車
router.post('/merge', ...handleMiddleware([isAuth], cartController.mergeCartItems))

//結帳
router.post('/checkout', ...handleMiddleware([isAuth], cartController.checkout))

//結帳成功
router.post('/newebpay_return', cartController.newebpayReturn)

//確認交易
router.post('/newebpay_notify', cartController.newebpayNotify)

// 取得購物車資料
router.delete('/:cartItemId', ...handleMiddleware([isAuth], cartController.deleteCartItems))

module.exports = router
