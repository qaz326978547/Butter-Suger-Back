const express = require('express')
const { ExpressAdapter } = require('@bull-board/express')
const { createBullBoard } = require('@bull-board/api')
const { BullAdapter } = require('@bull-board/api/bullAdapter')
const videoUploadQueue = require('../queues/videoUpload.queue')

const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath('/api/v1/admin/queues')

createBullBoard({
  queues: [new BullAdapter(videoUploadQueue)],
  serverAdapter,
})

const router = express.Router()
router.use('/', serverAdapter.getRouter())

module.exports = router
