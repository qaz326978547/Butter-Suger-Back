const { DataSource } = require('typeorm')
const config = require('../config/index')

const users = require('../entities/users.entity')
const courses = require('../entities/courses.entity')
const courseCategory = require('../entities/course_categories.entity')
const courseSection = require('../entities/course_section.entity')
const courseSubsection = require('../entities/course_subsection.entity')
const teacher = require('../entities/teacher.entity')
const courseHanout = require('../entities/course_handouts.entitys')
const dataSource = new DataSource({
  type: 'postgres',
  host: config.get('db.host'),
  port: config.get('db.port'),
  username: config.get('db.username'),
  password: config.get('db.password'),
  database: config.get('db.database'),
  synchronize: config.get('db.synchronize'),
  poolSize: 10,
  synchronize: true, // migration 下通常要關閉自動同步
  logging: true,
  entities: [__dirname + '/../entities/**/*.js'],
  // migrations: [__dirname + '/../migration/**/*.js'],
  // cli: {
  //   migrationsDir: './migration', // migration 資料夾位置
  // },
  ssl: config.get('db.ssl'),
})

module.exports = { dataSource }
