// models/index.js
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// 初始化
const Video = require('../entities/video.entity')(sequelize, DataTypes);

// <-- 核心：sync 所有 model 到資料庫 --> 正式上線後可移除，改用 migration 工具管理資料表變更
sequelize.sync()   // 只會建立還不存在的 table
  .then(() => console.log('Database synced'))
  .catch(console.error);

module.exports = { sequelize, Video };