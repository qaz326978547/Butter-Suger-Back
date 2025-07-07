const { appError } = require('../utils/responseFormat')

module.exports = (req, res, next) => {
    const allowedRoles = ['teacher', 'admin']
/*     if(!req.user || !allowedRoles.includes(req.user.role)){
        return next(appError(401, '使用者尚未成為教師'))
    } */

    if(req.user && req.user.role==='admin'){
        next()        
    }

    if(!req.user || req.user.role !=='teacher'){
        return next(appError(401, '使用者尚未成為教師'))
    }
    
    next()
}