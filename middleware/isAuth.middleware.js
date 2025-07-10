const { dataSource } = require('../db/data-source')
const { appError } = require('../utils/responseFormat')
const { verifyJWT } = require('../utils/jwtUtils')
const logger = require('../utils/logger')('isAuth')

const isAuth = async (req, res, next) => {
  try {
    // 確認 token 是否存在並取出 token
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer')) {
      //401: 請先登入!
      next(appError(401, '請先登入!'))
      return
    }
    // 取出 token
    const token = authHeader.split(' ')[1]
    //驗證 token
    const decoded = await verifyJWT(token)
    // 尋找對應 id 的使用者
    const currentUser = await dataSource.getRepository('users').findOne({
      select: ['id', 'role'],
      where: {
        id: decoded.id,
      },
    })

    if (!currentUser) {
      next(appError(404, '查無個人資料，請重新登入'))
      return
    }
    req.user = currentUser

    next()
  } catch (error) {
    logger.error(error.message)
    next(error)
  }
}

module.exports = isAuth
