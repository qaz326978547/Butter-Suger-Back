const { dataSource } = require('../db/data-source')
const { appError, sendResponse } = require('../utils/responseFormat')
const wrapAsync = require('../utils/wrapAsync')
const cleanUndefinedFields = require('../utils/cleanUndefinedFields')
const storage = require('../services/storage')
const updateUserAndTeacher = require('../services/teacher/updateUserAndTeacher')
const logSystemAction = require('../services/system/logSystemAction')


const teacherController = {
  /*
   * 取得教師資料
   * @route GET - /api/v1/teacher/profile
   */
  getTeacherData: wrapAsync(async (req, res, next) => {
    const userId = req.user.id
    const teacherRepo = dataSource.getRepository('teacher')
    let logEntry = req.logEntry
    logEntry = {
      ...logEntry,
      action: "取得教師資料",
      sys_module: "後台頁面-個人資料頁面模組"
    }

    // 確認教師是否存在
    const findTeacher = await teacherRepo.findOne({
      select: [
        'id',
        'user_id',
        'bank_name',
        'bank_account',
        'slogan',
        'description',
        'specialization'
      ],
      where: { user_id: userId },
      relations: ['user']
    })

    if (!findTeacher) {
      await logSystemAction({
        ...logEntry,
        status:"404"
      })
      return next(appError(404, '查無教師資料'))
    }

    await logSystemAction({
      ...logEntry,
      status:"200"
    })
    // 回傳教師資料
    sendResponse(res, 200, true, '取得教師資料成功', {
          name: findTeacher.user.name,
          nickname: findTeacher.user.nickname,
          phone: findTeacher.user.phone,
          birthday: findTeacher.user.birthday,
          sex: findTeacher.user.sex,
          address: findTeacher.user.address,
          profile_image_url: findTeacher.user.profile_image_url,
          bank_name: findTeacher.bank_name,
          bank_account: findTeacher.bank_account,
          slogan: findTeacher.slogan,
          description: findTeacher.description,
          specialization: findTeacher.specialization,
      })
  }),

  /*
  * 更新教師資料
  * @route PATCH - /api/v1/teacher/profile
  */
  updateTeacherData: wrapAsync(async (req, res, next) => {
    const userId = req.user.id
    const {name, nickname, phone, birthday, sex, address, bank_name, bank_account, slogan, description, specialization} = req.body
    let logEntry = req.logEntry
    logEntry = {
      ...logEntry,
      action: "更新教師資料",
      sys_module: "後台頁面-個人資料頁面模組"
    }

    const teacherRepo = dataSource.getRepository('teacher')
    // 確認教師是否存在
    const findTeacher = await teacherRepo.findOne({
        select: ['id'],
        where: { user_id: userId },
        relations: ['user']
    })

  // 清理未定義的欄位
    const updateUserData = cleanUndefinedFields({
        name, 
        nickname, 
        phone, 
        birthday, 
        sex, 
        address,
        profile_image_url: findTeacher?.user?.profile_image_url || '',
        teacher_status: 'pending'
    })

    // 清理未定義的欄位
    const updateTeacherData = cleanUndefinedFields({
        bank_name, 
        bank_account, 
        slogan, 
        description, 
        specialization
    })

    if(req.file){
        updateUserData.profile_image_url = await storage.upload(req.file, 'users')
    }

    await updateUserAndTeacher(userId, updateUserData, updateTeacherData)
    
    await logSystemAction({
      ...logEntry,
      status:"200"
    })
    return sendResponse(res, 200, true, '更新教師資料成功')
  }),

  /*
   * 取得教師課程
   * @route GET - /api/v1/teacher/teacherCourse?pageNum=1
   */
  getTeacherCourse: wrapAsync(async (req, res, next) => {
    const user_id = req.user.id
    let logEntry
    logEntry = {
      ...logEntry,
      action: "取得教師課程",
      sys_module: "前台頁面-教師課程頁面模組"
    }

    let pageNum = req.query.pageNum || 1
    let perNum = 12;

    if(pageNum<=0){
      pageNum = 1
    }

    const offset = (pageNum - 1) * perNum;

    const teacherCourseRepo = dataSource.getRepository('courses')
    //先查出分頁 course.id
    /* ids:  [
      { id: 'd0f981a2-2069-4f72-a027-66cf2a542ef9' },
      { id: '97464bde-ba8a-4dbf-8369-25e2656315aa' }
    ] */
    const ids = await teacherCourseRepo.createQueryBuilder('course')
    .select(['course.id','course.created_at'])
    .leftJoin('course.teacher', 'teacher')
    .leftJoin('teacher.user', 'user') 
    .where('user.id=:user_id', {user_id: user_id})
    .orderBy('course.created_at', 'DESC')
    .take(perNum)
    .skip(offset)
    .getMany() 

    const courseIds = ids.map(row=>row.id)
    
    //再查詳細資料
    const findTeacherCourse = await teacherCourseRepo.createQueryBuilder('course')
    .leftJoinAndSelect('course.teacher', 'teacher')
    .leftJoinAndSelect('teacher.user', 'user')
    .whereInIds(courseIds)
    .getMany()

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

    const result = findTeacherCourse.map((teacherCourse) => ({
      course_id: teacherCourse.id,
      course_status: teacherCourse.course_status,
      teacher_id: teacherCourse.teacher_id,
      teacher_name: teacherCourse.teacher?.user?.name,
      course_small_imageUrl: teacherCourse.teacher?.user?.course_small_imageurl,
      course_name: teacherCourse.course_name,
      course_ratings: {
        rating_score: myRatingMap[teacherCourse.id] || '',
        avg_rating_score: avgRatingMap[teacherCourse.id] || '',
      }
    }))

    await logSystemAction({
      ...logEntry,
      status:"200"
    })

    // 回傳教師資料
    sendResponse(res, 200, true, '取得教師課程成功', result)
    /* sendResponse(res, 200, true, '取得教師課程成功', {data: result, perNum, pageNum }) */
  }),

  /*
  * 取得教師收益表
  * @route GET - /api/v1/teacher/revenue
  */
  getTeacherRevenue: wrapAsync(async (req, res, next) => {
    const user_id = req.user.id
    let logEntry
    logEntry = {
      ...logEntry,
      action: "取得教師收益報表",
      sys_module: "後台頁面-教師課程頁面模組"
    }
    const teacherRepo = dataSource.getRepository('teacher')
    const findTeacher = await teacherRepo.createQueryBuilder('teacher')
    .select(['teacher.id AS teacher_id'])
    .leftJoin('teacher.user', 'user')
    .where('user.id=:user_id', {user_id})
    .getRawOne()

    const orderItemRepo = dataSource.getRepository('order_item')
    const summaryRevenue = await orderItemRepo.createQueryBuilder('orderItem')
    .select([
        'teacher.id AS teacher_id',
        'user.name AS user_name',
        'orderItem.course_id AS course_id',
        'course.course_name AS course_name',
        'orderItem.price AS course_price',
        'ROUND(SUM(orderItem.price * 0.25)) AS service_fee',
        'ROUND(SUM(orderItem.price * 0.75)) AS revenue_net',
        'COUNT(orderItem.course_id) AS total_students',
        'SUM(orderItem.price) AS total_revenue',
        'teacher.rating_score AS rating_score',
        'COUNT(orderItem.course_id) AS sales_count',
        'COUNT(course.id) AS opened_course_count',
        
    ])
    .leftJoin('orderItem.courses', 'course')
    .leftJoin('course.teacher', 'teacher')
    .leftJoin('teacher.user', 'user')
    .groupBy('teacher.id')
    .addGroupBy('orderItem.course_id')
    .addGroupBy('orderItem.price')
    .addGroupBy('course.course_name')
    .addGroupBy('user.name')
    .where('teacher.id = :teacher_id', { teacher_id: findTeacher.teacher_id })
    .getRawMany()

    const summaryRevenueNumber = summaryRevenue.map(row => ({
      ...row,
      service_fee: Number(row.service_fee),
      revenue_net: Number(row.revenue_net),
      total_students: Number(row.total_students),
      total_revenue: Number(row.total_revenue),
      rating_score: Number(row.rating_score),
      sales_count: Number(row.sales_count),
      opened_course_count: Number(row.opened_course_count),
      course_price: Number(row.course_price)      
    }))

    await logSystemAction({
      ...logEntry,
      status:"200"
    })
    
    return sendResponse(res, 200, true, '成功取得教師收益表', summaryRevenueNumber)
  }),

  /*
  * 取得精選教師
  * @route GET - /api/v1/teacher/featured
  */
  getTeacherFeatured: (async (req, res, next) => {
    const coursesRepo = dataSource.getRepository('courses')

    //內層： 先選出教師的最新課程，再把結果包成子查詢
    //先用 ROW_NUMBER() OVER (PARTITION BY teacher.id ORDER BY course.created_at DESC) 為同一教師的所有課程按 「開課時間」最新到最舊編上序號 rn(1,2,3,...)
    const sub = coursesRepo.createQueryBuilder('course')
    .select(['course.id AS course_id', 
      'course.course_name AS course_name', 
      'course.created_at AS created_at',
      'teacher.id AS teacher_id',
      'teacher.rating_score AS teacher_rating_score',
      'teacher.specialization AS teacher_specialization',
      'teacher.slogan AS teacher_slogan',
      'user.id AS user_id',
      'user.name AS teacher_name',
      'user.profile_image_url AS teacher_profile_image_url',
    "ROW_NUMBER() OVER (PARTITION BY teacher.id ORDER BY course.created_at DESC) AS rn"])
    .leftJoin('course.teacher', 'teacher') //relations:teacher => course.teacher
    .leftJoin('teacher.user', 'user')

    //外層： 再依據教師的評價排序和課程時間(只留 rn = 1)
    const result = await dataSource.createQueryBuilder()
    .select(['t.teacher_id',
              't.user_id',
              't.teacher_name',
              't.teacher_profile_image_url',
              't.teacher_specialization',
              't.teacher_slogan',
              't.course_id',
              't.course_name'
            ])   // 把子查詢 t 中的特定欄位撈出來
    .from('('+ sub.getQuery() +')', 't')
    .setParameters(sub.getParameters())  //把內層 QueryBuilder 用到的所有參數，原封不動地複製到外層 QueryBuilder
    .where('t.rn=1') // 取出第一筆
    .orderBy('t.teacher_rating_score', 'DESC', 'NULLS LAST')
    .addOrderBy('t.created_at', 'DESC')
    .limit(10)
    .getRawMany()

    return sendResponse(res, 200, true, '取得資料成功', result)
  }),

  /*
  * 取得單一精選教師資料
  * @route GET - /api/v1/teachers/:teacher-id
  */
  getSingleFeaturedTeacherData: wrapAsync(async (req, res, next) => {
    const {teacherId} = req.params

    // 取得課程資料, 不用 relations: ['teacher']，拆開請求比較好分類
    const coursesRepo = dataSource.getRepository('courses')
    const findCourses = await coursesRepo.find({
      select: ['id', 'course_small_imageUrl', 'course_name', 'course_hours','origin_price', 'sell_price', 'total_users'],
      where: { teacher_id:teacherId }
    })

    // 取得教師資料
    const teacherRepo = dataSource.getRepository('teacher')
    const findTeacher = await teacherRepo.findOne({
      select: ['id', 'rating_score', 'slogan', 'description', 'specialization'],
      where: { id:teacherId },
      relations:['user']
    })

    const ratingRepo = dataSource.getRepository('ratings')
    const ratingCount = await ratingRepo.createQueryBuilder('rating')
    .select('COUNT(rating.id)', 'rating_users')
    .leftJoin('rating.courses', 'course')
    .leftJoin('course.teacher', 'teacher')
    .where('teacher.id = :teacher_id', {teacher_id:teacherId})
    .getRawOne()

    //每門課的平均評價分數
    const avgRatings = await ratingRepo.createQueryBuilder('rating')
    .select(['rating.course_id AS course_id', 
            'ROUND(AVG(rating.rating_score)::numeric, 2) AS avg_rating_score',
            'COUNT(rating.id) AS course_rating_users',])
    .groupBy('rating.course_id')
    .getRawMany()


    //轉成物件
    const avgRatingMap = Object.fromEntries(avgRatings.map(r => [r.course_id, {avg_rating_score: r.avg_rating_score, course_rating_users: r.course_rating_users}]))
    
    const findCourseResult = findCourses.map(course => {
      return {
        ...course,
        course_ratings: avgRatingMap[course.id] || ''
      }
    })

    return sendResponse(res, 200, true, '取得資料成功', {
      teacher: {
            teacher_id : findTeacher.id,
            user_id : findTeacher.user.id,
            name: findTeacher.user.name,
            profile_image_url:findTeacher.user.profile_image_url,
            rating_score: findTeacher.rating_score, 
            rating_users: ratingCount.rating_users,	
            slogan: findTeacher.slogan,
            description: findTeacher.description,
            specialization: findTeacher.specialization    
          },
      course: findCourseResult
    })
  })
}

module.exports = teacherController
