const path = require('path')
const storage = require('../storage/index')
const { dataSource } = require('../../db/data-source')
const { appError } = require('../../utils/responseFormat')

const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  video: ['video/mp4', 'video/quicktime', 'video/webm'],
  handOut: ['application/pdf'],
}

const formatFileSize = (size) => {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

/**
 * 更新課程圖片或影片
 * @param {Object} options
 * @param {string} options.courseId - 課程 ID
 * @param {Object} options.file - 上傳的檔案
 * @param {string} options.folderName - 上傳目標資料夾
 * @param {string} options.fieldName - 要更新的資料庫欄位名稱
 * @param {'image'|'video'} [options.type='image'] - 限制檔案格式類型（image 或 video）
 */
const updateCourseMediaService = async ({
  courseId,
  file,
  folderName, // 上傳目標資料夾
  fieldName, // 資料庫欄位名稱，例如 'image' 或 'video'
  type = 'image',
}) => {
  if (!courseId || !file) {
    throw appError(400, '請上傳檔案與課程 ID')
  }

  // 驗證檔案類型
  const allowedTypes = ALLOWED_MIME_TYPES[type]
  if (!allowedTypes.includes(file.mimetype)) {
    throw appError(400, `僅允許上傳 ${type === 'image' ? '圖片' : '影片'} 格式`)
  }

  const courseRepo = dataSource.getRepository('courses')
  const course = await courseRepo.findOne({ where: { id: courseId } })
  if (type === 'video') {
    course['trailer_status'] = 'processing' // 假設預告片上傳後狀態為 '上傳中'
    await courseRepo.save(course) // 先存「上傳中」狀態
  }
  if (!course) {
    throw appError(404, '課程不存在')
  }

  const mediaUrl = await storage.upload(file, folderName)
  course[fieldName] = mediaUrl
  if (type === 'video') {
    course['trailer_name'] = file.originalname || '未命名預告片'
    course['trailer_size'] = formatFileSize(file.size || 0)
    course['trailer_status'] = 'ready' // 假設預告片上傳後狀態為 '上傳完成'
    course['trailer_type'] = file.mimetype || 'video/mp4'
  }
  await courseRepo.save(course)

  return mediaUrl
}

/**
 * 刪除課程的圖片或影片
 * @param {Object} options
 * @param {string} options.courseId - 課程 ID
 * @param {string} options.fieldName - 要清除的欄位（對應 image 或 video URL）
 */
const deleteCourseMedia = async ({ courseId, fieldName }) => {
  if (!courseId || !fieldName) {
    throw appError(400, '缺少必要參數')
  }

  const courseRepo = dataSource.getRepository('courses')
  const course = await courseRepo.findOne({ where: { id: courseId } })

  if (!course) {
    throw appError(404, '課程不存在')
  }

  const mediaUrl = course[fieldName]
  if (!mediaUrl) {
    throw appError(400, '該欄位沒有對應的媒體資源')
  }

  // 呼叫自定義 storage.delete 來刪除雲端檔案
  await storage.delete(mediaUrl)

  // 清空欄位並儲存
  course[fieldName] = null
  await courseRepo.save(course)

  return true
}

/**
 * 上傳講義
 * @param {Object} options
 * @param {string} options.courseId - 課程 ID
 * @param {Object} options.file - 上傳的 PDF 檔案
 * @param {string} options.folderName - 上傳至的資料夾名稱
 */
const uploadHandoutService = async ({ courseId, file, folderName }) => {
  if (!courseId || !file) {
    throw appError(400, '缺少課程 ID 或檔案')
  }

  if (!ALLOWED_MIME_TYPES.handOut.includes(file.mimetype)) {
    throw appError(400, '僅允許上傳 PDF 格式的講義')
  }

  const courseRepo = dataSource.getRepository('courses')
  const handoutRepo = dataSource.getRepository('course_handouts')

  const course = await courseRepo.findOne({ where: { id: courseId } })
  if (!course) {
    throw appError(404, '課程不存在')
  }

  // 上傳到 storage
  const fileUrl = await storage.upload(file, folderName)

  if (!fileUrl) {
    throw appError(500, '檔案上傳失敗，請稍後再試')
  }

  const handout = handoutRepo.create({
    course_id: courseId,
    name: file.originalname || '未命名講義',
    url: fileUrl,
    size: formatFileSize(file.size || 0),
    type: file.mimetype || 'application/pdf',
  })

  await handoutRepo.save(handout)

  return handout
}

const deleteVideo = async (courseId) => {
  if (!courseId) {
    throw appError(400, '缺少課程 ID')
  }

  const courseRepo = dataSource.getRepository('courses')
  const course = await courseRepo.findOne({ where: { id: courseId } })
  if (!course) {
    throw appError(404, '課程不存在')
  }

  // 刪除雲端檔案，避免因刪除失敗而影響流程
  try {
    await storage.delete(course.trailer_url)
  } catch (error) {
    console.error('刪除雲端檔案失敗:', error)
    // 視情況是否繼續刪除資料庫紀錄
  }

  course.trailer_url = null
  course.trailer_name = null
  course.trailer_size = null
  course.trailer_type = null
  course.trailer_status = 'not_uploaded' // 重置狀態

  await courseRepo.save(course)

  return { message: '預告片已成功刪除' }
}

/** * 刪除講義
 * @param {Object} options
 * @param {string} options.handoutId - 講義 ID
 */
const deleteHandout = async ({ handoutId }) => {
  if (!handoutId) {
    throw appError(400, '缺少講義 ID')
  }

  const handoutRepo = dataSource.getRepository('course_handouts')
  const handout = await handoutRepo.findOne({ where: { id: handoutId } })
  if (!handout) {
    throw appError(404, '講義不存在')
  }

  // 刪除雲端檔案，避免因刪除失敗而影響流程
  try {
    await storage.delete(handout.url)
  } catch (error) {
    console.error('刪除雲端檔案失敗:', error)
    // 視情況是否繼續刪除資料庫紀錄
  }

  await handoutRepo.delete(handoutId)

  return { message: '講義已成功刪除' }
}

module.exports = {
  updateCourseMediaService,
  uploadHandoutService,
  deleteHandout,
  deleteCourseMedia,
  deleteVideo,
}
