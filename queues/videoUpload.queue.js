// queues/videoUpload.queue.js
const Queue = require('bull')
require('dotenv').config()

const videoUploadQueue = new Queue('video-upload-queue', {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD || undefined, // 有密碼再填
  },
})

module.exports = videoUploadQueue
