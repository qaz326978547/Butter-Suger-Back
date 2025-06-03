// services/storage/repositories/S3StorageRepository.js
const Config = require('../../../config/index')
const { URL } = require('url')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3')
const s3 = require('../../../config/s3Client')
const S3StorageInterface = require('../interface/S3StorageInterface')

class S3StorageRepository extends S3StorageInterface {
  async upload(file, folder = '', filename = null) {
    const extension = path.extname(file.originalname)
    const baseName = filename ? path.basename(filename, extension) : uuidv4()
    const key = `${folder}/${baseName}${extension}`

    const params = {
      Bucket: Config.get('s3.bucketName'),
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    }
    try {
      const command = new PutObjectCommand(params)
      await s3.send(command)
      return `${Config.get('s3.cloudfrontUrl')}/${key}`
    } catch (err) {
      console.error('S3 上傳錯誤:', err)
      throw new Error('圖片上傳失敗')
    }
  }

  async delete(fileUrl) {
    const url = new URL(fileUrl)
    const key = decodeURIComponent(url.pathname.substring(1))

    const params = {
      Bucket: Config.get('s3.bucketName'),
      Key: key,
    }

    try {
      const command = new DeleteObjectCommand(params)
      await s3.send(command)
    } catch (err) {
      console.error('S3 刪除錯誤:', err)
      throw new Error('圖片刪除失敗')
    }
  }
}

module.exports = S3StorageRepository
