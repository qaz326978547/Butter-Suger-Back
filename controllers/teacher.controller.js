const { dataSource } = require('../db/data-source')
const { appError, sendResponse } = require('../utils/responseFormat')
const cleanUndefinedFields = require('../utils/cleanUndefinedFields')
const storage = require('../services/storage')


const updateUserAndTeacher = async (userId, userData, teacherData) => {
    await dataSource.transaction(async (manager) => {
        const userRepo = manager.getRepository('users');
        const teacherRepo = manager.getRepository('teacher');

        // 更新 users 表
        await userRepo.update(userId, userData);
        
        const findTeacher = await teacherRepo.findOne({ where: { user_id: userId }});
        
        if(findTeacher){
            // 存在就更新
            const teacherUpdate = await teacherRepo.update(findTeacher.id, teacherData);
        }else{
            // 不存在就新增
            const newTeacher = teacherRepo.create({ user_id: userId, ...teacherData });
            const result = await teacherRepo.save(newTeacher);
        }

    })
}

const teacherController = {
  //取得教師資料
  async getTeacherData(req, res, next) {
    try {
      const userId = req.user.id
      const teacherRepo = dataSource.getRepository('teacher')


      // 確認教師是否存在
      const findTeacher = await teacherRepo.findOne({
        select: [
          'id',
          'user_id',
          'bank_name',
          'bank_account',
          'slogan',
          'description',
          'specialization'
        ],
        where: { user_id: userId },
        relations: ['users']
      })

      if (!findTeacher) {
        return next(appError(404, '查無教師資料'))
      }

      // 回傳教師資料
      sendResponse(res, 200, true, '取得教師資料成功', {
            name: findTeacher.users.name,
            nickname: findTeacher.users.nickname,
            phone: findTeacher.users.phone,
            birthday: findTeacher.users.birthday,
            sex: findTeacher.users.sex,
            address: findTeacher.users.address,
            profile_image_url: findTeacher.users.profile_image_url,
            bank_name: findTeacher.bank_name,
            bank_account: findTeacher.bank_account,
            slogan: findTeacher.slogan,
            description: findTeacher.description,
            specialization: findTeacher.specialization,
        })
    } catch (error) {
      next(error)
    }
  },

  // 更新教師資料
  async updateTeacherData(req, res, next) {
    try {
        const userId = req.user.id
        const {name, nickname, phone, birthday, sex, address, bank_name, bank_account, slogan, description, specialization} = req.body

        const teacherRepo = dataSource.getRepository('teacher')
        // 確認教師是否存在
        const findTeacher = await teacherRepo.findOne({
            select: ['id'],
            where: { user_id: userId },
            relations: ['users']
        })

      // 清理未定義的欄位
        const updateUserData = cleanUndefinedFields({
            name, 
            nickname, 
            phone, 
            birthday, 
            sex, 
            address,
            profile_image_url: req.file ? req.file.path : findTeacher?.users?.profile_image_url,
            role: 'teacher',
        })

        // 清理未定義的欄位
        const updateTeacherData = cleanUndefinedFields({
            bank_name, 
            bank_account, 
            slogan, 
            description, 
            specialization
        })
   
        if(req.file){
            updateUserData.profile_image_url = await storage.upload(req.file, 'users', '')
        }
        
        await updateUserAndTeacher(userId, updateUserData, updateTeacherData)
        
        sendResponse(res, 200, true, '更新使用者資料成功')
    } catch (error) {
      next(error)
    }
  },
}

module.exports = teacherController
