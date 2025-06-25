const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'teacher_earning_record',
    tableName: 'teacher_earning_record',
    columns: {
        id: {
            primary: true,
            type: 'uuid',
            generated: 'uuid',
        },
        teacher_id: {
            type: 'uuid',
        },
        course_id: {
            type: 'uuid',
        },
        revenue_gross: {
            type: 'numeric',
            precision: 10,
            scale: 2,
            default: 0,
        },
        service_fee: {
            type: 'numeric',
            precision: 10,
            scale: 2,
            default: 0,
        },
        revenue_net: {
            type: 'numeric',
            precision: 10,
            scale: 2,
            default: 0,
        },
        created_at: {
            type: 'timestamp',
            createDate: true,
        },
    },
    relations: {
        teacher: {
        target: 'teacher',
        type: 'many-to-one',
        joinColumn: {
            name: 'teacher_id',
            referencedColumnName: 'id',
            foreignKeyConstraintName: 'teacher_earning_record_teacher_id_fk',
        },
        onDelete: 'CASCADE',
        },
        course: {
        target: 'courses',
        type: 'many-to-one',
        joinColumn: {
            name: 'course_id',
            referencedColumnName: 'id',
            foreignKeyConstraintName: 'teacher_earning_record_course_id_fk',
        },
        onDelete: 'CASCADE',
        },
    },
    });
