const storage = require('../services/storage')
const { appError, sendResponse } = require('../utils/responseFormat')
const wrapAsync = require('../utils/wrapAsync')
const { dataSource } = require('../db/data-source')

const courseController = {

  /*
    * 新增課程標題
  */

  createCourseTitle: wrapAsync(async (req, res, next) => {
    const { course_id ,  teacher_id   } = req.params
    const { course_name } = req.body
    const courseRepo = dataSource.getRepository('courses')
    const course = courseRepo.create({ course_id, teacher_id, course_name })
    await courseRepo.save(course)
    return sendResponse(res, 201, true, '課程標題新增成功', { course })
  }),

  /*
    * 上傳課程小圖
  */
  uploadCourseSmallImages: wrapAsync(async (req, res, next) => {

    if (!req.files || req.files.length === 0) {
      return next(appError(400, '請上傳圖片'))
    }

    const imageUrls = await Promise.all(
      req.files.map(file => storage.upload(file, 'course-small-images'))
    )

    return sendResponse(res, 200, true, '圖片上傳成功', { images: imageUrls })
  }),

  /*
    * 上傳課程描述圖片
  */
  uploadCourseDescriptionImages: wrapAsync(async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return next(appError(400, '請上傳圖片'))
    }

    const imageUrls = await Promise.all(
      req.files.map(file => storage.upload(file, 'course-description-images'))
    )

    return sendResponse(res, 200, true, '圖片上傳成功', { images: imageUrls })
  }),

  /*
    * 上傳課程 Banner 圖片
  */
  uploadCourseBanner: wrapAsync(async (req, res, next) => {
    const courseId = req.params.id
    if (!req.file || !courseId) {
      return next(appError(400, '請上傳圖片與課程 ID'))
    }

    const courseRepo = dataSource.getRepository('courses')
    const course = await courseRepo.findOne({ where: { id: courseId } })
    if (!course) {
      return next(appError(404, '課程不存在'))
    }
    const imageUrl = await storage.upload(req.file, 'course-banners')
    course.course_banner_imageUrl = imageUrl
    return sendResponse(res, 200, true, '圖片上傳成功', { imageUrl })
  }),

  /*
    * 上傳課程教材
  */
  uploadCourseMaterials: wrapAsync(async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return next(appError(400, '請上傳檔案'))
    }

    const fileUrls = await Promise.all(
      req.files.map(file => storage.upload(file, 'course-materials'))
    )

    return sendResponse(res, 200, true, '教材上傳成功', { files: fileUrls })
  })
}

module.exports = courseController
