const express = require('express')
const cors = require('cors')
const path = require('path')
const pinoHttp = require('pino-http')
const logger = require('./utils/logger')('App')
const userRouter = require('./routes/users.route')
const errorHandler = require('./middleware/errorHandler') // 引入錯誤處理
const handleErrorAsync = require('./middleware/handleErrorAsync') // 引入異步錯誤處理
require('dotenv').config()
const GoogleStrategy = require('passport-google-oauth20').Strategy
// 引入 passport 配置
const passport = require('passport')
const session = require('express-session')

const app = express()
// Passport 設定
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, done) => {
      // 儲存 accessToken 到 profile 中
      profile.accessToken = accessToken
      // 儲存資料後，傳遞給下一步
      return done(null, profile)
    }
  )
)

//當使用者成功登入時, serializeUser 會儲存使用者資訊到 session
passport.serializeUser((user, done) => done(null, user))
//deserializeUser 會從 session 取出使用者資訊, 並附加在 req.user
passport.deserializeUser((obj, done) => done(null, obj))

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        req.body = req.raw.body
        return req
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

app.use('/api/v1/users', userRouter)

// 健康檢查路由
app.get('/healthcheck', (req, res) => {
  res.status(200).send('OK')
})

// 讓錯誤處理 middleware 做全域錯誤處理
app.use(errorHandler)

module.exports = app
