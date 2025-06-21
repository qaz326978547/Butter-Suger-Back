const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
  name: 'favorite_course', // 實體的名稱
  tableName: 'favorite_course', // 對應的資料表名稱
  columns: {
        id: {
        primary: true, // 設定為主鍵
        type: 'uuid', // 資料型別為 UUID
        generated: 'uuid', // 設定為 UUID 自動生成
        },
        user_id: {
            type: 'uuid',
            nullable: false,
        },
        course_id: {
            type: 'uuid',
            nullable: false,
        },
        created_at: {
            type: 'timestamp',
            createDate: true,
        },
        updated_at: {
            type: 'timestamp',
            updateDate: true,
        }
    },
    relations: {
        user: {
            target: 'users',
            type: 'many-to-one',
            inverseSide: 'favorite_course',
            joinColumn: {
                name: 'user_id',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'favorite_course_user_id_fk'
            }
        },
        course: {
            target: 'courses', 
            type: 'many-to-one', 
            inverseSide: 'favorite_course',
            joinColumn: { 
                name: 'course_id',
                referencedColumnName: 'id', 
                foreignKeyConstraintName: 'favorite_course_course_id_fk'
            }
        }
    }
})
