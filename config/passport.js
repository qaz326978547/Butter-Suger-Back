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
    async (accessToken, refreshToken, profile, done) => {
      try {
        const userRepo = dataSource.getRepository('users')

        let user = await userRepo.findOne({
          where: { google_id: profile.id },
        })

        if (!user) {
          user = userRepo.create({
            google_id: profile.id,
            name: `${profile.name.familyName}${profile.name.givenName}`,
            nickname: profile.displayName,
            email: profile.emails?.[0]?.value || '',
            is_verified: true,
            login_count: 1,
            profile_image_url: profile.photos?.[0]?.value || '',
            google_token: accessToken,
            last_login_at: new Date(),
          })
          await userRepo.save(user)
        } else {
          await userRepo.update(
            { id: user.id },
            {
              google_token: accessToken,
              login_count: user.login_count + 1,
              last_login_at: new Date(),
            }
          )
        }

        done(null, {
          id: user.id,
          name: user.name,
          nickname: user.nickname,
          email: user.email,
          profile_image_url: user.profile_image_url,
          role: user.role,
        })
      } catch (error) {
        done(error, null)
      }
    }
  )
)

// 設定 serialize 和 deserialize 函數，這是 passport 的必要設置
passport.serializeUser((user, done) => {
  if (user && user.id) {
    done(null, user.googleId)
  } else {
    done(new Error('User ID is missing'), null)
  }
})

passport.deserializeUser((googleId, done) => {
  // 根據 ID 查找用戶資料，這裡可以從資料庫中查詢
  done(null, { googleId }) // 假設用戶資料就是 ID
})

// Passport 設定
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.Google_CLIENT_ID,
      clientSecret: process.env.Google_CLIENT_SECRET,
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
