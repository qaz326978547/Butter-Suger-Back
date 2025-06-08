// routes/index.js
const userRouter = require('./users.route')
const teacherRouter = require('./teacher.route')
const courseUploadRoutes = require('./courseUpload.route')
const coursesRouter = require('./courses.route')
const cartRouter = require('./cart.route')

module.exports = (app) => {
  app.use('/api/v1/users', userRouter)
  app.use('/api/v1/teacher', teacherRouter)
  app.use('/api/v1/course', coursesRouter)
  app.use('/api/v1/course', courseUploadRoutes)
  app.use('/api/v1/cart', cartRouter)
}
