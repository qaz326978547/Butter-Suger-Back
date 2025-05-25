const { dataSource } = require('../../db/data-source')

//更新教師資訊, transaction 版, 同時更新兩張表的部分欄位, 失敗時整個 transaction rollback
const updateUserAndTeacher = async (userId, userData, teacherData) => {
    await dataSource.transaction(async (manager) => {
        const userRepo = manager.getRepository('users');
        const teacherRepo = manager.getRepository('teacher');

        // 更新 users 表
        await userRepo.update(userId, userData);
        
        const findTeacher = await teacherRepo.findOne({ where: { user_id: userId }});
        
        if(findTeacher){
            // 存在就更新教師資訊
            await teacherRepo.update(findTeacher.id, teacherData);
        }else{
            // 不存在就新增教師資訊
            const newTeacher = teacherRepo.create({ user_id: userId, ...teacherData });
            await teacherRepo.save(newTeacher);
        }
    })
}

module.exports = updateUserAndTeacher