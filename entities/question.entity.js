const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
  name: 'question', // 實體的名稱
  tableName: 'question', // 對應的資料表名稱
  columns: {
        id: {
            primary: true, 
            type: 'uuid', 
            generated: 'uuid', 
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
            type: 'timestamptz',
            createDate: true,
            default: () => 'CURRENT_TIMESTAMP'
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
