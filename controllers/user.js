const { dataSource } = require('../db/data-source')
const { appError, sendResponse } = require('../utils/responseFormat')
const { generateJWT, verifyJWT } = require('../utils/jwtUtils')

const userController = {
  // 取得 google 基本資料
  async getGoogleProfile(req, res, next) {
    try {
      // 確保 passport 已帶入 user 資料
      if (!req.user || !req.user.id) {
        return next(appError(400, '登入失敗，缺少使用者資訊'))
      }

      // 確保 email 經過驗證
      const emailVerified = req.user.emails?.[0]?.verified
      if (!emailVerified) {
        return next(appError(401, '登入失敗，使用者電子郵件未經驗證'))
      }

      const userRepo = dataSource.getRepository('users')

      // 查找是否已有該 Google 使用者
      let findUser = await userRepo.findOne({
        select: ['id', 'name', 'nickname', 'role', 'email', 'login_count', 'profile_image_url'],
        where: { google_id: req.user.id },
      })

      // 若不存在，建立新使用者
      if (!findUser) {
        const newUser = userRepo.create({
          google_id: req.user.id,
          name: `${req.user.name.familyName}${req.user.name.givenName}`,
          nickname: req.user.displayName,
          role: 'student',
          email: req.user.emails?.[0]?.value,
          is_verified: true,
          login_count: 1,
          profile_image_url: req.user.photos?.[0]?.value || '',
          google_token: req.user.accessToken,
          last_login_at: new Date(),
        })

        await userRepo.save(newUser)

        // 重新查找新建帳號的完整資訊
        findUser = await userRepo.findOne({
          select: ['id', 'role', 'name', 'nickname', 'email', 'profile_image_url'],
          where: { google_id: req.user.id },
        })
      } else {
        // 已存在：更新 token 與登入次數
        const updateResult = await userRepo.update(
          { id: findUser.id },
          {
            google_token: req.user.accessToken,
            login_count: findUser.login_count + 1,
            last_login_at: new Date(),
          }
        )

        if (updateResult.affected === 0) {
          return next(appError(400, '登入失敗，請重新登入'))
        }
      }

      // 產生 JWT
      const token = generateJWT({
        id: findUser.id,
        role: findUser.role,
      })

      // 傳回 JSON 給前端
      return sendResponse(
        res,
        200,
        true,
        '登入成功',
        {
          id: findUser.id,
          name: findUser.name || `${req.user.name.familyName}${req.user.name.givenName}`,
          displayName: findUser.nickname || req.user.displayName,
          email: findUser.email || req.user.emails?.[0]?.value,
          photos: findUser.profile_image_url || req.user.photos?.[0]?.value || '',
          verified: true,
        },
        {
          accessToken: token,
          userId: findUser.id,
        }
      )
    } catch (error) {
      next(error)
    }
  },
}

module.exports = userController
