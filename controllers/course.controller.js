const storage = require('../services/storage')
const { appError, sendResponse } = require('../utils/responseFormat')
const wrapAsync = require('../utils/wrapAsync')
const { dataSource } = require('../db/data-source')
const updateTeacherRating = require('../services/teacher/updateTeacherRating')
const {
  updateCourseMediaService,
  deleteCourseMedia,
  uploadHandoutService,
  deleteHandout,
  deleteVideo,
} = require('../services/updateCourseMedia/updateCourseMedia.service')
const MediaField = require('../services/updateCourseMedia/updateCourseMedia.interface')

const courseController = {
  /*
   * 取得所有課程類別
   * @route GET /api/v1/course/category
   */
  getCourseCategory: async (req, res, next) => {
    const courseCategoryRepo = dataSource.getRepository('course_categories')
    const categories = await courseCategoryRepo.find({
      select: ['name']
    })
    return sendResponse(res, 200, true, '取得課程類別成功', { categories })
  },

  /*
   * 取得所有的課程 不分類別
   * @route GET /api/v1/course/list
   */
  getCourseList: async (req, res, next) => {
    const courseRepo = dataSource.getRepository('courses')
    const courses = await courseRepo.find({ relations: ['handouts', 'category'] })
    if (!courses || courses.length === 0) {
      return sendResponse(res, 404, false, '沒有找到任何課程')
    }

    const result = courses.map((course) => {
      const { category, ...rest } = course
      return {
        ...rest,
        category_id: course.category_id,
        category_name: category ? category.name : null,
        handouts: course.handouts,
      }
    })

    return sendResponse(res, 200, true, '取得課程列表成功', { courses: result })
  },
  /*
   * 取得單一課程
   * @route GET /api/v1/course/:courseId
   */
  getCourse: async (req, res, next) => {
    const courseId = req.params.courseId
    if (!courseId) {
      return next(appError(400, '請提供課程 ID'))
    }

    const courseRepo = dataSource.getRepository('courses')
    const course = await courseRepo.findOne({ where: { id: courseId } })

    if (!course) {
      return next(appError(404, '課程不存在'))
    }

    return sendResponse(res, 200, true, '取得課程成功', { course })
  },

  /*
   * 新增課程標題
   * @route POST /api/v1/course/create/title
   */

  createCourseTitle: wrapAsync(async (req, res, next) => {
    const user_id = req.user?.id
    const { course_name } = req.body
    const courseRepo = dataSource.getRepository('courses')
    const teacherRepo = dataSource.getRepository('teacher')

    // 檢查 teacher 是否存在，根據 user_id 找
    let teacher = await teacherRepo.findOne({ where: { user_id } })

    if (!teacher) {
      teacher = teacherRepo.create({ user_id })
      teacher = await teacherRepo.save(teacher)
    }

    // 建立課程（假設 courses.teacher_id 對應 teachers.id）
    const course = courseRepo.create({
      teacher_id: teacher.id,
      course_name,
    })

    await courseRepo.save(course)

    return sendResponse(res, 201, true, '課程標題新增成功', { course })
  }),

  /*
   * 新增課程類別
   * @route POST /api/v1/course/:courseId/category
   */
  createCourseCategory: wrapAsync(async (req, res, next) => {
    const courseId = req.params.courseId
    const { category_id } = req.body

    if (!courseId) {
      return next(appError(400, '請提供課程 ID'))
    }
    const courseRepo = dataSource.getRepository('courses')
    const course = await courseRepo.findOne({ where: { id: courseId } })
    if (!course) {
      return next(appError(404, '課程不存在'))
    }
    if (!category_id) {
      return next(appError(400, '請提供類別 ID'))
    }
    course.category_id = category_id
    await courseRepo.save(course)
    return sendResponse(res, 200, true, '課程類別新增成功', { course })
  }),

  /*
   * 上傳課程小圖
   * @route POST /api/v1/course/:courseId/upload/small-image
   */
  uploadCourseSmallImage: wrapAsync(async (req, res, next) => {
    const imageUrl = await updateCourseMediaService({
      courseId: req.params.courseId,
      file: req.file,
      folderName: 'course-small-images',
      fieldName: 'course_small_imageUrl',
      type: 'image', // 限制為圖片格式
    })
    return sendResponse(res, 200, true, '圖片上傳成功', { imageUrl })
  }),

  /*
   * 刪除課程小圖
   * @route DELETE /api/v1/course/:courseId/small-image
   */
  deleteCourseSmallImage: wrapAsync(async (req, res, next) => {
    await deleteCourseMedia({
      courseId: req.params.courseId,
      fieldName: 'course_small_imageUrl',
    })
    return sendResponse(res, 200, true, '圖片已刪除')
  }),

  /*
   * 上傳課程描述圖片
   * @route POST /api/v1/course/:courseId/description-image
   */
  uploadCourseDescriptionImage: wrapAsync(async (req, res, next) => {
    const imageUrl = await updateCourseMediaService({
      courseId: req.params.courseId,
      file: req.file,
      folderName: 'course-description-images',
      fieldName: MediaField.DESCRIPTION,
    })
    return sendResponse(res, 200, true, '描述圖片上傳成功', { imageUrl })
  }),

  /*
   * 刪除課程描述圖片
   * @route DELETE /api/v1/course/:courseId/description-image
   */
  deleteCourseDescriptionImage: wrapAsync(async (req, res, next) => {
    await deleteCourseMedia({
      courseId: req.params.courseId,
      fieldName: MediaField.DESCRIPTION,
    })
    return sendResponse(res, 200, true, '描述圖片已刪除')
  }),

  /*
   * 上傳課程 Banner 圖片
   * @route POST /api/v1/course/:courseId/banner
   */
  uploadCourseBanner: wrapAsync(async (req, res, next) => {
    const imageUrl = await updateCourseMediaService({
      courseId: req.params.courseId,
      file: req.file,
      folderName: 'course-banner-images',
      fieldName: MediaField.BANNER,
    })
    return sendResponse(res, 200, true, 'Banner 圖片上傳成功', { imageUrl })
  }),

  /*
   * 刪除課程 Banner 圖片
   * @route DELETE /api/v1/course/:courseId/banner
   */
  deleteCourseBanner: wrapAsync(async (req, res, next) => {
    await deleteCourseMedia({
      courseId: req.params.courseId,
      fieldName: MediaField.BANNER,
    })
    return sendResponse(res, 200, true, 'Banner 圖片已刪除')
  }),

  /*
   * 上傳課程預告影片
   * @route POST /api/v1/course/:courseId/upload/trailer
   */
  uploadCourseTrailer: wrapAsync(async (req, res, next) => {
    const videoUrl = await updateCourseMediaService({
      courseId: req.params.courseId,
      file: req.file,
      folderName: 'course-trailers',
      fieldName: MediaField.TRAILER,
      type: 'video', // 限制為影片格式
    })
    return sendResponse(res, 200, true, '預告影片上傳成功', { videoUrl })
  }),

  /*
   * 刪除課程預告影片
   * @route DELETE /api/v1/course/:courseId/upload/trailer
   */
  deleteCourseTrailer: wrapAsync(async (req, res, next) => {
    const { courseId } = req.params

    // 確認課程是否存在
    const courseRepo = dataSource.getRepository('courses')
    const course = await courseRepo.findOne({ where: { id: courseId } })
    if (!course) {
      return next(appError(404, '課程不存在'))
    }

    // 刪除預告影片
    await deleteVideo(courseId)

    return sendResponse(res, 200, true, '預告影片已刪除')
  }),

  /*
   * 上傳課程多個講義
   */
  uploadCourseHandOuts: wrapAsync(async (req, res, next) => {
    const { courseId } = req.params
    const files = req.files // 注意 multer 設定要用 `.array()` 或 `.fields()` 才會有 req.files

    if (!files || files.length === 0) {
      return res.status(400).json({ status: 'error', message: '請上傳檔案' })
    }

    // 用 Promise.all 同時處理多個檔案上傳
    const handouts = await Promise.all(
      files.map((file) =>
        uploadHandoutService({
          courseId,
          file,
          folderName: MediaField.HANDOUTS,
        })
      )
    )

    // 把 size 從 byte 轉成 MB 字串
    const handoutsWithMB = handouts.map((handout) => ({
      ...handout,
      sizeMB: (handout.size / (1024 * 1024)).toFixed(2), // 保留兩位小數
    }))

    return sendResponse(res, 200, true, '講義上傳成功', { handouts: handoutsWithMB })
  }),

  /*
   * 刪除課程講義
   * @route DELETE /api/v1/course/:courseId/handouts/:handoutId
   */
  deleteCourseHandOuts: wrapAsync(async (req, res, next) => {
    const { handoutId } = req.params

    // 確認 service 名稱與參數格式
    const deleted = await deleteHandout({ handoutId })

    if (!deleted) {
      return next(appError(404, '講義不存在或已被刪除'))
    }
    return sendResponse(res, 200, true, '講義已成功刪除', { handoutId })
  }),

  /*
   * 儲存課程資訊
   * @route POST /api/v1/course/:courseId/save
   */
  saveCourse: async (req, res, next) => {
    const { courseId } = req.params
    const { suitable_for, course_goal, course_description, course_banner_description } =
      req.validatedData

    const courseRepo = dataSource.getRepository('courses')
    const course = await courseRepo.findOne({ where: { id: courseId } })

    if (!course) {
      return next(appError(404, '課程不存在'))
    }

    const requiredFields = [
      'category_id',
      'course_name',
      'course_description_imageUrl',
      'course_small_imageUrl',
    ]
    const missingFields = requiredFields.filter((field) => !course[field])

    if (missingFields.length > 0) {
      return next(appError(400, `課程資料缺少以下欄位：${missingFields.join(', ')}`))
    }

    // 更新欄位
    course.suitable_for = suitable_for
    course.course_goal = course_goal
    course.course_description = course_description
    course.course_banner_description = course_banner_description

    await courseRepo.save(course)

    return sendResponse(res, 200, true, '課程資訊儲存成功', { course })
  },

  /*
   * 取得課程教材列表
   */

  async getCourseHandOuts(req, res, next) {
    const courseId = req.params.courseId
    if (!courseId) {
      return next(appError(400, '請提供課程 ID'))
    }

    const courseHandoutRepo = dataSource.getRepository('course_handouts')
    const handouts = await courseHandoutRepo.find({ where: { course_id: courseId } })

    return sendResponse(res, 200, true, '取得教材列表成功', { handouts })
  },


  /*
   * 新增課程價格 New
   * @route POST /api/v1/course/:courseId/price
   */
  createCoursePrice: async (req, res, next) => {
    const { courseId } = req.params
    const { origin_price } =  req.body 

    const courseRepo = dataSource.getRepository('courses')
    const course = await courseRepo.findOne({ where: { id: courseId } })

    if (!course) {
      return next(appError(404, '課程不存在'))
    }

    const createPriceResult = await courseRepo.update({id: courseId},{origin_price: origin_price, sell_price: origin_price})

    if(createPriceResult.affected==1){
      const updateCourse = await courseRepo.findOne({where:{id: courseId}})
      return sendResponse(res, 200, true, '課程價格新增成功', updateCourse)
    }else{
      return sendResponse(res, 400, false, '課程價格新增失敗')
    }
  },


    /*
   * 新增課程價格 New
   * @route POST /api/v1/course/:courseId/price
   */
    createCoursePrice: async (req, res, next) => {
      const { courseId } = req.params
      const { origin_price } =  req.body 
  
      const courseRepo = dataSource.getRepository('courses')
      const course = await courseRepo.findOne({ where: { id: courseId } })
  
      if (!course) {
        return next(appError(404, '課程不存在'))
      }
  
      const createPriceResult = await courseRepo.update({id: courseId},{origin_price: origin_price, sell_price: origin_price})
  
      if(createPriceResult.affected==1){
        const updateCourse = await courseRepo.findOne({where:{id: courseId}})
        return sendResponse(res, 200, true, '課程價格新增成功', updateCourse)
      }else{
        return sendResponse(res, 400, false, '課程價格新增失敗')
      }
    },

    // 新增課程評價
    postRatings: async (req, res, next) => {
      const user_id = req.user.id
      const course_id = req.params.courseId
      const { rating_score, review_text } = req.body

      const courseRepo = dataSource.getRepository('courses')
      const courseResult = await courseRepo.createQueryBuilder('course')
      .select([
          'course.course_name AS course_name',
          'course.teacher_id AS teacher_id',
          'teacher.user_id AS user_id',
      ])
      .leftJoin('course.teacher', 'teacher')
      .where('course.id = :course_id', { course_id }) 
      .getRawMany()

      if(courseResult.user_id === user_id){
        return sendResponse(res, 400, false, '抱歉，無法評價自己的課程')
      }

      const ratingsRepo = dataSource.getRepository('ratings')
      const newRatings = ratingsRepo.create({
        user_id: user_id,
        course_id: course_id,
        rating_score: rating_score,
        review_text: review_text
      })
      const result = await ratingsRepo.save(newRatings)

      updateTeacherRating(course_id)

      return sendResponse(res, 200, true, '更新評價成功', result)
    },

    // 取得首頁熱門課程資料
    getPopularCourses: async (req, res, next) => {
      const ratingsRepo = dataSource.getRepository('ratings')
      const result = await ratingsRepo.createQueryBuilder('rating')
      .select(['rating.course_id AS course_id',
        'ROUND(AVG(rating.rating_score)::numeric, 2) AS course_rating_score',
        'COUNT(DISTINCT rating.user_id) AS course_total_users',
        'course.course_banner_imageUrl AS course_image_url',
        'course.course_name AS course_name',
        'course.course_description AS course_description'
      ])
      .leftJoin('rating.courses', 'course')
      .orderBy('course_rating_score', 'DESC')
      .groupBy('rating.course_id')
      .addGroupBy('course.course_banner_imageUrl')
      .addGroupBy('course.course_name')
      .addGroupBy('course.course_description')
      .limit(10)
      .getRawMany();
      
      return sendResponse(res, 200, true, '取得資料成功', result)
    },

    // 取得所有課程評價
    getRatings: async (req, res, next) => {
      console.log("==========getRatings 1=========")
      const ratingsRepo = dataSource.getRepository('ratings')
      console.log("==========getRatings 2=========")
      const findRatings = await ratingsRepo.find()
      console.log("==========getRatings 3=========")
      return sendResponse(res, 200, true, '成功取得資料', findRatings)
    },
  // 取得首頁熱門課程資料
  // async getPopularCourses(req, res, next) {
  //   const ratingsRepo = dataSource.getRepository('ratings')
  //   const result = await ratingsRepo
  //     .createQueryBuilder('rating')
  //     .select([
  //       'rating.course_id AS course_id',
  //       'ROUND(AVG(rating.rating_score)::numeric, 2) AS course_rating_score',
  //       'COUNT(DISTINCT rating.user_id) AS course_total_users',
  //       'course.course_banner_imageUrl AS course_image_url',
  //       'course.course_name AS course_name',
  //       'course.course_description AS course_description',
  //     ])
  //     .leftJoin('rating.courses', 'course')
  //     .orderBy('course_rating_score', 'DESC')
  //     .groupBy('rating.course_id')
  //     .addGroupBy('course.course_banner_imageUrl')
  //     .addGroupBy('course.course_name')
  //     .addGroupBy('course.course_description')
  //     .limit(10)
  //     .getRawMany()

  //   return sendResponse(res, 200, true, '取得資料成功', result)
  // },

  // // 測試用，塞類別資料，非正式格式
  // async getCategory(req, res, next) {
  //   const categoryRepo = dataSource.getRepository('course_category')

  //   const findCategory = await categoryRepo.find({
  //     select: ['name'],
  //   })

  //   res.status(200).json({
  //     status: true,
  //     data: findCategory,
  //   })
  //   return
  // },

  // // 測試用，塞類別資料，非正式格式
  // async postCategory(req, res, next) {
  //   const { name } = req.body
  //   const categoryRepo = dataSource.getRepository('course_category')
  //   const newCategory = categoryRepo.create({
  //     name: name,
  //   })
  //   await categoryRepo.save(newCategory)

  //   return sendResponse(res, 200, true, '新增類別成功')
  // },

  // // 測試用，塞評價資料，非正式格式
  // async getRatings(req, res, next) {
  //   const ratingsRepo = dataSource.getRepository('ratings')

  //   const findRatings = await ratingsRepo.find({
  //     select: ['name'],
  //   })

  //   return sendResponse(res, 200, true, '成功取得資料', findRatings)
  // },

  // // 測試用，塞評價資料，帳號太少沒 check 是否是本人評價跟重複評價，非正式格式
  // async postRatings(req, res, next) {
  //   const user_id = req.user.id
  //   const course_id = req.params.courseId
  //   const { rating_score, review_text } = req.body

  //   const ratingsRepo = dataSource.getRepository('ratings')
  //   const newRatings = ratingsRepo.create({
  //     user_id: user_id,
  //     course_id: course_id,
  //     rating_score: rating_score,
  //     review_text: review_text,
  //   })
  //   const result = await ratingsRepo.save(newRatings)

  //   updateTeacherRating(course_id)

  //   return sendResponse(res, 200, true, '更新評價成功', result)
  // },

  // // // 測試用，塞課程資料，非正式格式
  // // async getCourse(req, res, next) {
  // //   const { courseId } = req.params

  // //   const courseRepo = dataSource.getRepository('courses')
  // //   const findCourse = await courseRepo.findOne({
  // //     where: { id: courseId },
  // //     select: [
  // //       'teacher_id',
  // //       'category_id',
  // //       'course_banner_imageUrl',
  // //       'course_name',
  // //       'course_banner_description',
  // //       'course_description',
  // //       'course_description_image',
  // //       'course_hours',
  // //       'course_smallimage',
  // //       'total_users',
  // //       'trailer_vimeo_id',
  // //       'trailer_name',
  // //       'trailer_url',
  // //       'trailer_status',
  // //       'handout_name',
  // //       'handout_url',
  // //       'suitable_for',
  // //       'course_goal',
  // //       'origin_price',
  // //       'sell_price',
  // //       'course_status',
  // //     ],
  // //   })

  // //   return sendResponse(res, 200, true, '取得資料成功', findCourse)
  // // },

  // // 測試用，塞課程資料，非正式格式
  // // async getCourseList(req, res, next) {
  // //   const courseRepo = dataSource.getRepository('courses')
  // //   const findCourseList = await courseRepo.find({
  // //     select: [
  // //       'teacher_id',
  // //       'category_id',
  // //       'course_name',
  // //       'course_banner_imageUrl',
  // //       'course_banner_description',
  // //       'course_description',
  // //       'course_description_image',
  // //       'course_smallimage',
  // //       'course_hours',
  // //       'total_users',
  // //       'trailer_vimeo_id',
  // //       'trailer_name',
  // //       'trailer_url',
  // //       'trailer_status',
  // //       'handout_name',
  // //       'handout_url',
  // //       'suitable_for',
  // //       'course_goal',
  // //       'origin_price',
  // //       'sell_price',
  // //       'course_status',
  // //     ],
  // //   })

  // //   return sendResponse(res, 200, true, '取得資料成功', findCourseList)
  // // },

  // // 測試用，塞課程資料，非正式格式
  // async postCourse(req, res, next) {
  //   const {
  //     teacher_id,
  //     category_id,
  //     course_name,
  //     course_banner_imageUrl,
  //     course_banner_description,
  //     course_description,
  //     course_description_image,
  //     course_smallimage,
  //     course_hours,
  //     total_users,
  //     trailer_vimeo_id,
  //     trailer_name,
  //     trailer_url,
  //     trailer_status,
  //     handout_name,
  //     handout_url,
  //     suitable_for,
  //     course_goal,
  //     origin_price,
  //     sell_price,
  //     course_status,
  //   } = req.body

  //   const courseRepo = dataSource.getRepository('courses')
  //   const newCourse = courseRepo.create({
  //     teacher_id: teacher_id,
  //     category_id: category_id,
  //     course_name: course_name,
  //     course_banner_imageUrl: course_banner_imageUrl,
  //     course_banner_description: course_banner_description,
  //     course_description: course_description,
  //     course_description_image: course_description_image,
  //     course_smallimage: course_smallimage,
  //     course_hours: course_hours,
  //     total_users: total_users,
  //     trailer_vimeo_id: trailer_vimeo_id,
  //     trailer_name: trailer_name,
  //     trailer_url: trailer_url,
  //     trailer_status: trailer_status,
  //     handout_name: handout_name,
  //     handout_url: handout_url,
  //     suitable_for: suitable_for,
  //     course_goal: course_goal,
  //     origin_price: origin_price,
  //     sell_price: sell_price,
  //     course_status: course_status,
  //   })
  //   const result = await courseRepo.save(newCourse)

  //   return sendResponse(res, 200, true, '新增課程成功', result)
  // },

  // uploadCourseHandOut: wrapAsync(async (req, res, next) => {
  //   const courseId = req.params.courseId

  //   if (!req.file || !courseId) {
  //     return next(appError(400, '請上傳檔案與課程 ID'))
  //   }

  //   const courseRepo = dataSource.getRepository('courses')
  //   const course = await courseRepo.findOne({ where: { id: courseId } })

  //   if (!course) {
  //     return next(appError(404, '課程不存在'))
  //   }

  //   // 上傳講義檔案到儲存空間，取得 URL
  //   const handOutUrl = await storage.upload(req.file, 'course-handouts')

  //   // 建立並儲存講義紀錄到 course_handouts 表
  //   const handoutRepo = dataSource.getRepository('course_handouts')
  //   const savedHandout = await handoutRepo.save({
  //     course_id: courseId,
  //     name: req.file.originalname,
  //     url: handOutUrl,
  //     size: req.file.size,
  //     type: req.file.mimetype,
  //     uploaded_at: new Date(), // 可加上上傳時間
  //   })

  //   return sendResponse(res, 200, true, '檔案上傳成功', { handout: savedHandout })
  // }),
}

module.exports = courseController
