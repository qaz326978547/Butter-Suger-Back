const dotenv = require('dotenv')

const result = dotenv.config()
const db = require('./db')
const web = require('./web')
const s3 = require('./s3Client')
if (result.error) {
  console.warn('[Warning] .env file not found, using environment variables from process.env')
}

const config = {
  db,
  web,
  s3,
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
