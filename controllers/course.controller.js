const storage = require('../services/storage')
const { appError, sendResponse } = require('../utils/responseFormat')

const courseController = {
  async uploadCourseBanner(req, res, next) {
    try {
      if (!req.file) {
        return next(appError(400, '請上傳圖片'))
      }

      const imageUrl = await storage.upload(req.file, 'course-banners')
      return sendResponse(res, 200, true, '圖片上傳成功', { imageUrl })
    } catch (error) {
      return next(appError(500, error.message || '圖片上傳失敗'))
    }
  },

  async uploadCourseMaterials(req, res, next) {
    try {
      if (!req.files || req.files.length === 0) {
        return next(appError(400, '請上傳檔案'))
      }

      const fileUrls = await Promise.all(
        req.files.map(file => storage.upload(file, 'course-materials'))
      )

      return sendResponse(res, 200, true, '教材上傳成功', { files: fileUrls })
    } catch (error) {
      console.error('上傳教材錯誤:', error)
      return next(appError(500, error.message || '教材上傳失敗'))
    }
  }
}

module.exports = courseController
