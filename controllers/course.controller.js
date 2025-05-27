const storage = require('../services/storage')
const { appError, sendResponse } = require('../utils/responseFormat')
const wrapAsync = require('../utils/wrapAsync')
const { dataSource } = require('../db/data-source')
const updateTeacherRating = require('../services/teacher/updateTeacherRating')

const courseController = {
  /*
   * 新增課程標題
   * @route POST /api/v1/course/create/title
   */

  createCourseTitle: wrapAsync(async (req, res, next) => {
    const teacher_id = req.user?.id
    const { course_name } = req.body
    const courseRepo = dataSource.getRepository('courses')
    const course = courseRepo.create({ teacher_id: teacher_id, course_name })
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
      req.files.map((file) => storage.upload(file, 'course-small-images'))
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
      req.files.map((file) => storage.upload(file, 'course-description-images'))
    )

    return sendResponse(res, 200, true, '圖片上傳成功', { images: imageUrls })
  }),

  /*
   * 上傳課程 Banner 圖片
   */
  uploadCourseBanner: wrapAsync(async (req, res, next) => {
    const courseId = req.params.course_id
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
    await courseRepo.save(course)
    return sendResponse(res, 200, true, '圖片上傳成功', { imageUrl })
  }),

  uploadCourseHandOut: wrapAsync(async (req, res, next) => {
    const courseId = req.params.course_id

    if (!req.file || !courseId) {
      return next(appError(400, '請上傳檔案與課程 ID'))
    }

    const courseRepo = dataSource.getRepository('courses')
    const course = await courseRepo.findOne({ where: { id: courseId } })

    if (!course) {
      return next(appError(404, '課程不存在'))
    }

    // 上傳講義檔案到儲存空間，取得 URL
    const handOutUrl = await storage.upload(req.file, 'course-handouts')

    // 建立並儲存講義紀錄到 course_handouts 表
    const handoutRepo = dataSource.getRepository('course_handouts')
    const savedHandout = await handoutRepo.save({
      course_id: courseId,
      name: req.file.originalname,
      url: handOutUrl,
      size: req.file.size,
      type: req.file.mimetype,
      uploaded_at: new Date(), // 可加上上傳時間
    })

    return sendResponse(res, 200, true, '檔案上傳成功', { handout: savedHandout })
  }),

  /*
   * 上傳課程多個教材
   */
  uploadCourseHandOuts: wrapAsync(async (req, res, next) => {
    const courseId = req.params.course_id
    if (!courseId) {
      return next(appError(400, '請提供課程 ID'))
    }
    if (!req.files || req.files.length === 0) {
      return next(appError(400, '請上傳檔案'))
    }

    const fileUrls = await Promise.all(
      req.files.map((file) => storage.upload(file, 'course-materials'))
    )

    return sendResponse(res, 200, true, '教材上傳成功', { files: fileUrls })
  }),

  // 取得首頁熱門課程資料
  async getPopularCourses(req, res, next) {
    const ratingsRepo = dataSource.getRepository('ratings')
    const result = await ratingsRepo
      .createQueryBuilder('rating')
      .select([
        'rating.course_id AS course_id',
        'ROUND(AVG(rating.rating_score)::numeric, 2) AS course_rating_score',
        'COUNT(DISTINCT rating.user_id) AS course_total_users',
        'course.course_banner_imageUrl AS course_image_url',
        'course.course_name AS course_name',
        'course.course_description AS course_description',
      ])
      .leftJoin('rating.courses', 'course')
      .orderBy('course_rating_score', 'DESC')
      .groupBy('rating.course_id')
      .addGroupBy('course.course_banner_imageUrl')
      .addGroupBy('course.course_name')
      .addGroupBy('course.course_description')
      .limit(10)
      .getRawMany()

    return sendResponse(res, 200, true, '取得資料成功', result)
  },

  // 測試用，塞類別資料，非正式格式
  async getCategory(req, res, next) {
    const categoryRepo = dataSource.getRepository('course_category')

    const findCategory = await categoryRepo.find({
      select: ['name'],
    })

    res.status(200).json({
      status: true,
      data: findCategory,
    })
    return
  },

  // 測試用，塞類別資料，非正式格式
  async postCategory(req, res, next) {
    const { name } = req.body
    const categoryRepo = dataSource.getRepository('course_category')
    const newCategory = categoryRepo.create({
      name: name,
    })
    await categoryRepo.save(newCategory)

    return sendResponse(res, 200, true, '新增類別成功')
  },

  // 測試用，塞評價資料，非正式格式
  async getRatings(req, res, next) {
    const ratingsRepo = dataSource.getRepository('ratings')

    const findRatings = await ratingsRepo.find({
      select: ['name'],
    })

    return sendResponse(res, 200, true, '成功取得資料', findRatings)
  },

  // 測試用，塞評價資料，帳號太少沒 check 是否是本人評價跟重複評價，非正式格式
  async postRatings(req, res, next) {
    const user_id = req.user.id
    const course_id = req.params.courseId
    const { rating_score, review_text } = req.body

    const ratingsRepo = dataSource.getRepository('ratings')
    const newRatings = ratingsRepo.create({
      user_id: user_id,
      course_id: course_id,
      rating_score: rating_score,
      review_text: review_text,
    })
    const result = await ratingsRepo.save(newRatings)

    updateTeacherRating(course_id)

    return sendResponse(res, 200, true, '更新評價成功', result)
  },

  // 測試用，塞課程資料，非正式格式
  async getCourse(req, res, next) {
    const { courseId } = req.params

    const courseRepo = dataSource.getRepository('courses')
    const findCourse = await courseRepo.findOne({
      where: { id: courseId },
      select: [
        'teacher_id',
        'category_id',
        'course_banner_imageUrl',
        'course_name',
        'course_banner_description',
        'course_description',
        'course_description_image',
        'course_hours',
        'course_smallimage',
        'total_users',
        'trailer_vimeo_id',
        'trailer_name',
        'trailer_url',
        'trailer_status',
        'handout_name',
        'handout_url',
        'suitable_for',
        'course_goal',
        'origin_price',
        'sell_price',
        'course_status',
      ],
    })

    return sendResponse(res, 200, true, '取得資料成功', findCourse)
  },

  // 測試用，塞課程資料，非正式格式
  async getCourseList(req, res, next) {
    const courseRepo = dataSource.getRepository('courses')
    const findCourseList = await courseRepo.find({
      select: [
        'teacher_id',
        'category_id',
        'course_name',
        'course_banner_imageUrl',
        'course_banner_description',
        'course_description',
        'course_description_image',
        'course_smallimage',
        'course_hours',
        'total_users',
        'trailer_vimeo_id',
        'trailer_name',
        'trailer_url',
        'trailer_status',
        'handout_name',
        'handout_url',
        'suitable_for',
        'course_goal',
        'origin_price',
        'sell_price',
        'course_status',
      ],
    })

    return sendResponse(res, 200, true, '取得資料成功', findCourseList)
  },

  // 測試用，塞課程資料，非正式格式
  async postCourse(req, res, next) {
    const {
      teacher_id,
      category_id,
      course_name,
      course_banner_imageUrl,
      course_banner_description,
      course_description,
      course_description_image,
      course_smallimage,
      course_hours,
      total_users,
      trailer_vimeo_id,
      trailer_name,
      trailer_url,
      trailer_status,
      handout_name,
      handout_url,
      suitable_for,
      course_goal,
      origin_price,
      sell_price,
      course_status,
    } = req.body

    const courseRepo = dataSource.getRepository('courses')
    const newCourse = courseRepo.create({
      teacher_id: teacher_id,
      category_id: category_id,
      course_name: course_name,
      course_banner_imageUrl: course_banner_imageUrl,
      course_banner_description: course_banner_description,
      course_description: course_description,
      course_description_image: course_description_image,
      course_smallimage: course_smallimage,
      course_hours: course_hours,
      total_users: total_users,
      trailer_vimeo_id: trailer_vimeo_id,
      trailer_name: trailer_name,
      trailer_url: trailer_url,
      trailer_status: trailer_status,
      handout_name: handout_name,
      handout_url: handout_url,
      suitable_for: suitable_for,
      course_goal: course_goal,
      origin_price: origin_price,
      sell_price: sell_price,
      course_status: course_status,
    })
    const result = await courseRepo.save(newCourse)

    return sendResponse(res, 200, true, '新增課程成功', result)
  },
}

module.exports = courseController
