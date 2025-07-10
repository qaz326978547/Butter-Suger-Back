const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
  name: 'answer', // 實體的名稱
  tableName: 'answer', // 對應的資料表名稱
  columns: {
        id: {
        primary: true, // 設定為主鍵
        type: 'uuid', // 資料型別為 UUID
        generated: 'uuid', // 設定為 UUID 自動生成
        },
        question_id: {
            type: 'uuid',
            nullable: false,
        },
        user_id: {
            type: 'uuid',
            nullable: false,
        },
        answer_text: {
            type: 'text',
            nullable: false,
        },
        user_role: {
            type: 'varchar',
            enum: ['teacher','student'],
            nullable: false
        },
        is_accepted: {
            type: 'boolean',
            default: false
        },
        created_at: {
            type: 'timestamp',
            createDate: true,
        }
    },
    relations: {
        user: {
            target: 'users',
            type: 'many-to-one',
            inverseSide: 'answer',
            joinColumn: {
                name: 'user_id',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'answer_users_id_fk'
            }
        },
        question: {
            target: 'question',
            type: 'many-to-one',
            inverseSide: 'answer',
            joinColumn: {
                name: 'question_id',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'answer_question_id_fk'
            }
        }
    }
})
