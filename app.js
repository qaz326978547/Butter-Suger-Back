require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const pinoHttp = require('pino-http')
const AWS        = require('aws-sdk')                   // ← 新增
const logger = require('./utils/logger')('App')
const videoRoutes    = require('./routes/videos.route')
const errorHandler = require('./middleware/errorHandler.middleware') // 引入錯誤處理

// 引入 passport 配置
const passport = require('./config/passport')
const session = require('express-session')

const app = express()

// 1. CORS 一定要在 bodyParser + 路由之前
app.use(cors({
  origin: ['http://localhost:5173', ],
  credentials: true
}));


/* app.use(cors()) */
// ─── 1. AWS SDK 全域設定 ───────────────────────────────────
AWS.config.update({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
})
// ─── 2. CORS ────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5500',
  'http://localhost:8080',
  'https://buttersuger-frontend.zeabur.app',
  'https://buttersuger-test.zeabur.app',
]
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true) // 允許請求
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
  })
)
// ─── 3. Body Parser ────────────────────────────────────────
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
// ─── 4. Logging ────────────────────────────────────────────
app.use(pinoHttp({
  logger,
  serializers: {
    req(req) {
      return {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
      }
    },
  },
}))
// ─── 5. 靜態檔 & 上傳暫存目錄 ────────────────────────────────
app.use('/public', express.static(path.join(__dirname, 'public')))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// ─── 6. Session & Passport ─────────────────────────────────
app.use(
  session({
    secret: process.env.SESSION_SECRET, // 使用你的 session secret
    resave: false,
    saveUninitialized: false, // 在沒有改變 session 時不會保存 session
  })
)
app.use(passport.initialize()) // 初始化 passport
app.use(passport.session()) // 使用 session

// ─── 7. 路由註冊 ────────────────────────────────────────────
app.use('/api/v1/users', userRouter)
app.use('/api/v1/teacher', teacherRouter)
app.use('/api/v1/course', courseRoutes)
app.use('/api/v1/courses', coursesRouter)
app.use('/api/v1/cart', cartRouter)
app.use('/api/v1/videos', videoRoutes)
//統一路由
require('./routes')(app)

// 健康檢查路由
app.get('/healthcheck', (req, res) => {
  res.status(200).send('OK')
})

// 讓錯誤處理 middleware 做全域錯誤處理
app.use(errorHandler)
const { dataSource } = require('./db/data-source')
const seedCourseCategories = require('./db/seed/createCourseCategoriesSeed')

dataSource
  .initialize()
  .then(async () => {
    await seedCourseCategories()
    // 這裡可以加上啟動 server 的程式碼
    // 例如:
    // app.listen(process.env.PORT || 8080, () => {
    //   console.log('Server is running...')
    // })
  })
  .catch((err) => {
    console.error('資料庫連線失敗:', err)
  })
module.exports = app
