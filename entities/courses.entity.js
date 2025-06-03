const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
  name: 'courses',
  tableName: 'courses',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    teacher_id: {
      type: 'uuid',
      nullable: true,
    },
    category_id: {
      type: 'uuid',
      nullable: true,
    },
    course_name: {
      type: 'varchar',
      length: 30,
      nullable: true,
    },
    course_status: {
      type: 'enum',
      enum: ['審核中', '上架', '下架'],
      default: '審核中',
    },
    created_at: {
      type: 'timestamp',
      createDate: true,
    },
    updated_at: {
      type: 'timestamp',
      updateDate: true,
    },
  },
  relations: {
    teacher: {
      target: 'teacher',
      type: 'many-to-one',
      joinColumn: {
        name: 'teacher_id',
        referencedColumnName: 'id',
        foreignKeyConstraintName: 'courses_teacher_id_fk',
      },
      onDelete: 'SET NULL',
      inverseSide: 'courses',
    },
  },
})
