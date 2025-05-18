const StorageInterface = require('../interface/StorageInterface')
const s3 = require('../../../config/s3Client')
const {GetObjectCommand, PutObjectCommand, DeleteObjectCommand, ListObjectsCommand} = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid')
const path = require('path')
const { URL } = require('url')
require('dotenv').config();

class S3StorageRepository extends StorageInterface {
  async upload(file, folder = '', profile_image_url) {
    const extension = path.extname(file.originalname)
    //重新命名
    let key;
    if(profile_image_url.startsWith("https://butter-sugar.s3")){
      const temp = profile_image_url.split("/")
      key = `${folder}/${temp[temp.length-1]}`
    }else{
      key = `${folder}/${uuidv4()}${extension}`
    }
    
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      Body: file.buffer,    //binary data
      ContentType: file.mimetype,
    }

    try {
      const command = new PutObjectCommand(params)
      const url = await s3.send(command);

      return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
    } catch (error) {
      return '檔案上傳失敗'      
    }
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
