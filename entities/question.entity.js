const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
  name: 'question', // 實體的名稱
  tableName: 'question', // 對應的資料表名稱
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
        serial_id: {
            type: 'int',
            generated: 'increment',
            nullable: false,
        },
        course_id: {
            type: 'uuid',
            nullable: false,
        },
        question_text: {
            type: 'text',
            nullable: false,
        } , /*
        status: {
            type: 'varchar',
            enum: ['pending','answered','closed'],
            enumName: 'question_status_enum',
            default: 'pending'
        }, *///許願池  
        created_at: {
            type: 'timestamp',
            createDate: true,
        }
    },
    relations: {
        user: {
            target: 'users',
            type: 'many-to-one',
            inverseSide: 'question',
            joinColumn: {
                name: 'user_id',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'question_users_id_fk'
            }
        },
        course: {
            target: 'courses',
            type: 'many-to-one',
            inverseSide: 'question',
            joinColumn: {
                name: 'course_id',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'question_courses_id_fk'
            }
        }
    }
})
