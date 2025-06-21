// workers/videoUpload.worker.js
const videoUploadQueue = require('../queues/videoUpload.queue')
const { saveVideoInfoToDB } = require('../services/updateCourseMedia/updateCourseMedia.service')

videoUploadQueue.process(async (job) => {
    const { subsectionId, videoUrl, videoName, videoSize, videoType } = job.data
    const result = await saveVideoInfoToDB({ subsectionId, videoUrl, videoName, videoSize, videoType })
    return result // ✅ Bull UI 中會顯示 returnValue
  })
  
