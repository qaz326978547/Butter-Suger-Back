const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'teacher_earning',
    tableName: 'teacher_earning',
    columns: {
        id: {
            primary: true,
            type: 'uuid',
            generated: 'uuid',
        },
        teacher_id: {
            type: 'uuid',
            unique: true, 
        },
        total_revenue: {
            type: 'numeric',
            precision: 10,
            scale: 2,
            default: 0,
        },
        total_courses: {
            type: 'int',
            default: 0,
        },
        total_teachings: {
            type: 'int',
            default: 0,
        },
        created_at: {
            type: 'timestamptz',
            createDate: true,
            default: () => 'CURRENT_TIMESTAMP', // 預設為當前時間
        },
    },
    relations: {
        teacher: {
        target: 'teacher',
        type: 'one-to-one',
        joinColumn: {
            name: 'teacher_id',
            referencedColumnName: 'id',
            foreignKeyConstraintName: 'teacher_earning_teacher_id_fk',
        },
        onDelete: 'CASCADE',
        }
    },
    });