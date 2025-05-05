// config/passport.js
const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy

const { dataSource } = require('../db/data-source')

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

module.exports = passport
