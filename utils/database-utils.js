const { dataSource: AppDataSource } = require('../db/data-source')

async function truncateAllTables() {
  try {
    await AppDataSource.initialize()
    const queryRunner = AppDataSource.createQueryRunner()
    await queryRunner.connect()

    const tables = AppDataSource.entityMetadatas.map(meta => {
      if (meta.schema) return `"${meta.schema}"."${meta.tableName}"`
      return `"${meta.tableName}"`
    })

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

    const tables = AppDataSource.entityMetadatas.map(meta => {
      if (meta.schema) return `"${meta.schema}"."${meta.tableName}"`
      return `"${meta.tableName}"`
    })

    if (tables.length === 0) {
      console.log('⚠️ No tables to drop.')
    } else {
      for (const table of tables) {
        await queryRunner.query(`DROP TABLE IF EXISTS ${table} CASCADE`)
        console.log(`🗑️ Dropped table: ${table}`)
      }
    }

    await queryRunner.release()
    await AppDataSource.destroy()
    console.log('✅ All tables dropped.')
  } catch (error) {
    console.error('❌ Error dropping tables:', error)
  }
}
;(async () => {
  const action = process.argv[2]
  if (action === 'truncate') {
    await truncateAllTables()
  } else if (action === 'drop') {
    await dropAllTables()
  } else {
    console.log(
      '❗ 請使用指令參數 "truncate" 或 "drop"\n 例如：node scripts/database-utils.js truncate'
    )
  }
})()
