const { DataSource } = require('typeorm')
const { dataSource: AppDataSource } = require('../db/data-source')

async function truncateAllTables() {
  try {
    await AppDataSource.initialize()
    const queryRunner = AppDataSource.createQueryRunner()
    await queryRunner.connect()

    // 取得所有自訂資料表
    const tables = AppDataSource.entityMetadatas.map((meta) => `"${meta.tableName}"`)
    if (tables.length === 0) {
      console.log('⚠️ No tables to truncate.')
    } else {
      const truncateSQL = `TRUNCATE ${tables.join(', ')} RESTART IDENTITY CASCADE`
      await queryRunner.query(truncateSQL)
      console.log(`✅ All tables truncated: ${tables.join(', ')}`)
    }

    await queryRunner.release()
    await AppDataSource.destroy()
  } catch (error) {
    console.error('❌ Error truncating tables:', error)
  }
}

async function dropAllTables() {
  try {
    await AppDataSource.initialize()
    const queryRunner = AppDataSource.createQueryRunner()
    await queryRunner.connect()

    const tables = AppDataSource.entityMetadatas.map((meta) => `"${meta.tableName}"`)
    for (const table of tables) {
      await queryRunner.query(`DROP TABLE IF EXISTS ${table} CASCADE`)
      console.log(`🗑️ Dropped table: ${table}`)
    }

    await queryRunner.release()
    await AppDataSource.destroy()
    console.log('✅ All tables dropped.')
  } catch (error) {
    console.error('❌ Error dropping tables:', error)
  }
}

const action = process.argv[2]
if (action === 'truncate') {
  truncateAllTables()
} else if (action === 'drop') {
  dropAllTables()
} else {
  console.log(
    '❗ 請使用指令參數 "truncate" 或 "drop"\n 例如：node scripts/database-utils.js truncate'
  )
}
