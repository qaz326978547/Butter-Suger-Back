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

// ‣ 上傳：push 到 S3 + 寫入資料庫
exports.uploadController = async (req, res) => {
  const { courseId, sectionId } = req.body;
  const filePath    = req.file?.path;
  if (!req.file) {
    return res.status(400).json({ success: false, message: '找不到上傳的檔案' });
  }
  const ext         = path.extname(req.file.originalname);
  const key         = `videos/${uuidv4()}${ext}`;
  const params      = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key:    key,
    Body:   fs.createReadStream(filePath),
    ContentType: req.file.mimetype
  };

  try {
    console.log('ENV 檢查:', {
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
      AWS_REGION: process.env.AWS_REGION,
      Bucket: process.env.AWS_BUCKET_NAME
    });
    console.log('req.file:', req.file);

    const { Location } = await s3.upload(params).promise();
    // 寫入資料庫
    const video = await Video.create({
      courseId, sectionId, key,
      url: Location,
      originalName: req.file.originalname
    });
    res.json({ success: true, video });
  } catch (err) {
    // console.error(err);
    // res.status(500).json({ success: false, message: '上傳失敗' });
    console.error('=== Upload Error ===');
    console.error(err);
    // 把真實錯誤訊息也回傳（測試用，生產請移除）
    return res.status(500).json({ success: false, message: err.message || '上傳失敗' });
  } finally {
    fs.unlinkSync(filePath);
  }
};

// ‣ 列表：所有影片
exports.listVideosController = async (req, res) => {
  const videos = await Video.findAll();
  res.json(videos);
};

// ‣ 單筆：透過 id
exports.getVideoByIdController = async (req, res) => {
  const video = await Video.findByPk(req.params.id);
  if (!video) return res.status(404).json({ error: '找不到影片' });
  res.json(video);
};

// ‣ 單章節影片
exports.getVideoByCourseSectionController = async (req, res) => {
  const { courseId, sectionId } = req.params;
  const video = await Video.findOne({ where: { courseId, sectionId } });
  if (!video) return res.status(404).json({ error: '找不到影片' });
  res.json(video);
};

// ‣ 更新：可替換檔案或只更新 metadata
exports.updateVideoController = async (req, res) => {
  const { id } = req.params;
  const video = await Video.findByPk(id);
  if (!video) return res.status(404).json({ error: '找不到影片' });

  // 如果有新檔案就刪舊檔、上傳新檔
  if (req.file) {
    // 刪 S3 舊檔
    await s3.deleteObject({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: video.key
    }).promise();
    // 上傳新檔
    const ext  = path.extname(req.file.originalname);
    const key  = `videos/${uuidv4()}${ext}`;
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key:    key,
      Body:   fs.createReadStream(req.file.path),
      ACL:    'public-read',
      ContentType: req.file.mimetype
    };
    const { Location } = await s3.upload(params).promise();
    // 更新 model
    video.key = key;
    video.url = Location;
    video.originalName = req.file.originalname;
    fs.unlinkSync(req.file.path);
  }
  await video.save();
  res.json({ success: true, video });
};

// ‣ 刪除：S3 + DB
exports.deleteVideoController = async (req, res) => {
  const { id } = req.params;
  const video = await Video.findByPk(id);
  if (!video) return res.status(404).json({ error: '找不到影片' });

  // 刪 S3
  await s3.deleteObject({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key:    video.key
  }).promise();

  // 刪 DB
  await video.destroy();
  res.json({ success: true });
};
