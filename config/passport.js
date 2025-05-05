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

module.exports = passport
