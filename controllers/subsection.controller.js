const { dataSource } = require('../db/data-source')
const { sendResponse, appError } = require('../utils/responseFormat')
const wrapAsync = require('../utils/wrapAsync')

const subsectionController = {
  /*
   * 取得某章節的小節列表
   * @route GET /api/v1/subsection/section/:sectionId
   */
  getSubsectionsBySectionId: wrapAsync(async (req, res, next) => {
    const { sectionId } = req.params
    const repo = dataSource.getRepository('course_subsection')
    const list = await repo.find({
      where: { section_id: sectionId },
      order: { order_index: 'ASC' },
    })

    return sendResponse(res, 200, true, '取得小節成功', { subsections: list })
  }),

  /*
   * 新增小節
   * @route POST /api/v1/subsection
   */
  createSubsection: wrapAsync(async (req, res, next) => {
    const {
      section_id,
      order_index,
      subsection_title,
      video_file_url,
      video_duration,
      uploaded_at,
      status,
      is_preview_available,
    } = req.body

    if (!section_id || !subsection_title) {
      return next(appError(400, '缺少必要欄位'))
    }

    const repo = dataSource.getRepository('course_subsection')
    const subsection = repo.create({
      section_id,
      order_index,
      subsection_title,
      video_file_url,
      video_duration,
      uploaded_at,
      status,
      is_preview_available,
    })

    await repo.save(subsection)
    return sendResponse(res, 201, true, '小節建立成功', { subsection })
  }),

  /*
   * 更新小節
   * @route PATCH /api/v1/subsection/:id
   */
  updateSubsection: wrapAsync(async (req, res, next) => {
    const repo = dataSource.getRepository('course_subsection')
    const subsection = await repo.findOne({ where: { id: req.params.id } })

    if (!subsection) return next(appError(404, '找不到小節'))

    repo.merge(subsection, req.body)
    const result = await repo.save(subsection)

    return sendResponse(res, 200, true, '小節更新成功', { subsection: result })
  }),

  /*
   * 刪除小節
   * @route DELETE /api/v1/subsection/:id
   */
  deleteSubsection: wrapAsync(async (req, res, next) => {
    const repo = dataSource.getRepository('course_subsection')
    const subsection = await repo.findOne({ where: { id: req.params.id } })

    if (!subsection) return next(appError(404, '找不到小節'))

    await repo.remove(subsection)
    return sendResponse(res, 200, true, '小節刪除成功')
  }),
}

module.exports = subsectionController
