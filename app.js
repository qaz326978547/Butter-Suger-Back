const express = require('express')
const cors = require('cors')
const path = require('path')
const pinoHttp = require('pino-http')
const logger = require('./utils/logger')('App')
const errorHandler = require('./middleware/errorHandler.middleware') // 引入錯誤處理
require('dotenv').config()
// 引入 passport 配置
const passport = require('./config/passport')
const session = require('express-session')

const app = express()
/* app.use(cors()) */

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5500',
  'http://localhost:8080',
  'https://buttersuger-frontend.zeabur.app',
  'https://buttersuger-test.zeabur.app',
  'https://butter-suger.zeabur.app',
  'https://butter-sugar-test.zeabur.app',
  'https://butter-sugar-backend.zeabur.app',
  'https://buttersugar-backend.zeabur.app',
  'd144vsl069kyo0.cloudfront.net', //結帳成功回傳頁面顯示
  'https://ccore.newebpay.com' // 藍新金流
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
app.use(express.json())
/* app.use(express.urlencoded({ extended: false })) */
app.use(express.urlencoded({ extended: true }))
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          method: req.method,
          url: req.url,
          headers: req.headers,
          body: req.body, // 這樣就不會破壞掉原本的 req.body
        }
      },
    },
  })
)
app.use(express.static(path.join(__dirname, 'public')))

// 設定 session 和 passport
app.use(
  session({
    secret: process.env.SESSION_SECRET, // 使用你的 session secret
    resave: false,
    saveUninitialized: false, // 在沒有改變 session 時不會保存 session
  })
)
app.use(passport.initialize()) // 初始化 passport
app.use(passport.session()) // 使用 session

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
/*     app.listen(process.env.PORT || 8080, () => {
      console.log('Server is running...')
    }) */
  })
  .catch((err) => {
    console.error('資料庫連線失敗:', err)
  })
module.exports = app
