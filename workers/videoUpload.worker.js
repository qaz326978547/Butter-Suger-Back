const videoUploadQueue = require('../queues/videoUpload.queue')
const { saveVideoInfoToDB } = require('../services/updateCourseMedia/updateCourseMedia.service')

// 若需取得 app 實例
const app = require('../app') // 確保這裡有正確 export 出來
const io = app.get('io') // 取得 Socket.IO 實例

videoUploadQueue.process(async (job) => {
  const { subsectionId, videoUrl, videoName, videoSize, videoType, userId } = job.data

  const result = await saveVideoInfoToDB({
    subsectionId,
    videoUrl,
    videoName,
    videoSize,
    videoType,
  })

  // ✅ 傳送給特定使用者
  if (userId && io) {
    console.log('📡 準備傳送 socket 訊息')
    io.to(userId).emit('video-upload-success', {
      subsectionId,
      videoUrl,
      message: '影片已成功上傳',
    })
  }

  return result
})
