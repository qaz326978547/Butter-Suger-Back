const http = require('http')
const { Server } = require('socket.io') // ✅ 新增
const config = require('../config/index')
const app = require('../app')
const logger = require('../utils/logger')('www')
const seedCourseCategories = require('../db/seed/createCourseCategoriesSeed')
const { dataSource } = require('../db/data-source')

const port = config.get('web.port')

// ✅ 建立 HTTP Server 並初始化 Socket.IO
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*', // 記得正式環境換成特定網域
    methods: ['GET', 'POST'],
  },
})

// ✅ 將 io 設定進 app，讓其他模組可以使用 app.get('io')
app.set('io', io)

io.on('connection', (socket) => {
  console.log('[Socket.IO] 使用者連線:', socket.id)

  // 客戶端登入後呼叫 socket.emit('join', userId)
  socket.on('join', (userId) => {
    socket.join(userId)
    console.log(`[Socket.IO] 使用者 ${userId} 加入房間`)
  })
})

function onError(error) {
  if (error.syscall !== 'listen') {
    logger.error('Unexpected error on server:', error)
    throw error
  }
  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`
  switch (error.code) {
    case 'EACCES':
      logger.error(`${bind} requires elevated privileges`)
      process.exit(1)
      break
    case 'EADDRINUSE':
      logger.error(`${bind} is already in use`)
      process.exit(1)
      break
    default:
      logger.error(`Exception on ${bind}: ${error.code}`, error)
      process.exit(1)
  }
}

server.on('error', onError)

server.listen(port, async () => {
  try {
    logger.info(`Server starting on port ${port}...`)

    await dataSource.initialize()
    await seedCourseCategories()
    logger.info('Seed course categories 完成')
    logger.info('資料庫連線成功')
    logger.info(`伺服器運作中. port: ${port}`)
  } catch (error) {
    logger.error(`資料庫連線失敗: ${error.stack || error.message}`)
    console.error(error)
    process.exit(1)
  }
})
