const StorageInterface = require('../interface/StorageInterface')
const s3 = require('../../../config/s3Client')
const { v4: uuidv4 } = require('uuid')
const path = require('path')
const { URL } = require('url')
class S3StorageRepository extends StorageInterface {
  async upload(file, folder = '') {
    const extension = path.extname(file.originalname)
    const key = `${folder}/${uuidv4()}${extension}`

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    }

    await s3.upload(params).promise()

    return `${process.env.AWS_CLOUDFRONT_URL}/${key}`
  }

  async delete(fileUrl) {
    const url = new URL(fileUrl)
    const key = decodeURIComponent(url.pathname.substring(1))

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
    }

    await s3.deleteObject(params).promise()
  }
}

module.exports = S3StorageRepository
