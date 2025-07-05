// controllers/subsection.controller.js
const { dataSource } = require('../db/data-source')
const { sendResponse, appError } = require('../utils/responseFormat')
const wrapAsync = require('../utils/wrapAsync')
const videoUploadQueue = require('../queues/videoUpload.queue')
const storage = require('../services/storage')

const {
  uploadSubsectionVideo,
  deleteSubsectionVideo
} = require('../services/updateCourseMedia/updateCourseMedia.service')
const { DataSource } = require('typeorm')

const subsectionController = {

  /*
  * 取得特定章節小節
  * @route get - /api/v1/course/section/:sectionId/subsection
  */
  getSubsection: wrapAsync(async (req, res, next) => {
    const { sectionId } = req.params

    if(!sectionId){
      return next(appError(400, 'id 錯誤'))
    }

    const subsectionRepo = dataSource.getRepository('course_subsection')
    const findSubsection = await subsectionRepo.find({
      where: {section_id: sectionId}, 
      order: { order_index: 'ASC' }
    })

    if(!findSubsection){
      return next(appError(404, '小節不存在'))
    }

    return sendResponse(res, 200, true, '取得特定章節小節成功', findSubsection)
  }),

  /*
  * 新增小節
  * @route get - /api/v1/course/section/:sectionId/subsection
  */
  postSubsection: wrapAsync(async (req, res, next) => {
    const { sectionId } = req.params
    const { subsection_title, is_preview_available } = req.body

    if(!sectionId || !subsection_title || !is_preview_available){
      return next(appError(400, 'id 錯誤、小節標題或預覽設定錯誤'))
    }

    const sectionRepo = dataSource.getRepository('course_section')
    const subsectionRepo = dataSource.getRepository('course_subsection')

    const findSection = await sectionRepo.findOne({where: {id: sectionId}})
    if(!findSection){
      return next(appError(404, '找不到此章節 id, 請先建立章節'))
    }

    const lastSubsection = await subsectionRepo
    .createQueryBuilder('subsection')
    .select('MAX(subsection.order_index)', 'max')
    .where('subsection.section_id = :section_id', { section_id: sectionId })
    .getRawOne()

  const newOrderIndex = (lastSubsection.max || 0) + 1

    const newSubsection = subsectionRepo.create({
      section_id: sectionId,
      order_index: newOrderIndex,
      subsection_title: subsection_title,
      is_preview_available: is_preview_available
    })

    const result = await subsectionRepo.save(newSubsection)
    if(!result){
      return next(appError(400, '新增小節失敗'))
    }

    return sendResponse(res, 200, true, '新增小節成功', result)
  }),

  /*
  * 批次編輯課程小節
  * @route patch - /api/v1/course/:courseId/subsection
  */
  patchSubsection: wrapAsync(async (req, res, next) => {
    const course_id = req.params.courseId
    const sectionList = req.body
    let subsection, findSection, findSubsection, updateSectionResult, updateSubsectionResult 

    await dataSource.transaction(async (manager) => {
      const sectionRepo = manager.getRepository('course_section')
      const subsectionRepo = manager.getRepository('course_subsection')

      for(const section of sectionList){
        subsection = section.subsections

        if(!section.id){
          return next(appError(404, `章節 id ${section.id} 錯誤`))
        }
  
        findSection = await sectionRepo.find({ where: { id: section.id } })
        findSubsection = await subsectionRepo.find({ where: { section_id: section.id } })
  
        //取得目前最大排序數字
        if(!findSection){
          return next(appError(404, `找不到章節 id ${section.id}`))
        }

        updateSectionResult = await sectionRepo.update({id: section.id}, {
          course_id: course_id,
          order_index: section.order_index,
          main_section_title: section.main_section_title
        })

        if(!updateSectionResult.affected){
          return next(appError(400, `章節 id ${section.id} 更新失敗`))
        }

        //修改小節
        for(const sub of subsection){
          if(!sub.id){
            return next(appError(404, `小節 id ${sub.id} 錯誤`))
          }
          findSubsection = subsectionRepo.findOne({where: {id: sub.id}})

          if(!findSubsection){
            return next(appError(404, `找不到小節 id ${sub.id}`))
          }

          updateSubsectionResult = await subsectionRepo.update(
            {id: sub.id},
            {
              section_id: section.id,
              subsection_title: sub.subsection_title,
              order_index: sub.order_index,
              is_preview_available: sub.is_preview_available
            }
          )
          
          if(!updateSubsectionResult.affected){
            return next(appError(400, `小節 id ${sub.id} 更新失敗`))
          }

/*           const newSubsection = subsectionRepo.create({
            section_id: section.id,
            subsection_title: sub.subsection_title,
            order_index: sub.order_index,
            is_preview_available: sub.is_preview_available
          })
          await subsectionRepo.save(newSubsection) */
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
  }),

  /*
  * 刪除小節（含影片資源）
  * @route delete - /api/v1/course/subsection/:subsectionId
  */
  deleteSubsection: wrapAsync(async (req, res, next) => {
    const { subsectionId } = req.params

    const subsectionRepo = dataSource.getRepository('course_subsection')
    const subsection = await subsectionRepo.findOne({ where: { id: subsectionId } })

    if (!subsection) return next(appError(404, '找不到小節'))

    if (subsection.video_file_url) {
      try {
        await deleteSubsectionVideo({ subsectionId: subsectionId }) 
/*         await storage.delete(subsection.video_file_url) */
      } catch (err) {
        console.warn('刪除小節影片失敗:', err.message || err)
        return next(appError(400, '小節影片刪除失敗'))
      }
    }

    const result = await subsectionRepo.delete({id: subsectionId})
    if(!result.affected){
      return next(appError(400, '小節刪除失敗'))
    }

    return sendResponse(res, 200, true, '小節與影片已成功刪除')
  }),

  /*
  * 刪除小節影片
  * @route delete - /api/v1/subsection/upload/:subsectionId/upload-video
  */
  deleteSubsectionVideo: wrapAsync(async (req, res, next) => {
    const { subsectionId } = req.params

    await deleteSubsectionVideo({ subsectionId: subsectionId })    

    return sendResponse(res, 200, true, '影片已成功刪除')
  }),

  /*
  * 上傳小節影片
  * @route post - /api/v1/subsection/upload/:subsectionId/upload-video
  */
  uploadSubsectionVideo: wrapAsync(async (req, res, next) => {
    const { subsectionId } = req.params
    const file = req.file
    
    if (!file || !subsectionId) {
      return next(appError(400, '缺少影片檔案或小節 ID'))
    }
  
    const subVideoUploadResult = await uploadSubsectionVideo({
      subsectionId: subsectionId, 
      file:file, 
      folderName:'course-subsection-videos' 
    })

/*     //  推送 job 到 queue，只傳基本資訊（避免傳遞 Buffer）
    await videoUploadQueue.add({
      subsectionId,
      videoUrl,
      videoName: file.originalname,
      videoSize: file.size,
      videoType: file.mimetype,
    }) */
  
    return sendResponse(res, 202, true, '影片已提交處理中', subVideoUploadResult)
  }),
}

  // 更新小節
/*   updateSubsection: wrapAsync(async (req, res, next) => {
    const repo = dataSource.getRepository('course_subsection')
    const subsection = await repo.findOne({ where: { id: req.params.id } })

    if (!subsection) return next(appError(404, '找不到小節'))

    repo.merge(subsection, req.body)
    const result = await repo.save(subsection)

    return sendResponse(res, 200, true, '小節更新成功', { subsection: result })
  }), */
  
  // 取得某章節的小節列表
/*   getSubsectionsBySectionId: wrapAsync(async (req, res, next) => {
    const { sectionId } = req.params
    const repo = dataSource.getRepository('course_subsection')
    const list = await repo.find({
      where: { section_id: sectionId },
      order: { order_index: 'ASC' },
    })

    return sendResponse(res, 200, true, '取得小節成功', { subsections: list })
  }), */

  // 新增小節
/*   createSubsection: wrapAsync(async (req, res, next) => {
    const { section_id, order_index, subsection_title, is_preview_available } = req.body

    if (!section_id || !subsection_title) {
      return next(appError(400, '缺少必要欄位'))
    }

    const repo = dataSource.getRepository('course_subsection')
    const subsection = repo.create({
      section_id,
      order_index,
      subsection_title,
      video_file_url: null,
      video_duration: null,
      uploaded_at: null,
      status: 'processing',
      is_preview_available,
    })

    await repo.save(subsection)
    return sendResponse(res, 201, true, '小節建立成功', { subsection })
  }), */

module.exports = subsectionController
