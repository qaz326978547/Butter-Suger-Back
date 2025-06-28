const dotenv = require('dotenv')

const result = dotenv.config()
const db = require('./db')
const web = require('./web')
const s3 = require('./s3Client')
const newebpay = require('./newebpay')

if (result.error) {
  console.warn('[Warning] .env file not found, using environment variables from process.env')
} else {
  console.log('[Info] .env file loaded successfully')
}

// 這邊可以印出所有重要 env 變數，方便確認
console.log('Config env vars:')
console.log({
  PORT: process.env.PORT,
  SESSION_SECRET: process.env.SESSION_SECRET ? 'set' : 'NOT SET',
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
})

const config = {
  db,
  web,  
  newebpay,
  s3: {
    bucketName: process.env.AWS_S3_BUCKET_NAME,
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    cloudfrontUrl: process.env.AWS_CLOUDFRONT_URL,
  },
  secret: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresDay: process.env.JWT_EXPIRES_DAY,
  },
}

class ConfigManager {
  static get(path) {
    if (!path || typeof path !== 'string') {
      throw new Error(`incorrect path: ${path}`)
    }
    const keys = path.split('.')
    let configValue = config
    keys.forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(configValue, key)) {
        throw new Error(`config ${path} not found`)
      }
      configValue = configValue[key]
    })
    return configValue
  }
}

module.exports = ConfigManager
