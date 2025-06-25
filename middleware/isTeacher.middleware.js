const { appError } = require('../utils/responseFormat')

module.exports = (req, res, next) => {
    if(!req.user || req.user.role !=='teacher'){
        return next(appError(401, '使用者尚未成為教師'))
    }
    next()
}