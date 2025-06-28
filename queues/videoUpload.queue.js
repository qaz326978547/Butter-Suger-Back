// queues/videoUpload.queue.js
const Queue = require('bull')
require('dotenv').config()

const videoUploadQueue = new Queue('video-upload-queue', {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD || undefined, // 有密碼再填
    connectTimeout: 5000, // 連線超時設定 5 秒
  },
})

videoUploadQueue.on('error', (err) => {
  console.error('❌ Redis 連線錯誤:', err)
})
videoUploadQueue.on('ready', () => {
  console.log('✅ Bull queue ready')
})

module.exports = videoUploadQueue
