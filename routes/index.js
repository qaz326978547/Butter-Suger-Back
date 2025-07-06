const userRouter = require('./users.route')
const teacherRouter = require('./teacher.route')
const teacherApplicationsRouter = require('./teacherApplications.route')
const adminRouter = require('./admin.route')
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
  app.use('/api/v1/admin', adminRouter)
  app.use('/api/v1/teacher-applications', teacherApplicationsRouter)
  app.use('/api/v1/course', coursesRouter)  //路由強關聯
  app.use('/api/v1/course', courseUploadRoutes)  //路由強關聯
  app.use('/api/v1/course', courseSectionRouter)  //路由強關聯
  app.use('/api/v1/course', subsectionRouter) //路由強關聯
  /* app.use('/api/v1/section', courseSectionRouter) */
  app.use('/api/v1/cart', cartRouter)
  /* app.use('/api/v1/subsection', subsectionRouter) */
  app.use('/api/v1/subsection/upload', subsectionUploadRouter)
  app.use('/api/v1/orders', orderRouter)
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
  app.use('/api/v1/admin/queues', bullBoardRouter)
}
