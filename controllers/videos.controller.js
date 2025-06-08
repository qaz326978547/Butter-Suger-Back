const fs       = require('fs');
const path     = require('path');
const AWS      = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const { Video } = require('../models');

// 初始化 S3
const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// ―― 上傳：push 到 S3 + 寫入資料庫 ――
exports.uploadController = async (req, res) => {
  const { courseId, sectionId } = req.body;
  if (!req.file) {
    return res.status(400).json({ success: false, message: '找不到上傳的檔案' });
  }

  const filePath = req.file.path;
  const ext      = path.extname(req.file.originalname);
  const key      = `videos/${uuidv4()}${ext}`;
  const params   = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key:    key,
    Body:   fs.createReadStream(filePath),
    ContentType: req.file.mimetype
  };

  try {
    const { Location } = await s3.upload(params).promise();

    // ② 不需指定 id，Sequelize 會用 UUIDV4 自動帶入
    const video = await Video.create({
      courseId,
      sectionId,
      key,
      url: Location,
      originalName: req.file.originalname
    });

    res.json({ success: true, video });
  } catch (err) {
    console.error('Upload Error:', err);
    return res.status(500).json({ success: false, message: err.message || '上傳失敗' });
  } finally {
    // 刪掉本地暫存檔
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
};

// ―― 列出所有影片 ―― 
exports.listVideosController = async (req, res) => {
  try {
    const videos = await Video.findAll({
      order: [['createdAt', 'DESC']]
    });
    return res.json(videos);
  } catch (err) {
    console.error('List Videos Error:', err);
    return res.status(500).json({ error: '伺服器錯誤，無法取得影片列表' });
  }
};

// ―― 依 ID 取單筆影片 ――
exports.getVideoByIdController = async (req, res) => {
  const video = await Video.findByPk(req.params.id);
  if (!video) return res.status(404).json({ error: '找不到影片' });
  res.json(video);
};

// ―― 取得同一章節（course/section）下所有影片 ――
exports.getVideoByCourseSectionController = async (req, res) => {
  const { courseId, sectionId } = req.params;
  try {
    // findAll 會回傳陣列，即使只有一筆也會包成 [video]
    const videos = await Video.findAll({
      where: { courseId, sectionId },
      order: [['createdAt', 'DESC']]
    });
    return res.json(videos);
  } catch (err) {
    console.error('Get Videos By Course/Section Error:', err);
    return res.status(500).json({ error: '伺服器錯誤，無法取得該章節影片' });
  }
};

// ―― 替換／更新：如果上傳新檔案，就先刪 S3 舊檔，再上傳新檔，最後更新 model ――
exports.updateVideoController = async (req, res) => {
  const { id } = req.params;
  const video = await Video.findByPk(id);
  if (!video) return res.status(404).json({ error: '找不到影片' });

  if (req.file) {
    // 1. 刪除 S3 上舊檔
    await s3.deleteObject({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: video.key
    }).promise();

    // 2. 上傳新檔案
    const ext = path.extname(req.file.originalname);
    const key = `videos/${uuidv4()}${ext}`;
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key:    key,
      Body:   fs.createReadStream(req.file.path),
      ContentType: req.file.mimetype
    };
    const { Location } = await s3.upload(params).promise();

    // 3. 更新資料庫欄位
    video.key = key;
    video.url = Location;
    video.originalName = req.file.originalname;

    // 刪掉本地暫存檔
    fs.unlinkSync(req.file.path);
  }

  await video.save();
  res.json({ success: true, video });
};

// ―― 刪除：先刪 S3，再刪 DB ――
exports.deleteVideoController = async (req, res) => {
  const { id } = req.params;
  const video = await Video.findByPk(id);
  if (!video) return res.status(404).json({ error: '找不到影片' });

  // 刪掉 S3 上檔案
  await s3.deleteObject({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key:    video.key
  }).promise();

  // 刪掉資料庫
  await video.destroy();
  res.json({ success: true });
};
