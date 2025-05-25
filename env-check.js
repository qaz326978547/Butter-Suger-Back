// env-check.js
console.log('--- Environment Variables Check ---')

console.log('PORT:', process.env.PORT)
console.log('WEB_PORT:', process.env.WEB_PORT)
console.log('DB_HOST:', process.env.DB_HOST)
console.log('DB_PORT:', process.env.DB_PORT)
console.log('DB_USERNAME:', process.env.DB_USERNAME)
console.log('DB_PASSWORD:', process.env.DB_PASSWORD)
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '[HIDDEN]' : 'NOT SET')
console.log('JWT_SECRET:', process.env.JWT_SECRET)

console.log('-----------------------------------')
