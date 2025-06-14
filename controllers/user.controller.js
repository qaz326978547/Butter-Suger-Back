const { dataSource } = require('../db/data-source')
const { appError, sendResponse } = require('../utils/responseFormat')
const { generateJWT, verifyJWT } = require('../utils/jwtUtils')
const cleanUndefinedFields = require('../utils/cleanUndefinedFields')
const storage = require('../services/storage')

const userController = {
  /*
  * 取得 google 登入後使用者基本資料
  * @route GET - /api/v1/users/auth/google/callback
  */
  async getGoogleProfile(req, res, next) {
    // #swagger.ignore = true
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

      // 傳回 JSON 給前端，token= 測試用(暫不考慮安全性)
      return res.redirect(
        `${process.env.FRONTEND_URL}/login-success?token=${token}&id=${findUser.id}`
      )
    } catch (error) {
      next(error)
    }
  },

  /*
  * 取得使用者資料
  * @route GET - /api/v1/users/info
  */
  async getUserData(req, res, next) {
    try {
      const userId = req.user.id
      const userRepo = dataSource.getRepository('users')

      // 確認使用者是否存在
      const findUser = await userRepo.findOne({
        select: [
          'id',
          'name',
          'nickname',
          'email',
          'profile_image_url',
          'phone',
          'birthday',
          'address',
        ],
        where: { id: userId },
      })

      if (!findUser) {
        return next(appError(404, '查無個人資料，請重新登入'))
      }

      // 回傳使用者資料
      sendResponse(res, 200, true, '取得使用者資料成功', findUser)
    } catch (error) {
      next(error)
    }
  },

  /*
  * 驗證使用者是否登入
  * @route GET - /api/v1/users/check
  */
  async getCheck(req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer')) {
      //401: 請先登入!
      next(appError(401, '驗證錯誤，token 無效或是不存在'))
      return
    }

    // 取出 token
    const token = authHeader.split(' ')[1]
    //驗證 token
    const decoded = await verifyJWT(token)

    if (!decoded) {
      if (!authHeader || !authHeader.startsWith('Bearer')) {
        //401: 請先登入!
        next(appError(401, '驗證錯誤，token 無效或是不存在'))
        return
      }
    }

    // 尋找對應 id 的使用者
    const currentUser = await dataSource.getRepository('users').findOne({
      select: ['id'],
      where: {
        id: decoded.id,
      },
    })

    if (!currentUser) {
      next(appError(401, '驗證錯誤，token 無效或是不存在'))
      return
    }

    return sendResponse(res, 200, true, '驗證成功')
  },

  /*
  * 更新使用者資料
  * @route PATCH - /api/v1/users/update
  */
  async updateUserData(req, res, next) {
    try {
      const userId = req.user.id
      const { name, nickname, phone, birthday, address } = req.body

      const userRepo = dataSource.getRepository('users')

      const findUser = await userRepo.findOne({
        select: ['id', 'name', 'nickname', 'email', 'profile_image_url'],
        where: { id: userId },
      })

      if (!findUser) {
        return next(appError(404, '查無個人資料，請重新登入'))
      }
 
      // 清理未定義的欄位
      const updateData = cleanUndefinedFields({
        name,
        nickname,
        phone,
        birthday,
        address,
        profile_image_url: findUser.profile_image_url || ''  //後面會判斷 req.file
      })


      if (req.file) {
          updateData.profile_image_url = await storage.upload(req.file, 'users')
      }      

      // 更新使用者資料
      const updateResult = await userRepo.update({ id: userId }, updateData)

      if (updateResult.affected === 0) {
        return next(appError(400, '更新失敗，請稍後再試'))
      }

      // 重新查找更新後的使用者資料
      const updatedUser = await userRepo.findOne({
        select: ['id', 'name', 'nickname', 'email', 'profile_image_url'],
        where: { id: userId },
      })

      if (!updatedUser) {
        return next(appError(404, '查無個人資料，請重新登入'))
      }

      return sendResponse(res, 200, true, '成功更新使用者資料')
    } catch (error) {
      return next(error)
    }
  },
}

module.exports = userController
