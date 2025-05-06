const handleErrorAsync = require('../middleware/handleErrorAsync.middleware')

const handleMiddleware = (middlewares, controller) => {
  return [...middlewares, handleErrorAsync(controller)]
}
module.exports = handleMiddleware
