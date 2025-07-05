const { dataSource } = require('../db/data-source')
const { sendResponse, appError } = require('../utils/responseFormat')
const wrapAsync = require('../utils/wrapAsync')
const {
  deleteSubsectionVideo
} = require('../services/updateCourseMedia/updateCourseMedia.service')
const sectionController = {

    /*
   * 新增課程章節
   * @route POST - /api/v1/course/:courseId/section
   */
    postSection: wrapAsync(async (req, res, next) => {
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
  
      const newOrderIndex = (lastSection.max || 0) + 1
  
      const newCourseSection = courseSectionRepo.create({
        course_id: course_id,
        order_index: newOrderIndex,
        main_section_title: main_section_title,
      })
  
      const result = await courseSectionRepo.save(newCourseSection)
  
      return sendResponse(res, 200, true, '新增章節成功', result)
    }),
  
    /*
     * 取得課程章節
     * @route GET - /api/v1/course/:courseId/section
     */
    getSection: wrapAsync(async (req, res, next) => {
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
    }),
  
    /*
    * 修改課程章節
    * @route PATCH - /api/v1/course/section/:courseSectionId
    */
    patchSection: wrapAsync(async (req, res, next) => {
      const section_id = req.params.sectionId
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
    }),
  
    /*
    * 刪除課程章節
    * @route DELETE - /api/v1/course/section/:courseSectionId
    */
    deleteSection: wrapAsync(async (req, res, next) => {
      const section_id = req.params.sectionId
  
      const courseSectionRepo = dataSource.getRepository('course_section')
      const subsectionRepo = dataSource.getRepository('course_subsection')


      const findCourseSection = await courseSectionRepo.findOne({ where: { id: section_id } })
      if (!findCourseSection) {
        return next(appError(404, '章節不存在'))
      }

      const findSubsection = await subsectionRepo.find({ where: { section_id: section_id }})
      const subsectionIds = findSubsection.map(item => item.id)

      for(const subsectionId of subsectionIds){
        try {
          await deleteSubsectionVideo({ subsectionId: subsectionId }) 

        } catch (err) {
          console.warn('刪除小節影片失敗:', err.message || err)
          return next(appError(400, '小節影片刪除失敗'))
        }        
      }

      const deleteCourseSection = await courseSectionRepo.delete({ id: section_id })
  
      if (deleteCourseSection.affected === 1) {
        return sendResponse(res, 200, true, '課程章節刪除成功')
      } else {
        return next(appError(404, '課程章節刪除失敗'))
      }
    }),



  /*
   * 取得某課程的所有章節
   * @route GET /api/v1/section/course/:courseId
   */
/*   getSectionsByCourseId: wrapAsync(async (req, res, next) => {
    const { courseId } = req.params
    if (!courseId) return next(appError(400, '缺少課程 ID'))

    const sectionRepo = dataSource.getRepository('course_section')
    // 確認 courseId 是否存在
    const courseExists = await sectionRepo.findOne({ where: { course_id: courseId } })
    if (!courseExists) return next(appError(404, '找不到對應課程'))

    const sections = await sectionRepo.find({
      where: { course_id: courseId },
      order: { order_index: 'ASC' },
      relations: ['subsections'],
    })

    return sendResponse(res, 200, true, '取得課程章節成功', { sections })
  }), */

  /*
   * 新增章節
   * @route POST /api/v1/section
   */
/*   createSection: wrapAsync(async (req, res, next) => {
    const { course_id, order_index, main_section_title } = req.body
    if (!course_id || !main_section_title) {
      return next(appError(400, '缺少必要欄位'))
    }

    const sectionRepo = dataSource.getRepository('course_section')
    const section = sectionRepo.create({ course_id, order_index, main_section_title })
    await sectionRepo.save(section)

    return sendResponse(res, 201, true, '章節建立成功', { section })
  }), */

  /*
   * 更新章節（正規 PATCH）
   * @route PATCH /api/v1/section/:id
   */
/*   updateSection: wrapAsync(async (req, res, next) => {
    const { id } = req.params
    console.log(`Updating section with ID: ${id}`)

    const { order_index, main_section_title } = req.body
    if (!id) return next(appError(400, '請提供章節 ID'))

    const sectionRepo = dataSource.getRepository('course_section')
    const section = await sectionRepo.findOne({ where: { id } })
    if (!section) return next(appError(404, '找不到章節'))

    sectionRepo.merge(section, { order_index, main_section_title })
    const result = await sectionRepo.save(section)

    return sendResponse(res, 200, true, '章節更新成功', { section: result })
  }), */

  /*
   * 刪除章節
   * @route DELETE /api/v1/section/:id
   */
/*   deleteSection: wrapAsync(async (req, res, next) => {
    const sectionRepo = dataSource.getRepository('course_section')
    const section = await sectionRepo.findOne({ where: { id: req.params.id } })

    if (!section) return next(appError(404, '找不到章節'))

    await sectionRepo.remove(section)
    return sendResponse(res, 200, true, '章節刪除成功')
  }), */
}

module.exports = sectionController
