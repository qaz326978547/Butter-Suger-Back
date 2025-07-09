const storage = require('../services/storage')
const { appError, sendResponse } = require('../utils/responseFormat')
const wrapAsync = require('../utils/wrapAsync')
const { dataSource } = require('../db/data-source')
const updateTeacherRating = require('../services/teacher/updateTeacherRating')
const logSystemAction = require('../services/system/logSystemAction')
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
  getCourseCategory: wrapAsync(async (req, res, next) => {
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
  }),

  /*
   * 取得所有課程類別
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
  getCourseList: wrapAsync(async (req, res, next) => {
    let pageNum = req.query?.pageNum || 1
    let perNum = 12;

    if(pageNum<=0){
      pageNum = 1
    }

    const courseRepo = dataSource.getRepository('courses')
    const courses = await courseRepo.find({
      take: perNum,
      skip: (pageNum-1)*perNum,
      relations: ['handouts', 'category', 'teacher', 'teacher.user'],
      order: {created_at: 'DESC'}
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

    return sendResponse(res, 200, true, '取得課程列表成功', result)
    /* return sendResponse(res, 200, true, '取得課程列表成功', { data: result, perNum, pageNum }) */
  }),

  /*
   * 取得單一課程
   * @route GET /api/v1/course/:courseId
   */
  getCourse: wrapAsync(async (req, res, next) => {
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
  }),

  /*
   * 新增課程標題
   * @route POST /api/v1/course/create/title
   */
  createCourseTitle: wrapAsync(async (req, res, next) => {
    const user_id = req.user?.id
    const { course_name } = req.body
    const courseRepo = dataSource.getRepository('courses')
    const teacherRepo = dataSource.getRepository('teacher')
    let logEntry = req.logEntry
    logEntry = {
      ...logEntry,
      action: "新增課程標題",
      sys_module: "後台頁面-教師課程頁面模組"
    }

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

    await logSystemAction({
      ...logEntry,
      status:"201"
    })    
    return sendResponse(res, 201, true, '課程標題新增成功', { course })
  }),

  /*
   * 新增課程類別
   * @route POST /api/v1/course/:courseId/category
   */
  createCourseCategory: wrapAsync(async (req, res, next) => {
    const courseId = req.params.courseId
    const { category_id } = req.body
    let logEntry = req.logEntry
    logEntry = {
      ...logEntry,
      action: "新增課程類別",
      sys_module: "後台頁面-教師課程頁面模組"
    }

    if (!courseId) {
      await logSystemAction({
        ...logEntry,
        status:"400"
      })
      return next(appError(400, '請提供課程 ID'))
    }
    const courseRepo = dataSource.getRepository('courses')
    const course = await courseRepo.findOne({ where: { id: courseId } })
    if (!course) {
      await logSystemAction({
        ...logEntry,
        status:"404"
      })
      return next(appError(404, '課程不存在'))
    }
    if (!category_id) {
      await logSystemAction({
        ...logEntry,
        status:"400"
      })
      return next(appError(400, '請提供類別 ID'))
    }
    course.category_id = category_id
    await courseRepo.save(course)

    await logSystemAction({
      ...logEntry,
      status:"200"
    })
    return sendResponse(res, 200, true, '課程類別新增成功', { course })
  }),

  /*
   * 上傳課程小圖
   * @route POST /api/v1/course/:courseId/upload/small-image
   */
  uploadCourseSmallImage: wrapAsync(async (req, res, next) => {
    let logEntry = req.logEntry
    logEntry = {
      ...logEntry,
      action: "上傳課程小圖",
      sys_module: "後台頁面-教師課程頁面模組"
    }

    const imageUrl = await updateCourseMediaService({
      courseId: req.params.courseId,
      file: req.file,
      folderName: 'course-small-images',
      fieldName: 'course_small_imageUrl',
      type: 'image', // 限制為圖片格式
    })

    await logSystemAction({
      ...logEntry,
      status:"200"
    })
    return sendResponse(res, 200, true, '圖片上傳成功', { imageUrl })
  }),

  /*
   * 刪除課程小圖
   * @route DELETE /api/v1/course/:courseId/small-image
   */
  deleteCourseSmallImage: wrapAsync(async (req, res, next) => {
    logEntry = {
      ...logEntry,
      action: "刪除課程小圖",
      sys_module: "後台頁面-教師課程頁面模組"
    }

    await deleteCourseMedia({
      courseId: req.params.courseId,
      fieldName: 'course_small_imageUrl',
    })

    await logSystemAction({
      ...logEntry,
      status:"200"
    })
    return sendResponse(res, 200, true, '圖片已刪除')
  }),

  /*
   * 上傳課程描述圖片
   * @route POST /api/v1/course/:courseId/description-image
   */
  uploadCourseDescriptionImage: wrapAsync(async (req, res, next) => {
    let logEntry = req.logEntry
    logEntry = {
      ...logEntry,
      action: "上傳課程描述圖片",
      sys_module: "後台頁面-教師課程頁面模組"
    }

    const imageUrl = await updateCourseMediaService({
      courseId: req.params.courseId,
      file: req.file,
      folderName: 'course-description-images',
      fieldName: MediaField.DESCRIPTION,
    })

    await logSystemAction({
      ...logEntry,
      status:"200"
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
    let logEntry = req.logEntry
    logEntry = {
      ...logEntry,
      action: "上傳課程 Banner 圖片",
      sys_module: "後台頁面-教師課程頁面模組"
    }

    const imageUrl = await updateCourseMediaService({
      courseId: req.params.courseId,
      file: req.file,
      folderName: 'course-banner-images',
      fieldName: MediaField.BANNER,
    })

    await logSystemAction({
      ...logEntry,
      status:"200"
    })
    return sendResponse(res, 200, true, 'Banner 圖片上傳成功', { imageUrl })
  }),

  /*
   * 刪除課程 Banner 圖片
   * @route DELETE /api/v1/course/:courseId/banner
   */
  deleteCourseBanner: wrapAsync(async (req, res, next) => {
    let logEntry = req.logEntry
    logEntry = {
      ...logEntry,
      action: "刪除課程 Banner 圖片",
      sys_module: "後台頁面-教師課程頁面模組"
    }

    await deleteCourseMedia({
      courseId: req.params.courseId,
      fieldName: MediaField.BANNER,
    })

    await logSystemAction({
      ...logEntry,
      status:"200"
    })
    return sendResponse(res, 200, true, 'Banner 圖片已刪除')
  }),

  /*
   * 上傳課程預告影片
   * @route POST /api/v1/course/:courseId/upload/trailer
   */
  uploadCourseTrailer: wrapAsync(async (req, res, next) => {
    let logEntry = req.logEntry
    logEntry = {
      ...logEntry,
      action: "上傳課程預告影片",
      sys_module: "後台頁面-教師課程頁面模組"
    }

    const videoUrl = await updateCourseMediaService({
      courseId: req.params.courseId,
      file: req.file,
      folderName: 'course-trailers',
      fieldName: MediaField.TRAILER,
      type: 'video', // 限制為影片格式
    })

    await logSystemAction({
      ...logEntry,
      status:"200"
    })
    return sendResponse(res, 200, true, '預告影片上傳成功', { videoUrl })
  }),

  /*
   * 刪除課程預告影片
   * @route DELETE /api/v1/course/:courseId/upload/trailer
   */
  deleteCourseTrailer: wrapAsync(async (req, res, next) => {
    const { courseId } = req.params
    let logEntry = req.logEntry
    logEntry = {
      ...logEntry,
      action: "刪除課程預告影片",
      sys_module: "後台頁面-教師課程頁面模組"
    }

    // 確認課程是否存在
    const courseRepo = dataSource.getRepository('courses')
    const course = await courseRepo.findOne({ where: { id: courseId } })
    if (!course) {
      await logSystemAction({
        ...logEntry,
        status:"404"
      })
      return next(appError(404, '課程不存在'))
    }

    // 刪除預告影片
    await deleteVideo(courseId)
    await logSystemAction({
      ...logEntry,
      status:"200"
    })
    return sendResponse(res, 200, true, '預告影片已刪除')
  }),
  /*
   * 取得課程講義
   * @route GET /api/v1/course/:courseId/handouts
   */
  getCourseHandOuts: wrapAsync(async (req, res, next) => {
    const { courseId } = req.params
    let logEntry = req.logEntry
    logEntry = {
      ...logEntry,
      action: "取得課程講義",
      sys_module: "後台頁面-教師課程頁面模組"
    }

    // 確認課程是否存在
    const courseRepo = dataSource.getRepository('courses')
    const course = await courseRepo.findOne({ where: { id: courseId } })
    if (!course) {
      await logSystemAction({
        ...logEntry,
        status:"404"
      })
      return next(appError(404, '課程不存在'))
    }

    const handoutRepo = dataSource.getRepository('course_handouts')
    const handouts = await handoutRepo.find({ where: { course_id: courseId } })

    await logSystemAction({
      ...logEntry,
      status:"200"
    })
    return sendResponse(res, 200, true, '取得課程講義成功', { handouts })
  }),

  /*
   * 上傳課程多個講義
   * @route POST /api/v1/course/course-id/upload/course-handouts
   */
  uploadCourseHandOuts: wrapAsync(async (req, res, next) => {
    const { courseId } = req.params
    let files = req.files || []
    let logEntry
    logEntry = {
      ...logEntry,
      action: "上傳課程多個講義",
      sys_module: "後台頁面-教師課程頁面模組"
    }

    if (!files || files.length === 0) {
      await logSystemAction({
        ...logEntry,
        status:"400"
      })
      return res.status(400).json({ status: 'error', message: '請上傳檔案' })
    }

    files = req.files.map(file=>{
      return {
        ...file,
        originalname: Buffer.from(file.originalname, 'latin1').toString('utf8')
      }
    })

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

    await logSystemAction({
      ...logEntry,
      status:"200"
    })
    return sendResponse(res, 200, true, '講義上傳成功', { handouts: handoutsWithMB })
  }),

  /*
   * 刪除課程講義
   * @route DELETE /api/v1/course/:courseId/handouts/:handoutId
   */
  deleteCourseHandOuts: wrapAsync(async (req, res, next) => {
    const { handoutId } = req.params
    let logEntry = req.logEntry
    logEntry = {
      ...logEntry,
      action: "刪除課程講義",
      sys_module: "後台頁面-教師課程頁面模組"
    }

    // 確認 service 名稱與參數格式
    const deleted = await deleteHandout({ handoutId })

    if (!deleted) {
      await logSystemAction({
        ...logEntry,
        status:"404"
      })
      return next(appError(404, '講義不存在或已被刪除'))
    }

    await logSystemAction({
      ...logEntry,
      status:"200"
    })
    return sendResponse(res, 200, true, '講義已成功刪除', { handoutId })
  }),

  /*
   * 新增修改課程價格
   * @route POST /api/v1/course/:courseId/price
   */

  updateCoursePrice: wrapAsync(async (req, res, next) => {
    const { courseId } = req.params
    const { origin_price, sell_price } = req.body
    let logEntry = req.logEntry
    logEntry = {
      ...logEntry,
      action: "新增修改課程價格",
      sys_module: "後台頁面-教師課程頁面模組"
    }

    if (!courseId) {
      await logSystemAction({
        ...logEntry,
        status:"400"
      })
      return next(appError(400, '請提供課程 ID'))
    }

    const courseRepo = dataSource.getRepository('courses')
    const course = await courseRepo.findOne({ where: { id: courseId } })

    if (!course) {
      await logSystemAction({
        ...logEntry,
        status:"404"
      })
      return next(appError(404, '課程不存在'))
    }

    // 檢查是否已經有價格設定, 價格直接更新
/*     if (course.origin_price || course.sell_price) {
      return next(appError(400, '課程價格已存在，無法重複新增'))
    } */

    // 更新價格
    course.origin_price = origin_price
    course.sell_price = sell_price

    await courseRepo.update({ id: courseId }, course)

    await logSystemAction({
      ...logEntry,
      status:"200"
    })
    return sendResponse(res, 200, true, '課程價格更新成功', { course })
  }),

  /*
   * 儲存課程資訊
   * @route POST /api/v1/course/:courseId/save
   */
  saveCourse: wrapAsync(async (req, res, next) => {
    const { courseId } = req.params
    const { suitable_for, course_goal, course_description, course_banner_description } =
      req.validatedData
    let logEntry = req.logEntry
    logEntry = {
      ...logEntry,
      action: "儲存課程資訊",
      sys_module: "後台頁面-教師課程頁面模組"
    }

    const courseRepo = dataSource.getRepository('courses')
    const course = await courseRepo.findOne({ where: { id: courseId } })

    if (!course) {
      await logSystemAction({
        ...logEntry,
        status:"404"
      })
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
      await logSystemAction({
        ...logEntry,
        status:"400"
      })
      return next(appError(400, `課程資料缺少以下欄位：${missingFields.join(', ')}`))
    }

    // 更新欄位
    course.suitable_for = suitable_for
    course.course_goal = course_goal
    course.course_description = course_description
    course.course_banner_description = course_banner_description

    await courseRepo.save(course)

    await logSystemAction({
      ...logEntry,
      status:"200"
    })
    return sendResponse(res, 200, true, '課程資訊儲存成功', { course })
  }),

  /*
   * 取得課程講義
   * @route GET /api/v1/course/course-id/upload/course-handouts
   */
  getCourseHandOuts: wrapAsync(async (req, res, next) => {
    const courseId = req.params.courseId
    let logEntry = req.logEntry
    logEntry = {
      ...logEntry,
      action: "取得課程講義",
      sys_module: "後台頁面-教師課程頁面模組"
    }

    if (!courseId) {
      await logSystemAction({
        ...logEntry,
        status:"400"
      })
      return next(appError(400, '請提供課程 ID'))
    }

    const courseHandoutRepo = dataSource.getRepository('course_handouts')
    const handouts = await courseHandoutRepo.find({ where: { course_id: courseId } })

    await logSystemAction({
      ...logEntry,
      status:"200"
    })
    return sendResponse(res, 200, true, '取得教材列表成功', { handouts })
  }),

  /*
   * 新增修改課程價格 
   * @route POST /api/v1/course/:courseId/price
   */
  /* createCoursePrice: wrapAsync(async (req, res, next) => {
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
  }), */

  /*
   * 更新課程狀態
   * @route POST /api/v1/course/:courseId/status
   */
  updateCourseStatus: wrapAsync(async (req, res, next) => {
    const { courseId } = req.params
    const { course_status } = req.body
    let logEntry = req.logEntry
    logEntry = {
      ...logEntry,
      action: "更新課程狀態",
      sys_module: "後台管理者模組"
    }

    const courseRepo = dataSource.getRepository('courses')
    const course = await courseRepo.findOne({ where: { id: courseId } })

    if (!course) {
      await logSystemAction({
        ...logEntry,
        status:"404"
      })
      return next(appError(404, '課程不存在'))
    }

    const updateCourseStatusResult = await courseRepo.update(
      { id: courseId },
      { course_status: course_status }
    )

    if (updateCourseStatusResult.affected == 1) {
      const updateCourse = await courseRepo.findOne({ where: { id: courseId } })
      await logSystemAction({
        ...logEntry,
        status:"200"
      })
      return sendResponse(res, 200, true, '課程狀態更新成功', updateCourse)
    } else {
      await logSystemAction({
        ...logEntry,
        status:"400"
      })
      return next(appError(400, '課程狀態更新失敗'))
    }
  }),

  /*
   * 新增課程評價
   * @route POST /api/v1/course/:courseId/ratings
   */
  postRatings: wrapAsync(async (req, res, next) => {
    const user_id = req.user.id
    const course_id = req.params.courseId
    const { rating_score, review_text } = req.body

    let logEntry = req.logEntry
    logEntry = {
      ...logEntry,
      action: "新增課程評價",
      sys_module: "前台頁面-我的課程頁面模組"
    }

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
      await logSystemAction({
        ...logEntry,
        status:"400"
      })  
      return next(appError(400, '抱歉，無法評價自己的課程'))
    }

    const ratingsRepo = dataSource.getRepository('ratings')
    const findRating = await ratingsRepo.findOne({ where:{course_id:course_id, user_id:user_id }})
    
    if(findRating){
      await logSystemAction({
        ...logEntry,
        status:"400"
      })  
      return next(appError(400, '抱歉，無法重複評價課程'))
    }

    const newRatings = ratingsRepo.create({
      user_id: user_id,
      course_id: course_id,
      rating_score: rating_score,
      review_text: review_text,
    })
    const result = await ratingsRepo.save(newRatings)

    updateTeacherRating(course_id)

    await logSystemAction({
      ...logEntry,
      status:"200"
    })  
    return sendResponse(res, 200, true, '新增評價成功', result)
  }),

  /*
   * 修改特定課程評價
   * @route PATCH /api/v1/course/:courseId/ratings
   */
  patchRatings: wrapAsync(async (req, res, next) => {
    const user_id = req.user.id
    const course_id = req.params.courseId
    const { rating_score, review_text } = req.body
    let logEntry = req.logEntry
    logEntry = {
      ...logEntry,
      action: "修改特定課程評價",
      sys_module: "前台頁面-我的課程頁面模組"
    }

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
      await logSystemAction({
        ...logEntry,
        status:"400"
      })
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

    if(!updateRatings.affected){
      await logSystemAction({
        ...logEntry,
        status:"400"
      })
      return next(appError(400, '更新評價失敗'))
    }

    updateTeacherRating(course_id)

    await logSystemAction({
      ...logEntry,
      status:"200"
    })  
    return sendResponse(res, 200, true, '更新評價成功')
  }),

  /*
   * 取得首頁熱門課程資料
   * @route GET /api/v1/course/popular
   */
  getPopularCourses: wrapAsync(async (req, res, next) => {
    let pageNum = req.query.pageNum || 1
    let perNum = 12;

    if(pageNum<=0){
      pageNum = 1
    }

    const offset = (pageNum - 1) * perNum;

    const ratingsRepo = dataSource.getRepository('ratings')
    //因效能問題, 改成原生寫法
    const result = await ratingsRepo.query(`
        SELECT * FROM (
          SELECT rating.course_id AS course_id,
          ROUND(AVG(rating.rating_score)::numeric, 2) AS course_rating_score,
          COUNT(DISTINCT rating.user_id) AS course_total_users,
          course."course_banner_imageUrl" AS course_image_url,  
          course.course_name AS course_name,
          course.course_description AS course_description
          FROM ratings rating
          LEFT JOIN courses course ON course.id = rating.course_id 
          GROUP BY rating.course_id, course."course_banner_imageUrl", course.course_name, course.course_description 
          ORDER BY course_rating_score DESC NULLS LAST
        ) grouped
        LIMIT $1 OFFSET $2
      `, [perNum, offset])

    /* 不會自動跳頁 
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
      .orderBy('course_rating_score', 'DESC', 'NULLS LAST')
      .groupBy('rating.course_id')
      .addGroupBy('course.course_banner_imageUrl')
      .addGroupBy('course.course_name')
      .addGroupBy('course.course_description')
      .take(perNum)
      .skip((pageNum-1)*perNum)
      .getRawMany() 
      */

      return sendResponse(res, 200, true, '取得資料成功', result)
    /* return sendResponse(res, 200, true, '取得資料成功', {data:result , perNum, pageNum }) */
  }),
  
  /*
   * 取得所有課程評價
   * @route GET /api/v1/course/ratings
   */
  getRatings: wrapAsync(async (req, res, next) => {
    const ratingsRepo = dataSource.getRepository('ratings')
    const findRatings = await ratingsRepo
      .createQueryBuilder('rating')
      .select([
        'rating.id AS id',
        'user.id AS user_id',
        'user.name AS user_name',
        'user.profile_image_url AS profile_image_url',
        'rating.rating_score AS rating_score',
        'rating.review_text AS review_text',
        'rating.created_at AS created_at',
      ])
      .leftJoin('rating.users', 'user')
      .getRawMany()
    return sendResponse(res, 200, true, '成功取得資料', findRatings)
  }),

  /*
   * 提出課程問題
   * @route POST /api/v1/course/:courseId/questions
   */
  postQuestions: wrapAsync(async (req, res, next) => {
    const user_id = req.user.id
    const course_id = req.params.courseId
    const { question_text } = req.body
    let logEntry = req.logEntry
    logEntry = {
      ...logEntry,
      action: "提出課程問題",
      sys_module: "前台頁面-課程詳細頁面模組"
    }

    const courseRepo = dataSource.getRepository('courses')
    const findCourse = await courseRepo.findOne({ where: { id: course_id } })

    if (!findCourse) {
      await logSystemAction({
        ...logEntry,
        status:"404"
      })
      return next(appError(404, '課程不存在'))
    }

    const userRepo = dataSource.getRepository('users')
    const findUser = await userRepo.findOne({ where: { id: user_id } })

    if (!findUser) {
      await logSystemAction({
        ...logEntry,
        status:"404"
      })
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

    await logSystemAction({
      ...logEntry,
      status:"200"
    })
    return sendResponse(res, 200, true, '新增問題成功', result)
  }),

  /*
   * 提出課程回答
   * @route POST /api/v1/course/:courseId/answers
   */
  postAnswers: wrapAsync(async (req, res, next) => {
    const user_id = req.user.id
    const course_id = req.params.courseId
    const { question_id, answer_text } = req.body
    let logEntry = req.logEntry
    logEntry = {
      ...logEntry,
      action: "提出課程回答",
      sys_module: "前台頁面-課程詳細頁面模組"
    }

    const courseRepo = dataSource.getRepository('courses')
    const findCourse = await courseRepo.findOne({ where: { id: course_id } })

    if (!findCourse) {
      await logSystemAction({
        ...logEntry,
        status:"404"
      })
      return next(appError(404, '課程不存在'))
    }

    const userRepo = dataSource.getRepository('users')
    const findUser = await userRepo.findOne({ where: { id: user_id } })

    if (!findUser) {
      await logSystemAction({
        ...logEntry,
        status:"404"
      })
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

    await logSystemAction({
      ...logEntry,
      status:"200"
    })
    return sendResponse(res, 200, true, '新增回答成功', result)
  }),

  /*
   * 取得課程問題列表
   * @route GET /api/v1/course/:courseId/questions
   */
  getQuestions: wrapAsync(async (req, res, next) => {
    const course_id = req.params.courseId
    let logEntry = req.logEntry
    logEntry = {
      ...logEntry,
      action: "取得課程問題列表",
      sys_module: "前台頁面-課程詳細頁面模組"
    }

    const questionRepo = dataSource.getRepository('question')

    const findQuestion = await questionRepo
      .createQueryBuilder('question')
      .select([
        'question.id AS id',
        'user.id AS user_id',
        'user.name AS user_name',
        'user.profile_image_url AS profile_image_url',
        'question.question_text AS question_text',
        'question.created_at AS created_at',
        'question.serial_id AS serial_id',
      ])
      .leftJoin('question.user', 'user')
      .where('course_id = :course_id', { course_id: course_id })
      .getRawMany()

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
    let findAnswer
    for (const question of findQuestion) {
      findAnswer = await answerRepo
        .createQueryBuilder('answer')
        .select([
          'answer.user_id AS user_id',
          'user.name AS user_name',
          'user.profile_image_url AS profile_image_url',
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

    await logSystemAction({
      ...logEntry,
      status:"200"
    })
    return sendResponse(res, 200, true, '取得課程問題列表', findQuestion)
  }),

  /*
   * 新增課程章節
   * @route POST - /api/v1/course/:courseId/section
   */
  postCourseSection: wrapAsync(async (req, res, next) => {
    const course_id = req.params.courseId
    const { main_section_title } = req.body
    let logEntry = req.logEntry
    logEntry = {
      ...logEntry,
      action: "新增課程章節",
      sys_module: "前台頁面-教師課程頁面模組"
    }

    const courseRepo = dataSource.getRepository('courses')
    const findCourse = await courseRepo.findOne({ where: { id: course_id } })

    if (!findCourse) {
      await logSystemAction({
        ...logEntry,
        status:"404"
      })
      return next(appError(404, '課程不存在'))
    }

    const courseSectionRepo = dataSource.getRepository('course_section')
    const lastSection = await courseSectionRepo
      .createQueryBuilder('section')
      .select('MAX(section.order_index)', 'max')
      .where('section.course_id = :course_id', { course_id })
      .getRawOne()

    const newOrderIndex = (lastSection.max || 0) + 1

    const newCourseSection = courseSectionRepo.create({
      course_id: course_id,
      order_index: newOrderIndex,
      main_section_title: main_section_title,
    })

    const result = await courseSectionRepo.save(newCourseSection)

    await logSystemAction({
      ...logEntry,
      status:"200"
    })
    return sendResponse(res, 200, true, '新增章節成功', result)
  }),

  /*
   * 取得課程章節
   * @route GET - /api/v1/course/:courseId/section
   */
/*   getCourseSection: wrapAsync(async (req, res, next) => {
    const course_id = req.params.courseId

    const sectionRepo = dataSource.getRepository('course_section')

    //取得章節所有資料        
    findCourseSection = await sectionRepo.createQueryBuilder('section')
    .select([
      'section.id',
      'section.order_index',
      'section.main_section_title'
    ])
    .leftJoin('section.subsections', 'subsection')
    .addSelect([
      'subsection.id',
      'subsection.section_id',
      'subsection.order_index',
      'subsection.subsection_title',
      'subsection.is_preview_available'
    ])
    .orderBy('section.order_index', 'ASC')
    .addOrderBy('subsection.order_index', 'ASC')
    .where('section.course_id=:course_id', {course_id:course_id})
    .getMany()

    return sendResponse(res, 200, true, '取得課程章節成功', findCourseSection)
  }), */

  /*
  * 修改課程章節
  * @route PATCH - /api/v1/course/section/:courseSectionId
  */
  patchCourseSection: wrapAsync(async (req, res, next) => {
    const section_id = req.params.sectionId
    const { main_section_title } = req.body
    let logEntry = req.logEntry
    logEntry = {
      ...logEntry,
      action: "修改課程章節",
      sys_module: "前台頁面-教師課程頁面模組"
    }

    const courseSectionRepo = dataSource.getRepository('course_section')
    let findCourseSection = await courseSectionRepo.findOne({ where: { id: section_id } })

    if (!findCourseSection) {
      await logSystemAction({
        ...logEntry,
        status:"404"
      })
      return next(appError(404, '章節不存在'))
    }

    const updateCourseSection = await courseSectionRepo.update(
      { id: section_id },
      { main_section_title: main_section_title }
    )

    if(!updateCourseSection.affected){
      await logSystemAction({
        ...logEntry,
        status:"404"
      })
      return next(appError(404, '更新課程章節失敗'))
    }

    await logSystemAction({
      ...logEntry,
      status:"200"
    })
    findCourseSection = await courseSectionRepo.findOne({ where: { id: section_id } })
    return sendResponse(res, 200, true, '更新課程章節成功', findCourseSection)
  }),


  /*
   * 收藏課程
   * @route POST /favorites/:courseId
   */
  postFavoriteCourse: wrapAsync(async (req, res, next) => {
    const user_id = req.user.id
    const { course_id } = req.body
    let logEntry = req.logEntry
    logEntry = {
      ...logEntry,
      action: "收藏課程",
      sys_module: "前台頁面-課程頁面模組"
    }

    const courseRepo = dataSource.getRepository('courses')
    const findCourse = await courseRepo.findOne({ where: { id: course_id } })

    if (!findCourse) {
      await logSystemAction({
        ...logEntry,
        status:"404"
      })
      return next(appError(404, '課程不存在'))
    }

    const favoriteRepo = dataSource.getRepository('favorite_course')
    const findFavorite = await favoriteRepo.findOne({
      where: { user_id: user_id, course_id: course_id },
    })

    if (findFavorite) {
      await logSystemAction({
        ...logEntry,
        status:"200"
      })
      return sendResponse(res, 200, true, '你已經收藏過此課程', findFavorite)
    }

    const newFavorite = favoriteRepo.create({ user_id: user_id, course_id: course_id })
    await favoriteRepo.save(newFavorite)

    const findFavoriteCourse = await favoriteRepo
      .createQueryBuilder('favorite_course')
      .select([
        'favorite_course.id AS id',
        'user.name AS teacher_name',
        'course.id AS course_id',
        'course.course_name AS course_name',
        'course.course_banner_imageUrl AS course_banner_imageUrl',
        'course.course_banner_description AS course_banner_description',
        'course.course_small_imageUrl AS course_small_imageUrl',
        'course.course_description AS course_description',
        'course.course_description_imageUrl AS course_description_imageUrl',
        'course.course_hours AS course_hours',
        'course.origin_price AS origin_price',
        'course.sell_price AS sell_price',
        'course.total_users AS total_users',
        'course.trailer_url AS trailer_url',
        'course.suitable_for AS suitable_for',
        'course.course_goal AS course_goal',
      ])
      .leftJoin('favorite_course.course', 'course')
      .leftJoin('course.teacher', 'teacher')
      .leftJoin('teacher.user', 'user')
      .where('favorite_course.user_id = :user_id', { user_id: user_id })
      .getRawMany()

    const ratingRepo = dataSource.getRepository('ratings')

    //每門課的平均評價分數
    const avgRatings = await ratingRepo
      .createQueryBuilder('rating')
      .select([
        'rating.course_id AS course_id',
        'ROUND(AVG(rating.rating_score)::numeric, 2) AS avg_rating_score',
        'COUNT(rating.id) AS course_rating_users',
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
      avgRatings.map((r) => [
        r.course_id,
        { avg_rating_score: r.avg_rating_score, course_rating_users: r.course_rating_users },
      ])
    )
    const myRatingMap = Object.fromEntries(myRatings.map((r) => [r.course_id, r.rating_score]))

    const findFavoriteResult = findFavoriteCourse.map((findFavorite) => {
      return {
        ...findFavorite,
        course_ratings: {
          rating_score: myRatingMap[findFavorite.course_id] || '',
          avg_rating_score: avgRatingMap[findFavorite.course_id] || '',
        },
      }
    })

    await logSystemAction({
      ...logEntry,
      status:"200"
    })
    return sendResponse(res, 200, true, '成功收藏課程', findFavoriteResult)
  }),

  /*
   * 取得收藏課程
   * @route GET /favorites
   */
  getFavoriteCourse: wrapAsync(async (req, res, next) => {
    const user_id = req.user.id
    let logEntry = req.logEntry
    logEntry = {
      ...logEntry,
      action: "取得收藏課程",
      sys_module: "前台頁面-課程頁面模組"
    }

    const favoriteRepo = dataSource.getRepository('favorite_course')
    const findFavoriteCourse = await favoriteRepo
      .createQueryBuilder('favorite_course')
      .select([
        'favorite_course.id AS id',
        'user.name AS teacher_name',
        'course.id AS course_id',
        'course.course_name AS course_name',
        'course.course_banner_imageUrl AS course_banner_imageUrl',
        'course.course_banner_description AS course_banner_description',
        'course.course_small_imageUrl AS course_small_imageUrl',
        'course.course_description AS course_description',
        'course.course_description_imageUrl AS course_description_imageUrl',
        'course.course_hours AS course_hours',
        'course.origin_price AS origin_price',
        'course.sell_price AS sell_price',
        'course.total_users AS total_users',
        'course.trailer_url AS trailer_url',
        'course.suitable_for AS suitable_for',
        'course.course_goal AS course_goal',
      ])
      .leftJoin('favorite_course.course', 'course')
      .leftJoin('course.teacher', 'teacher')
      .leftJoin('teacher.user', 'user')
      .where('favorite_course.user_id = :user_id', { user_id: user_id })
      .getRawMany()

    const ratingRepo = dataSource.getRepository('ratings')

    //每門課的平均評價分數
    const avgRatings = await ratingRepo
      .createQueryBuilder('rating')
      .select([
        'rating.course_id AS course_id',
        'ROUND(AVG(rating.rating_score)::numeric, 2) AS avg_rating_score',
        'COUNT(rating.id) AS course_rating_users',
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
      avgRatings.map((r) => [
        r.course_id,
        { avg_rating_score: r.avg_rating_score, course_rating_users: r.course_rating_users },
      ])
    )
    const myRatingMap = Object.fromEntries(myRatings.map((r) => [r.course_id, r.rating_score]))

    const findFavoriteResult = findFavoriteCourse.map((findFavorite) => {
      return {
        ...findFavorite,
        course_ratings: {
          rating_score: myRatingMap[findFavorite.course_id] || '',
          avg_rating_score: avgRatingMap[findFavorite.course_id] || '',
        },
      }
    })

    await logSystemAction({
      ...logEntry,
      status:"200"
    })
    return sendResponse(res, 200, true, '成功取得收藏課程', findFavoriteResult)
  }),

  /*
   * 取消收藏課程
   * @route GET /favorites
   */
  deleteFavoriteCourse: wrapAsync(async (req, res, next) => {
    const user_id = req.user.id
    const favorite_id = req.params.favoriteId
    let logEntry = req.logEntry
    logEntry = {
      ...logEntry,
      action: "取消收藏課程",
      sys_module: "前台頁面-課程頁面模組"
    }

    const favoriteRepo = dataSource.getRepository('favorite_course')
    const deleteResult = await favoriteRepo.delete({ id: favorite_id })

    if (!deleteResult.affected) {
      await logSystemAction({
        ...logEntry,
        status:"404"
      })
      return next(appError(404, '課程不存在'))
    }

    const findFavoriteCourse = await favoriteRepo
      .createQueryBuilder('favorite_course')
      .select([
        'favorite_course.id AS id',
        'user.name AS teacher_name',
        'course.id AS course_id',
        'course.course_name AS course_name',
        'course.course_banner_imageUrl AS course_banner_imageUrl',
        'course.course_banner_description AS course_banner_description',
        'course.course_small_imageUrl AS course_small_imageUrl',
        'course.course_description AS course_description',
        'course.course_description_imageUrl AS course_description_imageUrl',
        'course.course_hours AS course_hours',
        'course.origin_price AS origin_price',
        'course.sell_price AS sell_price',
        'course.total_users AS total_users',
        'course.trailer_url AS trailer_url',
        'course.suitable_for AS suitable_for',
        'course.course_goal AS course_goal',
      ])
      .leftJoin('favorite_course.course', 'course')
      .leftJoin('course.teacher', 'teacher')
      .leftJoin('teacher.user', 'user')
      .where('favorite_course.user_id = :user_id', { user_id: user_id })
      .getRawMany()

    const ratingRepo = dataSource.getRepository('ratings')

    //每門課的平均評價分數
    const avgRatings = await ratingRepo
      .createQueryBuilder('rating')
      .select([
        'rating.course_id AS course_id',
        'ROUND(AVG(rating.rating_score)::numeric, 2) AS avg_rating_score',
        'COUNT(rating.id) AS course_rating_users',
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
      avgRatings.map((r) => [
        r.course_id,
        { avg_rating_score: r.avg_rating_score, course_rating_users: r.course_rating_users },
      ])
    )
    const myRatingMap = Object.fromEntries(myRatings.map((r) => [r.course_id, r.rating_score]))

    const findFavoriteResult = findFavoriteCourse.map((findFavorite) => {
      return {
        ...findFavorite,
        course_ratings: {
          rating_score: myRatingMap[findFavorite.course_id] || '',
          avg_rating_score: avgRatingMap[findFavorite.course_id] || '',
        },
      }
    })

    await logSystemAction({
      ...logEntry,
      status:"200"
    })
    return sendResponse(res, 200, true, '成功刪除收藏課程', findFavoriteResult)
  }),

  /*
   * 取得我的課程列表
   * @route GET /api/v1/course/my-courses
   */
  getMyCourse: wrapAsync(async (req, res, next) => {
    const user_id = req.user.id
    let logEntry = req.logEntry
    logEntry = {
      ...logEntry,
      action: "取得我的課程列表",
      sys_module: "前台頁面-我的課程頁面模組"
    }

    let pageNum = req.query.pageNum || 1
    let perNum = 12;

    if(pageNum<=0){
      pageNum = 1
    }

    const offset = (pageNum - 1) * perNum;

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
        'course.created_at AS course_created_at',
        'student_course.purchase_date AS purchase_date',
        'student_course.last_accessed_at AS last_accessed_at',
        'student_course.last_subsection_id AS last_subsection_id',
        'student_course.completion_percentage AS completion_percentage',
      ])
      .leftJoin('student_course.user', 'user')
      .leftJoin('student_course.course', 'course')
      .leftJoin('course.teacher', 'teacher')
      .orderBy('course.created_at', 'DESC')
      .where('student_course.user_id=:user_id', { user_id: user_id })
      .take(perNum)
      .skip(offset)
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
      course_small_imageUrl: studentCourse.course_small_imageurl,
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

    await logSystemAction({
      ...logEntry,
      status:"200"
    })

    return sendResponse(res, 200, true, '成功取得我的課程', result)
    /* return sendResponse(res, 200, true, '成功取得我的課程', {data: result , perNum, pageNum }) */
  }),

  /*
   * 取得已購買的課程列表
   * @route GET - /api/v1/course/purchased
   */
  getPurchased: wrapAsync(async (req, res, next) => {
    const user_id = req.user.id
    let logEntry = req.logEntry
    logEntry = {
      ...logEntry,
      action: "取得已購買的課程列表",
      sys_module: "前台頁面-購物車模組"
    }

    //取得已購買的課程列表
    const studentCourseRepo = dataSource.getRepository('student_course')
    const findStudentCourse = await studentCourseRepo
      .createQueryBuilder('student_course')
      .select(['course.id AS course_id', 'course.course_name AS course_name'])
      .leftJoin('student_course.course', 'course')
      .where('student_course.user_id=:user_id', { user_id: user_id })
      .getRawMany()

    await logSystemAction({
      ...logEntry,
      status:"200"
    })  
    return sendResponse(res, 200, true, '成功取得已購買的課程列表', findStudentCourse)
  }),

/********************以下暫存****************** */

  /*
  * 刪除課程章節
  * @route DELETE - /api/v1/course/section/:courseSectionId
  */
/*   deleteCourseSection: wrapAsync(async (req, res, next) => {
    const section_id = req.params.sectionId

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
  }), */

  /*
  * 批次編輯課程小節
  * @route patch - /api/v1/course/:courseId/subsection
  */
/*   patchSubsection: wrapAsync(async (req, res, next) => {
    const course_id = req.params.courseId
    const sectionList = req.body
    let subsection, findSection, findSubsection, deleteResult

    await dataSource.transaction(async (manager) => {
      const sectionRepo = manager.getRepository('course_section')
      const subsectionRepo = manager.getRepository('course_subsection')

      const ids = new Set(sectionList.map(item => item.id))
  
      for(const id of ids){
        deleteResult = await subsectionRepo.delete({ section_id: id })
        console.log(deleteResult)
      }

      for(const section of sectionList){
        subsection = section.subsections
  
        findSection = await sectionRepo.find({ where: { id: section.id } })
        findSubsection = await subsectionRepo.find({ where: { section_id: section.id } })
  
        //取得目前最大排序數字
        if(!findSection){
          const lastSection = await sectionRepo
            .createQueryBuilder('section')
            .select('MAX(section.order_index)', 'max')
            .where('section.course_id = :course_id', { course_id })
            .getRawOne()
      
          const newOrderIndex = (lastSection.max || 0) + 1
          const newSection = sectionRepo.create({
            course_id: course_id,
            order_index: newOrderIndex,
            main_section_title: section.main_section_title
          })
      
          await sectionRepo.save(newSection)
        }else{
          await sectionRepo.update({id: section.id}, {
            course_id: course_id,
            order_index: section.order_index,
            main_section_title: section.main_section_title
          })
        }

        //新增小節
        for(const sub of subsection){
          const newSubsection = subsectionRepo.create({
            section_id: section.id,
            subsection_title: sub.subsection_title,
            order_index: sub.order_index,
            is_preview_available: sub.is_preview_available
          })
          await subsectionRepo.save(newSubsection)
        }

        //取得章節所有資料        
        findSection = await sectionRepo.createQueryBuilder('section')
        .select([
          'section.id',
          'section.order_index',
          'section.main_section_title'
        ])
        .leftJoin('section.subsections', 'subsection')
        .addSelect([
          'subsection.section_id',
          'subsection.order_index',
          'subsection.subsection_title',
          'subsection.is_preview_available'
        ])
        .orderBy('section.order_index', 'ASC')
        .addOrderBy('subsection.order_index', 'ASC')
        .getMany()
      }
    })
    
    return sendResponse(res, 200, true, '更新章節成功', findSection)
  }), */

/*   postCourseSubsection: wrapAsync(async (req, res, next) => {
    const section_id = req.params.sectionId
    const subsectionAry = req.body

    const subsectionRepo = dataSource.getRepository('course_subsection')
    let findSubsection = await subsectionRepo.find({ where: { id: section_id } })

    if (findSubsection) {
      const deleteResult = await subsectionRepo.delete({ where: { id: section_id } })
      console.log("============delete===========")
      console.log("deleteResult: ", deleteResult)
      console.log("============delete===========")
    }

    for(const subsection of subsectionAry){
      const newSubsection = subsectionRepo.create({
        section_id: subsection.section_id,
        subsection_title: subsection.subsection_title,
        order_index: subsection.order_index,
        is_preview_available: subsection.is_preview_available
      })
      await subsectionRepo.save(newSubsection)
    }
    
    findSubsection = subsectionRepo.find({
      where:{section_id:section_id},
      relations: ['section']
    })

    console.log("============findSubsection==========")
    console.log("findSubsection: ", findSubsection)
    console.log("============findSubsection==========")
    
    return sendResponse(res, 200, true, '更新章節成功', findSubsection)
  }), */

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
  
}

module.exports = courseController
