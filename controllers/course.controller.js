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
   * 取得特定類別課程
   * @route GET /api/v1/course/category/:categoryId
   * @param {string} categoryId - 課程類別 ID
   * @returns {object} - 課程列表
   */
  async getCourseCategory(req, res, next) {
    const categoryId = req.params.categoryId
    if (!categoryId) {
      return next(appError(400, '請提供課程類別 ID'))
    }

    const courseRepo = dataSource.getRepository('courses')
    const courses = await courseRepo.find({
      where: { category_id: categoryId },
      relations: ['category'],
    })

    if (!courses || courses.length === 0) {
      return next(appError(404, '沒有找到任何課程'))
    }

    const result = courses.map((course) => {
      const { category, ...rest } = course
      return {
        ...rest,
        category_id: course.category_id,
        category_name: category ? category.name : null,
      }
    })

    return sendResponse(res, 200, true, '取得課程列表成功', { courses: result })
  },

  /*
   * 取得所有課程分類別
   * @route GET /api/v1/course/category
   */
  getCourseCategoryList: wrapAsync(async (req, res, next) => {
    const categoryRepo = dataSource.getRepository('course_categories')
    const categories = await categoryRepo.find()

    if (!categories || categories.length === 0) {
      return sendResponse(res, 404, false, '沒有找到任何課程類別')
    }

    return sendResponse(res, 200, true, '取得課程類別列表成功', { categories })
  }),

  /*
   * 取得所有的課程 不分類別
   * @route GET /api/v1/course/list
   */
  async getCourseList(req, res, next) {
    const courseRepo = dataSource.getRepository('courses')
    const courses = await courseRepo.find({
      relations: ['handouts', 'category', 'teacher', 'teacher.user'],
    })

    if (!courses || courses.length === 0) {
      return sendResponse(res, 404, false, '沒有找到任何課程')
    }

    const result = courses.map((course) => {
      const { category, teacher, ...rest } = course

      return {
        ...rest,
        category_id: course.category_id,
        category_name: category ? category.name : null,
        handouts: course.handouts,
        teacher: teacher?.user
          ? {
              name: teacher.user.name,
              nickname: teacher.user.nickname,
            }
          : null,
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
   * 取得課程講義
   * @route GET /api/v1/course/:courseId/handouts
   */
  getCourseHandOuts: wrapAsync(async (req, res, next) => {
    const { courseId } = req.params

    // 確認課程是否存在
    const courseRepo = dataSource.getRepository('courses')
    const course = await courseRepo.findOne({ where: { id: courseId } })
    if (!course) {
      return next(appError(404, '課程不存在'))
    }

    const handoutRepo = dataSource.getRepository('course_handouts')
    const handouts = await handoutRepo.find({ where: { course_id: courseId } })

    return sendResponse(res, 200, true, '取得課程講義成功', { handouts })
  }),

  /*
   * 上傳課程多個講義
   * @route POST /api/v1/course/course-id/upload/course-handouts
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
   * @route GET /api/v1/course/course-id/upload/course-handouts
   */
  getCourseHandOuts: async (req, res, next) => {
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
    const { origin_price } = req.body

    const courseRepo = dataSource.getRepository('courses')
    const course = await courseRepo.findOne({ where: { id: courseId } })

    if (!course) {
      return next(appError(404, '課程不存在'))
    }

    const createPriceResult = await courseRepo.update(
      { id: courseId },
      { origin_price: origin_price, sell_price: origin_price }
    )

    if (createPriceResult.affected == 1) {
      const updateCourse = await courseRepo.findOne({ where: { id: courseId } })
      return sendResponse(res, 200, true, '課程價格新增成功', updateCourse)
    } else {
      return next(appError(400, '課程價格新增失敗'))
    }
  },

  /*
   * 更新課程狀態
   * @route POST /api/v1/course/:courseId/price
   */
  updateCourseStatus: async (req, res, next) => {
    const { courseId } = req.params
    const { course_status } = req.body

    const courseRepo = dataSource.getRepository('courses')
    const course = await courseRepo.findOne({ where: { id: courseId } })

    if (!course) {
      return next(appError(404, '課程不存在'))
    }

    const updateCourseStatusResult = await courseRepo.update(
      { id: courseId },
      { course_status: course_status }
    )

    if (updateCourseStatusResult.affected == 1) {
      const updateCourse = await courseRepo.findOne({ where: { id: courseId } })
      return sendResponse(res, 200, true, '課程狀態更新成功', updateCourse)
    } else {
      return next(appError(400, '課程狀態更新失敗'))
    }
  },

  /*
   * 新增課程評價
   * @route POST /api/v1/course/:courseId/ratings
   */
  postRatings: async (req, res, next) => {
    const user_id = req.user.id
    const course_id = req.params.courseId
    const { rating_score, review_text } = req.body

    const courseRepo = dataSource.getRepository('courses')
    const courseResult = await courseRepo
      .createQueryBuilder('course')
      .select([
        'course.course_name AS course_name',
        'course.teacher_id AS teacher_id',
        'teacher.user_id AS user_id',
      ])
      .leftJoin('course.teacher', 'teacher')
      .where('course.id = :course_id', { course_id })
      .getRawMany()

    if (courseResult.user_id === user_id) {
      return next(appError(400, '抱歉，無法評價自己的課程'))
    }

    const ratingsRepo = dataSource.getRepository('ratings')
    const newRatings = ratingsRepo.create({
      user_id: user_id,
      course_id: course_id,
      rating_score: rating_score,
      review_text: review_text,
    })
    const result = await ratingsRepo.save(newRatings)

    updateTeacherRating(course_id)

    return sendResponse(res, 200, true, '新增評價成功', result)
  },

  /*
   * 修改特定課程評價
   * @route PATCH /api/v1/course/:courseId/ratings
   */
  patchRatings: async (req, res, next) => {
    const user_id = req.user.id
    const course_id = req.params.courseId
    const { rating_score, review_text } = req.body

    const courseRepo = dataSource.getRepository('courses')
    const courseResult = await courseRepo
      .createQueryBuilder('course')
      .select([
        'course.course_name AS course_name',
        'course.teacher_id AS teacher_id',
        'teacher.user_id AS user_id',
      ])
      .leftJoin('course.teacher', 'teacher')
      .where('course.id = :course_id', { course_id })
      .getRawMany()

    if (courseResult.user_id === user_id) {
      return next(appError(400, '抱歉，無法評價自己的課程'))
    }

    const ratingsRepo = dataSource.getRepository('ratings')
    const updateRatings = await ratingsRepo.update(
      {
        user_id: user_id,
        course_id: course_id,
      },
      {
        rating_score: rating_score,
        review_text: review_text,
      }
    )

    if (updateRatings.affected === 1) {
      updateTeacherRating(course_id)
      return sendResponse(res, 200, true, '更新評價成功')
    } else {
      return next(appError(400, '更新評價失敗'))
    }
  },

  /*
   * 取得首頁熱門課程資料
   * @route GET /api/v1/course/popular
   */
  getPopularCourses: async (req, res, next) => {
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

  /*
   * 取得所有課程評價
   * @route GET /api/v1/course/ratings
   */
  getRatings: async (req, res, next) => {
    const ratingsRepo = dataSource.getRepository('ratings')
    const findRatings = await ratingsRepo.find()
    return sendResponse(res, 200, true, '成功取得資料', findRatings)
  },

  /*
   * 提出課程問題
   * @route POST /api/v1/course/:courseId/questions
   */
  postQuestions: async (req, res, next) => {
    const user_id = req.user.id
    const course_id = req.params.courseId
    const { question_text } = req.body

    const courseRepo = dataSource.getRepository('courses')
    const findCourse = await courseRepo.findOne({ where: { id: course_id } })

    if (!findCourse) {
      return next(appError(404, '課程不存在'))
    }

    const userRepo = dataSource.getRepository('users')
    const findUser = await userRepo.findOne({ where: { id: user_id } })

    if (!findUser) {
      return next(appError(404, '使用者不存在'))
    }

    //新增問題
    const questionRepo = dataSource.getRepository('question')
    const newQuestion = questionRepo.create({
      user_id: user_id,
      course_id: course_id,
      question_text: question_text,
    })
    const result = await questionRepo.save(newQuestion)

    return sendResponse(res, 200, true, '新增問題成功', result)
  },

  /*
   * 提出課程回答
   * @route POST /api/v1/course/:courseId/answers
   */
  postAnswers: async (req, res, next) => {
    const user_id = req.user.id
    const course_id = req.params.courseId
    const { question_id, answer_text } = req.body

    const courseRepo = dataSource.getRepository('courses')
    const findCourse = await courseRepo.findOne({ where: { id: course_id } })

    if (!findCourse) {
      return next(appError(404, '課程不存在'))
    }

    const userRepo = dataSource.getRepository('users')
    const findUser = await userRepo.findOne({ where: { id: user_id } })

    if (!findUser) {
      return next(appError(404, '使用者不存在'))
    }

    //新增回答
    const answerRepo = dataSource.getRepository('answer')
    const newAnswer = answerRepo.create({
      question_id: question_id,
      user_id: user_id,
      answer_text: answer_text,
      user_role: findUser.role,
    })
    const result = await answerRepo.save(newAnswer)

    return sendResponse(res, 200, true, '新增回答成功', result)
  },

  /*
   * 取得課程問題列表
   * @route GET /api/v1/course/:courseId/questions
   */
  getQuestions: async (req, res, next) => {
    const course_id = req.params.courseId

    const questionRepo = dataSource.getRepository('question')
    const findQuestion = await questionRepo.find({
      select: ['id', 'user_id', 'serial_id', 'question_text', 'created_at'],
      where: { course_id: course_id },
    })

    const courseRepo = dataSource.getRepository('courses')
    const findUser = await courseRepo
      .createQueryBuilder('course')
      .select(['user.id AS user_id'])
      .leftJoin('course.teacher', 'teacher')
      .leftJoin('teacher.user', 'user')
      .where('course.id = :course_id', { course_id })
      .getRawOne()

    const answerRepo = dataSource.getRepository('answer')

    // 新增每個問題的回答陣列
    for (const question of findQuestion) {
      const findAnswer = await answerRepo
        .createQueryBuilder('answer')
        .select([
          'answer.user_id AS user_id',
          'user.name AS user_name',
          'answer.answer_text AS answer_text',
          'answer.user_role AS user_role',
          'answer.created_at AS created_at',
        ])
        .leftJoin('answer.user', 'user')
        .where('answer.question_id=:question_id', { question_id: question.id })
        .orderBy('answer.created_at', 'ASC')
        .getRawMany()

      for (const answer of findAnswer) {
        answer.is_instructor = answer.user_id === findUser.user_id
      }
      question.answers = findAnswer
    }

    return sendResponse(res, 200, true, '取得課程問題列表', findQuestion)
  },

  /*
   * 新增課程章節
   * @route POST - /api/v1/course/:courseId/course-section
   */
  postCourseSection: async (req, res, next) => {
    const course_id = req.params.courseId
    const { main_section_title } = req.body

    const courseRepo = dataSource.getRepository('courses')
    const findCourse = await courseRepo.findOne({ where: { id: course_id } })

    if (!findCourse) {
      return next(appError(404, '課程不存在'))
    }

    const courseSectionRepo = dataSource.getRepository('course_section')
    const lastSection = await courseSectionRepo
      .createQueryBuilder('section')
      .select('MAX(section.order_index)', 'max')
      .where('section.course_id = :course_id', { course_id })
      .getRawOne()
    const newOrderIndex = (lastSection.max || 0) + 100

    const newCourseSection = courseSectionRepo.create({
      course_id: course_id,
      order_index: newOrderIndex,
      main_section_title: main_section_title,
    })

    const result = await courseSectionRepo.save(newCourseSection)

    return sendResponse(res, 200, true, '新增章節成功', result)
  },

  /*
   * 取得課程章節
   * @route GET - /api/v1/course/:courseId/course-section
   */
  getCourseSection: async (req, res, next) => {
    const course_id = req.params.courseId

    const courseSectionRepo = dataSource.getRepository('course_section')
    const findCourseSection = await courseSectionRepo.find({ where: { course_id: course_id } })

    return sendResponse(res, 200, true, '取得課程章節成功', findCourseSection)
  },

  /*
   * 取得我的課程列表
   * @route GET - /api/v1/course/my-course
   */
  /*   getMyCourse: async (req, res, next) => {
    const user_id = req.user.id

    const studentCourseRepo = dataSource.getRepository('student_course')
    const findStudentCourse = await studentCourseRepo.find({ where:{user_id: user_id} })

    return sendResponse(res, 200, true, '成功取得我的課程', findStudentCourse)
  }, */

  getMyCourse: async (req, res, next) => {
    const user_id = req.user.id

    //取得我的課程表資料
    const studentCourseRepo = dataSource.getRepository('student_course')
    const findStudentCourse = await studentCourseRepo
      .createQueryBuilder('student_course')
      .select([
        'course.id AS course_id',
        'teacher.id AS teacher_id',
        'user.name AS teacher_name',
        'course.course_small_imageUrl AS course_small_imageUrl',
        'course.course_name AS course_name',
        'student_course.purchase_date AS purchase_date',
        'student_course.last_accessed_at AS last_accessed_at',
        'student_course.last_subsection_id AS last_subsection_id',
        'student_course.completion_percentage AS completion_percentage',
      ])
      .leftJoin('student_course.user', 'user')
      .leftJoin('student_course.course', 'course')
      .leftJoin('course.teacher', 'teacher')
      .where('student_course.user_id=:user_id', { user_id: user_id })
      .getRawMany()

    const ratingRepo = dataSource.getRepository('ratings')

    //每門課的平均評價分數
    const avgRatings = await ratingRepo
      .createQueryBuilder('rating')
      .select([
        'rating.course_id AS course_id',
        'ROUND(AVG(rating.rating_score)::numeric, 2) AS avg_rating_score',
      ])
      .groupBy('rating.course_id')
      .getRawMany()

    //每門課的我的評價分數
    const myRatings = await ratingRepo
      .createQueryBuilder('rating')
      .select(['rating.course_id AS course_id', 'rating.rating_score AS rating_score'])
      .where('rating.user_id=:user_id', { user_id: user_id })
      .getRawMany()

    //轉成物件
    const avgRatingMap = Object.fromEntries(
      avgRatings.map((r) => [r.course_id, r.avg_rating_score])
    )
    const myRatingMap = Object.fromEntries(myRatings.map((r) => [r.course_id, r.rating_score]))

    const result = findStudentCourse.map((studentCourse) => ({
      id: studentCourse.course_id,
      teacher_id: studentCourse.teacher_id,
      teacher_name: studentCourse.teacher_name,
      course_small_imageUrl: studentCourse.course_small_imageUrl,
      course_name: studentCourse.course_name,
      course_ratings: {
        rating_score: myRatingMap[studentCourse.course_id] || '',
        avg_rating_score: avgRatingMap[studentCourse.course_id] || '',
      },
      student_course: {
        purchase_date: studentCourse.purchase_date,
        last_accessed_at: studentCourse.last_accessed_at,
        last_subsection_id: studentCourse.last_subsection_id,
        completion_percentage: studentCourse.completion_percentage,
      },
    }))

    return sendResponse(res, 200, true, '成功取得我的課程', result)
  },

  /*
   * 修改課程章節
   * @route PATCH - /api/v1/course/course-section/:courseSectionId
   */
  patchCourseSection: async (req, res, next) => {
    const section_id = req.params.courseSectionId
    const { main_section_title } = req.body

    const courseSectionRepo = dataSource.getRepository('course_section')
    const findCourseSection = await courseSectionRepo.findOne({ where: { id: section_id } })

    if (!findCourseSection) {
      return next(appError(404, '章節不存在'))
    }

    const updateCourseSection = await courseSectionRepo.update(
      { id: section_id },
      { main_section_title: main_section_title }
    )

    if (updateCourseSection.affected === 1) {
      const findCourseSection = await courseSectionRepo.findOne({ where: { id: section_id } })
      return sendResponse(res, 200, true, '更新課程章節成功', findCourseSection)
    } else {
      return next(appError(404, '更新課程章節失敗'))
    }
  },

  /*
   * 刪除課程章節
   * @route DELETE - /api/v1/course/course-section/:courseSectionId
   */
  deleteCourseSection: async (req, res, next) => {
    const section_id = req.params.courseSectionId

    const courseSectionRepo = dataSource.getRepository('course_section')
    const findCourseSection = await courseSectionRepo.findOne({ where: { id: section_id } })

    if (!findCourseSection) {
      return next(appError(404, '章節不存在'))
    }

    const deleteCourseSection = await courseSectionRepo.delete({ id: section_id })

    if (deleteCourseSection.affected === 1) {
      return sendResponse(res, 200, true, '課程章節刪除成功')
    } else {
      return next(appError(404, '課程章節刪除失敗'))
    }
  },
}

module.exports = courseController
