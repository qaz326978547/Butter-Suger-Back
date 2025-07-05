// routes/course.js
const express = require('express')
const multer = require('multer')
const courseController = require('../controllers/course.controller')
const isAuth = require('../middleware/isAuth.middleware')
const isTeacher = require('../middleware/isTeacher.middleware')
const isAdmin = require('../middleware/isAdmin.middleware')
const handleMiddleware = require('../utils/handleMiddleware')
const {
  saveCourseSchema,
  updateCoursePrice,
  updateCourseStatus,
} = require('../schema/course.schema')
const router = express.Router()
const validateSchema = require('../middleware/validateSchema.middleware')

router.get('/list', courseController.getCourseList)
router.get('/category', courseController.getCourseCategoryList)
router.get('/category/:categoryId', courseController.getCourseCategory)
router.get('/:courseId/handouts', ...handleMiddleware([isAuth], courseController.getCourseHandOuts))

//更新課程價格
router.patch(
  '/:courseId/price',
  ...handleMiddleware(
    [isAuth, validateSchema(updateCoursePrice)],
    courseController.updateCoursePrice
  )
)
// 取得我的課程列表
router.get('/my-courses', ...handleMiddleware([isAuth], courseController.getMyCourse))

// 取得已購買的課程列表
router.get('/purchased', ...handleMiddleware([isAuth], courseController.getPurchased))

//取得所有類別
router.get('/course-category', courseController.getCourseCategory)

//取得所有評價
router.get('/ratings', courseController.getRatings)

// 取得首頁熱門課程資料
router.get('/popular', courseController.getPopularCourses)

// 收藏課程
router.post('/favorites', ...handleMiddleware([isAuth], courseController.postFavoriteCourse))

// 取得收藏課程
router.get('/favorites/list', ...handleMiddleware([isAuth], courseController.getFavoriteCourse))

// 取消收藏課程
router.delete(
  '/favorites/:favoriteId',
  ...handleMiddleware([isAuth], courseController.deleteFavoriteCourse)
)

// 取得單一課程資料，要放後面，其他 /xxx 要放前面
router.get('/:courseId', courseController.getCourse)

// 新增標題
router.post('/create/title', ...handleMiddleware([isAuth, isTeacher], courseController.createCourseTitle))

// 儲存課程資訊
router.post(
  '/:courseId/save',
  ...handleMiddleware([isAuth, isTeacher, validateSchema(saveCourseSchema)], courseController.saveCourse)
)

//新增課程類別
router.post(
  '/:courseId/category',
  ...handleMiddleware([isAuth, isTeacher], courseController.createCourseCategory)
)

// 儲存課程資訊, 重覆
/* router.post(
  '/:courseId/save',
  ...handleMiddleware([isAuth, validateSchema(saveCourseSchema)], courseController.saveCourse)
)
router.post('/create/title', ...handleMiddleware([isAuth], courseController.createCourseTitle)) */

//這一行放最後
router.get('/:courseId', courseController.getCourse)


//更新課程狀態, 之後管理者有時間做時改成管理者
router.patch(
  '/:courseId/status',
  ...handleMiddleware(
    [isAuth, isAdmin, validateSchema(updateCourseStatus)],
    courseController.updateCourseStatus
  )
)

//新增評價
router.post('/:courseId/ratings', ...handleMiddleware([isAuth], courseController.postRatings))

//更新評價
router.patch('/:courseId/ratings', ...handleMiddleware([isAuth], courseController.patchRatings))

//取得課程問題列表
router.get('/:courseId/questions', ...handleMiddleware([isAuth], courseController.getQuestions))

//新增問題
router.post('/:courseId/questions', ...handleMiddleware([isAuth], courseController.postQuestions))

//新增回答
router.post('/:courseId/answers', ...handleMiddleware([isAuth], courseController.postAnswers))

//新增課程章節
/* router.post(
  '/:courseId/section',
  ...handleMiddleware([isAuth, isTeacher], courseController.postCourseSection)
) */

//取得課程章節
/* router.get(
  '/:courseId/section',
  ...handleMiddleware([isAuth], courseController.getCourseSection)
) */

//更新課程章節
/* router.patch(
  '/section/:sectionId',
  ...handleMiddleware([isAuth, isTeacher], courseController.patchCourseSection)
) */

//刪除課程章節
/* router.delete(
  '/section/:sectionId',
  ...handleMiddleware([isAuth, isTeacher], courseController.deleteCourseSection)
) */

//更新課程章節、小節 [isAuth, isTeacher]
/* router.patch(
  '/:courseId/subsection',
  ...handleMiddleware([isAuth], courseController.patchSubsection)
) */

module.exports = router
