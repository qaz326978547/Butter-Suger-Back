const express = require('express');
const multer  = require('multer');
const router  = express.Router();
const upload  = multer({ dest: 'uploads/' });

const {
  uploadController,
  listVideosController,
  getVideoByIdController,
  getVideoByCourseSectionController,
  updateVideoController,
  deleteVideoController
} = require('../controllers/videos.controller');

// Create：上傳影片
router.post('/upload', upload.single('file'), uploadController);

// Read：列出所有影片
router.get('/', listVideosController);

// Read by course & section
router.get('/course/:courseId/section/:sectionId', getVideoByCourseSectionController);

// Read by id
router.get('/:id', getVideoByIdController);

// Update：替換影片檔或更新 metadata
router.put('/:id', upload.single('file'), updateVideoController);

// Delete：刪除 S3 檔案及資料庫紀錄
router.delete('/:id', deleteVideoController);

module.exports = router;
