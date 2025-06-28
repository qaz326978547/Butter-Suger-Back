const { dataSource } = require('../db/data-source')
const { appError, sendResponse } = require('../utils/responseFormat')
const cleanUndefinedFields = require('../utils/cleanUndefinedFields')
const storage = require('../services/storage')
const updateUserAndTeacher = require('../services/teacher/updateUserAndTeacher')


const teacherController = {
  //取得教師資料
  async getTeacherData(req, res, next) {
    try {
      const userId = req.user.id
      const teacherRepo = dataSource.getRepository('teacher')


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
        return next(appError(404, '查無教師資料'))
      }

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
    } catch (error) {
      next(error)
    }
  },

  // 更新教師資料
  async updateTeacherData(req, res, next) {
    console.log("================updateTeacherData==============")
    console.log(req.user.id)
    console.log("================updateTeacherData==============")
    try {
        const userId = req.user.id
        const {name, nickname, phone, birthday, sex, address, bank_name, bank_account, slogan, description, specialization} = req.body

        const teacherRepo = dataSource.getRepository('teacher')
        console.log("================updateTeacherData teacherRepo==============")
        // 確認教師是否存在
        const findTeacher = await teacherRepo.findOne({
            select: ['id'],
            where: { user_id: userId },
            relations: ['user']
        })
        console.log("================updateTeacherData findTeacher==============")
        console.log(findTeacher)
        
        console.log("================updateTeacherData findTeacher==============")
        console.log(findTeacher)
        console.log("================updateTeacherData findTeacher==============")
        console.log(findTeacher?.user?.profile_image_url)
        console.log("================updateTeacherData findTeacher2==============")

      // 清理未定義的欄位
        const updateUserData = cleanUndefinedFields({
            name, 
            nickname, 
            phone, 
            birthday, 
            sex, 
            address,
            profile_image_url: findTeacher?.users?.profile_image_url || '',
            role: 'teacher',
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
        
        return sendResponse(res, 200, true, '更新使用者資料成功')
    } catch (error) {
      next(error)
    }
  },

  //取得精選教師
  async getTeacherFeatured(req, res, next){
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
    "ROW_NUMBER() OVER (PARTITION BY teacher.id ORDER BY course.created_at DESC) AS rn"])
    .leftJoin('course.teacher', 'teacher') //relations:teacher => course.teacher
    .leftJoin('teacher.users', 'user')

    //外層： 再依據教師的評價排序和課程時間(只留 rn = 1)
    const result = await dataSource.createQueryBuilder()
    .select(['t.teacher_id',
              't.user_id',
              't.teacher_name',
              't.teacher_specialization',
              't.teacher_slogan',
              't.course_id',
              't.course_name'
            ])   // 把子查詢 t 中的特定欄位撈出來
    .from('('+ sub.getQuery() +')', 't')
    .setParameters(sub.getParameters())  //把內層 QueryBuilder 用到的所有參數，原封不動地複製到外層 QueryBuilder
    .where('t.rn=1') // 取出第一筆
    .orderBy('t.teacher_rating_score', 'DESC')
    .addOrderBy('t.created_at', 'DESC')
    .limit(10)
    .getRawMany()

    return sendResponse(res, 200, true, '取得資料成功', result)
  },

  //取得單一精選教師資料
  async getSingleFeaturedTeacherData(req, res, next){
    const {teacherId} = req.params

    // 取得課程資料, 不用 relations: ['teacher']，拆開請求比較好分類
    const coursesRepo = dataSource.getRepository('courses')
    const findCourses = await coursesRepo.find({
      select: ['id', 'course_banner_imageUrl', 'course_name'],
      where: { teacher_id:teacherId }
    })

    // 取得教師資料
    const teacherRepo = dataSource.getRepository('teacher')
    const findTeacher = await teacherRepo.findOne({
      select: ['id', 'rating_score', 'slogan', 'description', 'specialization'],
      where: { id:teacherId },
      relations:['user']
    })

    return sendResponse(res, 200, true, '取得資料成功', {
      teacher: {
            teacher_id : findTeacher.id,
            user_id : findTeacher.users.id,
            name: findTeacher.users.name,
            profile_image_url:findTeacher.users.profile_image_url,
            rating_score: findTeacher.rating_score, 	
            slogan: findTeacher.slogan,
            description: findTeacher.description,
            specialization: findTeacher.specialization    
          },
      course: findCourses
    })
  }
}

module.exports = teacherController
