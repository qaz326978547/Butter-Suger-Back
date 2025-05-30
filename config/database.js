const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_DATABASE,   // 資料庫名稱
  process.env.DB_USERNAME,   // 帳號
  process.env.DB_PASSWORD,   // 密碼
  {
    host:     process.env.DB_HOST,
    port:     Number(process.env.DB_PORT),
    dialect:  'postgres',
    logging:  false,           // 關閉 SQL log
    dialectOptions: process.env.DB_ENABLE_SSL === 'true'
      ? { ssl: { rejectUnauthorized: false } }
      : undefined
  }
);

module.exports = sequelize;