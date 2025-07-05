const userRouter = require('./users.route')
const teacherRouter = require('./teacher.route')
const courseUploadRoutes = require('./courseUpload.route')
const coursesRouter = require('./courses.route')
const courseSectionRouter = require('./section.route')
const subsectionRouter = require('./subsection.route')
const subsectionUploadRouter = require('./subsectionUpload.route')
const cartRouter = require('./cart.route')
const orderRouter = require('./order.route')
const swaggerUi = require('swagger-ui-express')
const swaggerDocument = require('../swagger-output.json')
const bullBoardRouter = require('./bullBoard.route')

module.exports = (app) => {
  app.use('/api/v1/users', userRouter)
  app.use('/api/v1/teacher', teacherRouter)
  app.use('/api/v1/course', coursesRouter)
  app.use('/api/v1/course', courseUploadRoutes)
  app.use('/api/v1/course', courseSectionRouter)
  /* app.use('/api/v1/section', courseSectionRouter) */
  app.use('/api/v1/cart', cartRouter)
  app.use('/api/v1/course', subsectionRouter)
/*   app.use('/api/v1/subsection', subsectionRouter) */
  app.use('/api/v1/subsection/upload', subsectionUploadRouter)
/*   app.use('/api/v1/order', orderRouter) */
  app.use('/api/v1/orders', orderRouter)
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
  app.use('/api/v1/admin/queues', bullBoardRouter)
}
