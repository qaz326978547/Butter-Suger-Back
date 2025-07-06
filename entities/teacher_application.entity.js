const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
    name: 'teacher_application',
    tableName: 'teacher_application',
    columns: {
        id: {
            primary: true,
            type: 'uuid',
            generated: 'uuid', 
        },
        user_id: {
            type: 'uuid',
            /* unique: true, */ //如果上一次被退件就不能申請了
        },
        course_name: {
            type:'varchar',
            length: 255,
            nullable: false
        },
        description: {
            type: 'text',
            nullable: true
        },
        status: {
            type: 'enum',
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        created_at: {
            type: 'timestamptz',
            createDate: true,
            default: () => 'CURRENT_TIMESTAMP', // 預設為當前時間
        },
        updated_at: {
            type: 'timestamptz',
            updateDate: true,
            default: () => 'CURRENT_TIMESTAMP', // 預設為當前時間
        },
    },
    relations: {
        user: {
            target: 'users',
            type: 'one-to-one',
            joinColumn: {
                name: 'user_id',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'teacher_application_users_id_fk',
            },
        onDelete: 'CASCADE',
        }
    },
})
