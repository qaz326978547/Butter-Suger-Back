const { dataSource } = require('../db/data-source')
const { appError, sendResponse } = require('../utils/responseFormat')
const wrapAsync = require('../utils/wrapAsync')
const cleanUndefinedFields = require('../utils/cleanUndefinedFields')
const logSystemAction = require('../services/system/logSystemAction')


const adminController = {
  /*
  * 取得所有教師申請者資料
  * @route GET - /api/v1/admin/teacher-applications
  */
  getApplicationsData: wrapAsync(async (req, res, next) => {
    let pageNum = req.query.pageNum || 1
    let perNum = 12;

    if(pageNum<=0){
      pageNum = 1
    }

    const offset = (pageNum - 1) * perNum;

    const applicationRepo = dataSource.getRepository('teacher_application')
    const findApplications = await applicationRepo.createQueryBuilder('application')
    .select(['application.id AS id',
            'application.user_id AS user_id',
            'user.name AS user_name',
            'application.course_name AS course_name',
            'application.description AS description',
            'application.status AS status',
            'application.created_at AS created_at'
          ])
    .leftJoin('application.user', 'user')
    .orderBy('application.created_at', 'DESC')
    .take(perNum)
    .skip(offset)
    .getRawMany()

    const total = await applicationRepo.createQueryBuilder('application')
    .leftJoin('application.user', 'user')
    .getCount()

    sendResponse(res, 200, true, '取得使用者資料成功', 
      { 
        data: findApplications, 
        total: total,
        perNum, 
        pageNum 
      })
  }),

  /*
  * 取得教師申請者資料
  * @route GET - /api/v1/admin/teacher-applications/:applicationId
  */
  getOneApplicationData: wrapAsync(async (req, res, next) => {
    const { applicationId } = req.params

    const teacherRepo = dataSource.getRepository('teacher')
    const applicationRepo = dataSource.getRepository('teacher_application')

    const findApplication = await applicationRepo.createQueryBuilder('application')
    .select([
            'application.id AS id',
            'application.user_id AS user_id',
            'user.name AS name',
            'application.course_name AS course_name',
            'application.description AS description',
            'application.status AS status',
            'application.created_at AS created_at'
          ])
    .leftJoin('application.user', 'user')
    .where('application.id = :applicationId', { applicationId: applicationId })
    .getRawOne()

    const findTeacher = await teacherRepo.findOne({
      select: ['slogan', 'description', 'specialization'],
      where: {user_id: findApplication.user_id}
    })

    sendResponse(res, 200, true, '取得使用者資料成功', {
      application: findApplication,
      teacher: findTeacher
    })
  }),

  /*
  * 取得教師申請者資料
  * @route GET - /api/v1/admin/getSystemLog
  */
  getSystemLog: wrapAsync(async (req, res, next) => {
    let pageNum = req.query.pageNum || 1
    let perNum = 12;

    if(pageNum<=0){
      pageNum = 1
    }

    const offset = (pageNum - 1) * perNum;
    const keyword  = req.query.keyword || ''

    const systemLogRepo = dataSource.getRepository('system_log')

    let qb = systemLogRepo.createQueryBuilder('log')
    .orderBy('log.created_at', 'DESC')
    .skip(offset)
    .take(perNum)

    if(keyword){
      qb = qb.andWhere(
        `(CAST(log.user_id AS TEXT) ILIKE :kw OR log.role ILIKE :kw OR log.action ILIKE :kw OR log.api ILIKE :kw OR log.sys_module ILIKE :kw OR log.email ILIKE :kw OR log.status ILIKE :kw)`,
        { kw: `%${keyword}%` }
      )
    }

    const [systemLogList, total] = await qb.getManyAndCount()

    sendResponse(res, 200, true, '取得系統日誌成功', {
      data: systemLogList,
      total: total,
      pageNum,
      perNum
    })
  }),

  /*
  * 審核教師申請
  * @route PATCH - /api/v1/admin/teacher-applications/:applicationId/status
  */
  patchApplicationsData: wrapAsync(async (req, res, next) => {
    const { applicationId } = req.params
    const { status } = req.body

    if(!applicationId){
      return next(appError(res, 400, false, 'ID 錯誤'))
    }

    await dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository('users')
      const teacherRepo = manager.getRepository('teacher')
      const applicationRepo = manager.getRepository('teacher_application')
  
      const findApplication = await applicationRepo.findOne({where: {id: applicationId}})
  
      const updateUser = await userRepo.update({id: findApplication.user_id},{role: 'teacher', teacher_status: status})
  
      if(!updateUser.affected){
        return next(appError(res, 400, false, '審核教師失敗'))
      }
  
      const is_verified = status === 'approved'?true:false
      const updateTeacher = await teacherRepo.update({user_id: findApplication.user_id},{is_verified: is_verified})
  
      if(!updateTeacher.affected){
        return next(appError(res, 400, false, '審核教師失敗'))
      }
  
      const updateApplication = await applicationRepo.update({id: applicationId},{status: status})
  
      if(!updateApplication.affected){
        return next(appError(res, 400, false, '審核教師失敗'))
      }
  
      return sendResponse(res, 200, true, '審核教師成功')
    })
  })
}

module.exports = adminController