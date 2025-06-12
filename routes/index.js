// routes/index.js
const userRouter = require('./users.route')
const teacherRouter = require('./teacher.route')
const courseUploadRoutes = require('./courseUpload.route')
const coursesRouter = require('./courses.route')
const cartRouter = require('./cart.route')
const orderRouter = require('./order.route')
const swaggerUi = require('swagger-ui-express')
const swaggerDocument = require('../swagger-output.json')
module.exports = (app) => {
  app.use('/api/v1/users', userRouter)
  app.use('/api/v1/teacher', teacherRouter)
  app.use('/api/v1/course', coursesRouter)
  app.use('/api/v1/course', courseUploadRoutes)
  app.use('/api/v1/cart', cartRouter)
  app.use('/api/v1/order', orderRouter)
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
}
