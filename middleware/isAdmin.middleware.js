const { appError } = require('../utils/responseFormat')

module.exports = (req, res, next) => {
    if(!req.user || req.user.role !=='admin'){
        return next(appError(401, '權限不足，此動作需要管理者權限'))
    }
    next()
}