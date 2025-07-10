const { dataSource } = require('../db/data-source')
const { sendResponse, appError } = require('../utils/responseFormat')
const wrapAsync = require('../utils/wrapAsync')

const sectionController = {
  /*
   * 取得某課程的所有章節
   * @route GET /api/v1/section/course/:courseId
   */
  getSectionsByCourseId: wrapAsync(async (req, res, next) => {
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
  }),

  /*
   * 新增章節
   * @route POST /api/v1/section
   */
  createSection: wrapAsync(async (req, res, next) => {
    const { course_id, order_index, main_section_title } = req.body
    if (!course_id || !main_section_title) {
      return next(appError(400, '缺少必要欄位'))
    }

    const sectionRepo = dataSource.getRepository('course_section')
    const section = sectionRepo.create({ course_id, order_index, main_section_title })
    await sectionRepo.save(section)

    return sendResponse(res, 201, true, '章節建立成功', { section })
  }),

  /*
   * 更新章節（正規 PATCH）
   * @route PATCH /api/v1/section/:id
   */
  updateSection: wrapAsync(async (req, res, next) => {
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
  }),

  /*
   * 刪除章節
   * @route DELETE /api/v1/section/:id
   */
  deleteSection: wrapAsync(async (req, res, next) => {
    const sectionRepo = dataSource.getRepository('course_section')
    const section = await sectionRepo.findOne({ where: { id: req.params.id } })

    if (!section) return next(appError(404, '找不到章節'))

    await sectionRepo.remove(section)
    return sendResponse(res, 200, true, '章節刪除成功')
  }),
}

module.exports = sectionController
