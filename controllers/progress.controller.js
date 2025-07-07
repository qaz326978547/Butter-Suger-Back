const storage = require('../services/storage')
const { appError, sendResponse } = require('../utils/responseFormat')
const wrapAsync = require('../utils/wrapAsync')
const { dataSource } = require('../db/data-source')
const logSystemAction = require('../services/system/logSystemAction')


const progressController = {
    /*
   * 新增章節進度
   * @route POST /api/v1/course/subsections/:subsectionId/progress
   */
    postProgress: wrapAsync(async (req, res, next) => {
        const user_id = req.user.id
        const { subsectionId } = req.params
        const { status } = req.body
        let logEntry = req.logEntry
        logEntry = {
            ...logEntry,
            action: "新增章節進度",
            sys_module: "前台頁面-我的課程頁面模組"
        }

        if(!subsectionId || status!=='in_progress'){
            await logSystemAction({
                ...logEntry,
                status:"400"
            })
            next(appError(400, '小節 id 或課程狀態錯誤'))
        }

        dataSource.transaction(async (manager) => {
            const studentCourseRepo =  manager.getRepository('student_course')
            const progressRepo = manager.getRepository('learning_progress')
            const subsectionRepo = manager.getRepository('course_subsection')
    
            const findCourse = await subsectionRepo.createQueryBuilder('subsection')
            .innerJoin('subsection.section', 'section')
            .innerJoin('section.course', 'course')
            .where('subsection.id = :subsectionId', { subsectionId })
            .select([
                'subsection.id AS subsection_id',
                'section.id AS section_id',
                'course.id AS course_id'
            ])
            .getRawOne()
    
            if(!findCourse){
                await logSystemAction({
                    ...logEntry,
                    status:"400"
                })
                return next(appError(400, '課程、章節或小節不存在'))
            }
    
            const updateResult = await studentCourseRepo.update(
                {   
                    user_id: user_id,
                    course_id: findCourse.course_id  
                },
                {
                    last_subsection_id: subsectionId,
                    last_accessed_at: new Date()
                }
            )
    
            if(!updateResult.affected){
                await logSystemAction({
                    ...logEntry,
                    status:"400"
                })
                return next(appError(400, '學生課程表更新失敗'))
            }
    
            const newProgress = progressRepo.create({
                user_id: user_id,
                subsection_id: subsectionId,
                status: status,
                watched_time: 0
            })
    
            const result = await progressRepo.save(newProgress)
    
            if(!result){
                await logSystemAction({
                    ...logEntry,
                    status:"400"
                })
                next(appError(400, '學習進度新增失敗'))
            }
    
            await logSystemAction({
                ...logEntry,
                status:"200"
            })
            return sendResponse(res, 200, true, '成功新增學習進度', result) 
        })
    }),

    /*
   * 標記章節進度
   * @route PATCH /api/v1/course/subsections/:subsectionId/progress
   */
    patchProgress: wrapAsync(async (req, res, next) => {
        const user_id = req.user.id
        const { subsectionId } = req.params
        const { status, watched_time } = req.body
        let logEntry = req.logEntry
        logEntry = {
            ...logEntry,
            action: "標記章節進度",
            sys_module: "前台頁面-我的課程頁面模組"
        }

        if(!subsectionId || !status || status!=='completed' || !watched_time){
            await logSystemAction({
                ...logEntry,
                status:"400"
            })
            next(appError(400, '小節 id 或課程狀態錯誤'))
        }

        dataSource.transaction(async (manager) => {
            const subsectionRepo = manager.getRepository('course_subsection')
            const progressRepo = manager.getRepository('learning_progress')
            const studentCourseRepo = manager.getRepository('student_course')

            let findSubsection = await progressRepo.findOne({
                where: { user_id: user_id, subsection_id: subsectionId }
            })

            if(findSubsection.status === 'completed'){
                await logSystemAction({
                    ...logEntry,
                    status:"400"
                })
                return next(appError(400, '課程已完成，學習進度表更新失敗'))
            }

            const findCourse = await subsectionRepo.createQueryBuilder('subsection')
            .innerJoin('subsection.section', 'section')
            .innerJoin('section.course', 'course')
            .where('subsection.id = :subsectionId', { subsectionId })
            .select([
                'subsection.id AS subsection_id',
                'subsection.video_duration AS sub_duration',
                'section.id AS section_id',
                'course.id AS course_id'
            ])
            .getRawOne()

            if(watched_time != findCourse.sub_duration){
                await logSystemAction({
                    ...logEntry,
                    status:"400"
                })
                next(appError(400, 'watched_time 錯誤'))
            }
    
            if(!findCourse){
                await logSystemAction({
                    ...logEntry,
                    status:"400"
                })
                return next(appError(400, '課程、章節或小節不存在'))
            }

            //更新學習進度表
            const progressResult = await progressRepo.update(
                {   user_id: user_id, 
                    subsection_id: subsectionId    
                },
                {
                    status: status, 
                    watched_time: watched_time,
                    completed_at: new Date()
                }
            )

            if(!progressResult.affected){
                await logSystemAction({
                    ...logEntry,
                    status:"400"
                })
                return next(appError(400, '學習進度表更新失敗'))
            }

            findSubsection = await subsectionRepo.createQueryBuilder('subsection')
            .innerJoin('subsection.section', 'section')
            .leftJoin(
                    'learning_progress',
                    'progress',    // learning_progress AS progress 意思
                    'progress.subsection_id = subsection.id AND progress.user_id = :user_id', { user_id }
            )
            .where('section.course_id = :course_id', { course_id: findCourse.course_id })
            .select('COUNT(subsection.id)', 'total_sub')
            .addSelect("COUNT(CASE WHEN progress.status = 'completed' THEN 1 END)", 'completed_sub')
            .getRawOne()
            
            //我的課程表
            const updateResult = await studentCourseRepo.update(
                {   
                    user_id: user_id,
                    course_id: findCourse.course_id  
                },
                {
                    completion_percentage: (findSubsection.completed_sub/findSubsection.total_sub)
                }
            )
    
            if(!updateResult.affected){
                await logSystemAction({
                    ...logEntry,
                    status:"400"
                })
                return next(appError(400, '學生課程表更新失敗'))
            }
    
            await logSystemAction({
                ...logEntry,
                status:"200"
            })
            return sendResponse(res, 200, true, '成功更新學習進度', findSubsection)
        })
    }),

}

module.exports = progressController