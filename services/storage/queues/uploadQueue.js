const Queue = require('bull')

const uploadQueue = new Queue('uploadQueue', {
  redis: { port: 6379, host: '127.0.0.1' }, // 依你的 Redis 設定調整
})

module.exports = uploadQueue
