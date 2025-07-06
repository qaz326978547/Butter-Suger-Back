const { dataSource } = require('../db/data-source')
const { appError, sendResponse } = require('../utils/responseFormat')
const wrapAsync = require('../utils/wrapAsync')
const cleanUndefinedFields = require('../utils/cleanUndefinedFields')
const logSystemAction = require('../services/system/logSystemAction')


const teacherApplicationsController = {
  /*
  * 取得教師申請狀態
  * @route GET - /api/v1/teacher-applications
  */
  getApplicationsData: wrapAsync(async (req, res, next) => {
    const userId = req.user.id

    const applicationRepo = dataSource.getRepository('teacher_application')
    let logEntry = req.logEntry
    logEntry = {
      ...logEntry,
      action: "取得教師審核資料",
      sys_module: "後台頁面-後台頁面-教師申請模組"
    }

    const findApplication = await applicationRepo.findOne({
      select:['id', 'user_id', 'course_name', 'description', 'status', 'created_at'],
      where:{ user_id: userId }
    })

    if(!findApplication){
      await logSystemAction({
        ...logEntry,
        status:"404"
      })
      next(appError(404, "沒有申請紀錄"))
    }

    await logSystemAction({
      ...logEntry,
      status:"200"
    })
    
    // 回傳使用者資料
    sendResponse(res, 200, true, '取得所有教師申請資料成功', findApplication)
  }),

  /*
  * 申請成為教師
  * @route POST - /api/v1/teacher-applications
  */
  postApplicationsData: wrapAsync(async (req, res, next) => {
    const userId = req.user.id
    const { course_name, description } = req.body
    let logEntry = req.logEntry
    logEntry = {
      ...logEntry,
      action: "申請成為教師",
      sys_module: "後台頁面-教師申請模組"
    }

    if(!course_name || !description){
      await logSystemAction({
        ...logEntry,
        status:"400"
      })
      return next(appError(400, '欄位資料不為空'))
    }

    const applicationRepo = dataSource.getRepository('teacher_application')
    const findApplication = await applicationRepo.findOne({where: {user_id: userId}})

    if(findApplication){
      await logSystemAction({
        ...logEntry,
        status:"400"
      })
      return next(appError(400, '您已提出申請，資料正在審核中'))
    }

    const newApplication = applicationRepo.create({
      user_id: userId,
      course_name: course_name,
      description: description
    })

    const result = await applicationRepo.save(newApplication)

    await logSystemAction({
      ...logEntry,
      status:"200"
    })
    sendResponse(res, 200, true, '已成功提交申請', result)
  }),

    /*
  * 修改申請教師資料
  * @route PATCH - /api/v1/teacher-applications/:applicationId
  */
    patchApplicationsData: wrapAsync(async (req, res, next) => {
      const user_id = req.user.id
      const { applicationId } = req.params
      const { course_name, description } = req.body
      let logEntry = req.logEntry
      logEntry = {
        ...logEntry,
        action: "修改教師審核資料",
        sys_module: "後台頁面-教師申請模組"
      }
      
      if(!applicationId){
        await logSystemAction({
          ...logEntry,
          status:"400"
        })
        return next(appError(400, 'id 錯誤'))
      }
  
      if(!course_name || !description){
        await logSystemAction({
          ...logEntry,
          status:"400"
        })
        return next(appError(400, '欄位資料不為空'))
      }
  
      const applicationRepo = dataSource.getRepository('teacher_application')
      let findApplication = await applicationRepo.findOne({where: {id: applicationId, user_id: user_id}})
  
      if(!findApplication){
        await logSystemAction({
          ...logEntry,
          status:"400"
        })
        return next(appError(400, '修改失敗，您尚未提出申請'))
      }
  
      const updateApplication = await applicationRepo.update(
        {
          id: applicationId
        },
        {
          user_id: user_id,
          course_name: course_name,
          description: description
        }
      )
  
      if(!updateApplication.affected){
        await logSystemAction({
          ...logEntry,
          status:"400"
        })
        return next(appError(400, '修改失敗'))
      }
  
      findApplication = await applicationRepo.findOne({where: {id: applicationId}})

      await logSystemAction({
        ...logEntry,
        status:"200"
      })
      sendResponse(res, 200, true, '已成功修改申請資料', findApplication)
    }),
}

module.exports = teacherApplicationsController