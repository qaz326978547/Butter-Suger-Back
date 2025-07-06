const { dataSource } = require('../../db/data-source')

//記錄使用者動作(目前只記錄登入後動作)
async function logSystemAction(logEntry){
    const systemLogRepo = dataSource.getRepository('system_log')

    try{
        await systemLogRepo.save(logEntry)
    }catch(error){
        console.log('[SystemLogError]', error)
    }
}

module.exports = logSystemAction