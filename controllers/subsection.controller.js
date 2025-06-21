// controllers/subsection.controller.js
const { dataSource } = require('../db/data-source')
const { sendResponse, appError } = require('../utils/responseFormat')
const wrapAsync = require('../utils/wrapAsync')
const videoUploadQueue = require('../queues/videoUpload.queue')
const storage = require('../services/storage')

const subsectionController = {
  // 取得某章節的小節列表
  getSubsectionsBySectionId: wrapAsync(async (req, res, next) => {
    const { sectionId } = req.params
    const repo = dataSource.getRepository('course_subsection')
    const list = await repo.find({
      where: { section_id: sectionId },
      order: { order_index: 'ASC' },
    })

    return sendResponse(res, 200, true, '取得小節成功', { subsections: list })
  }),

  // 新增小節
  createSubsection: wrapAsync(async (req, res, next) => {
    const { section_id, order_index, subsection_title, is_preview_available } = req.body

    if (!section_id || !subsection_title) {
      return next(appError(400, '缺少必要欄位'))
    }

    const repo = dataSource.getRepository('course_subsection')
    const subsection = repo.create({
      section_id,
      order_index,
      subsection_title,
      video_file_url: null,
      video_duration: null,
      uploaded_at: null,
      status: 'processing',
      is_preview_available,
    })

    await repo.save(subsection)
    return sendResponse(res, 201, true, '小節建立成功', { subsection })
  }),

  // 上傳小節影片（推送到 Bull 佇列）
  uploadSubsectionVideo: wrapAsync(async (req, res, next) => {
    const { subsectionId } = req.params
    const file = req.file
  
    if (!file || !subsectionId) {
      return next(appError(400, '缺少影片檔案或小節 ID'))
    }
  
    // ✅ 上傳影片至 S3，取得 URL
    const videoUrl = await storage.upload(file, 'course-subsection-videos')
  
    // ✅ 推送 job 到 queue，只傳基本資訊（避免傳遞 Buffer）
    await videoUploadQueue.add({
      subsectionId,
      videoUrl,
      videoName: file.originalname,
      videoSize: file.size,
      videoType: file.mimetype,
    })
  
    return sendResponse(res, 202, true, '影片已提交處理中')
  }),

  // 更新小節
  updateSubsection: wrapAsync(async (req, res, next) => {
    const repo = dataSource.getRepository('course_subsection')
    const subsection = await repo.findOne({ where: { id: req.params.id } })

    if (!subsection) return next(appError(404, '找不到小節'))

    repo.merge(subsection, req.body)
    const result = await repo.save(subsection)

    return sendResponse(res, 200, true, '小節更新成功', { subsection: result })
  }),

  // 刪除小節（含影片資源）
  deleteSubsection: wrapAsync(async (req, res, next) => {
    const repo = dataSource.getRepository('course_subsection')
    const subsection = await repo.findOne({ where: { id: req.params.id } })

    if (!subsection) return next(appError(404, '找不到小節'))

    if (subsection.video_file_url) {
      try {
        await storage.delete(subsection.video_file_url)
      } catch (err) {
        console.warn('刪除小節影片失敗（可忽略）:', err.message || err)
      }
    }

    await repo.remove(subsection)
    return sendResponse(res, 200, true, '小節與影片已成功刪除')
  }),

  // 刪除小節影片（保留小節資料）
  deleteSubsectionVideo: wrapAsync(async (req, res, next) => {
    const { subsectionId } = req.params
    const repo = dataSource.getRepository('course_subsection')
    const subsection = await repo.findOne({ where: { id: subsectionId } })

    if (!subsection) return next(appError(404, '找不到小節'))

    if (!subsection.video_file_url) {
      return next(appError(400, '此小節尚未上傳影片'))
    }

    try {
      await storage.delete(subsection.video_file_url)
    } catch (err) {
      console.warn('刪除影片失敗（可忽略）:', err.message || err)
    }

    subsection.video_file_url = null
    subsection.video_duration = null
    subsection.uploaded_at = null
    subsection.status = 'processing'
    await repo.save(subsection)

    return sendResponse(res, 200, true, '影片已成功刪除')
  }),
}

module.exports = subsectionController
