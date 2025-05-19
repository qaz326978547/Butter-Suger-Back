class S3StorageInterface {
    async upload(file, folderName) {
      throw new Error('Method not implemented')
    }
    async delete(fileKey) {
      throw new Error('Method not implemented')
    }
  }
  
  module.exports = S3StorageInterface