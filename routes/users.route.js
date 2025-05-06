const express = require('express')
const router = express.Router()
const passport = require('passport')
const userController = require('../controllers/user.controller')
const handleErrorAsync = require('../middleware/handleErrorAsync.middleware')
const isAuth = require('../middleware/isAuth.middleware')
const validateSchema = require('../middleware/validateSchema.middleware')
const { updateUserSchema } = require('../schema/user.schema')
const handleMiddleware = require('../utils/handleMiddleware')

router.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    accessType: 'offline', // 這個參數會要求 Google 返回 refresh token
    prompt: 'consent', // 這個參數會強制 Google 顯示授權頁面，即使用戶之前已經授權過
  })
)
// Passport 會使用收到的 code 去向 Google 請求交換用戶資料。如果成功，req.user 會包含來自 Google 的用戶資料，然後儲存用戶資料。
router.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/auth/failed',
  }),
  userController.getGoogleProfile // ⬅️ 呼叫你剛剛寫的 getGoogleProfile
)

// 取得使用者資料
router.get('/info', ...handleMiddleware([isAuth], userController.getUserData))
// 驗證使用者是否登入
router.get('/check', ...handleMiddleware([isAuth], userController.getCheck))

//更新使用者資料
router.patch(
  '/update',
  ...handleMiddleware([isAuth, validateSchema(updateUserSchema), userController.updateUserData])
)

module.exports = router
