const http = require('http')
const config = require('../config/index')
const app = require('../app')
const logger = require('../utils/logger')('www')
const { dataSource } = require('../db/data-source')

const port = config.get('web.port')

// 印出環境變數和設定的 port，方便確認
console.log('--- Startup Info ---')
console.log('process.env.PORT:', process.env.PORT)
console.log('config.web.port:', port)
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? 'set' : 'NOT SET')
console.log(
  'Database config:',
  JSON.stringify({
    type: process.env.DB_TYPE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
  })
)

app.set('port', port)

const server = http.createServer(app)

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
    logger.info('資料庫連線成功')
    logger.info(`伺服器運作中. port: ${port}`)
  } catch (error) {
    logger.error(`資料庫連線失敗: ${error.stack || error.message}`)
    // 額外印出錯誤完整資訊
    console.error(error)
    process.exit(1)
  }
})
