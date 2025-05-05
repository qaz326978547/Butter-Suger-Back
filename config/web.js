module.exports = {
  logLevel: process.env.LOG_LEVEL || 'debug',
  port: process.env.PORT || 3000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
}
