const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
  name: 'course_section',
  tableName: 'course_section',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    course_id: {
      type: 'uuid',
    },
    order_index: {
      type: 'int',
      default: 0,
    },
    main_section_title: {
      type: 'varchar',
      length: 255,
      default: '第一章:準備工作',
    },
    created_at: {
      type: 'timestamptz',
      createDate: true,
      default: () => 'CURRENT_TIMESTAMP'
    },
    updated_at: {
      type: 'timestamptz',
      updateDate: true,
      default: () => 'CURRENT_TIMESTAMP'
    },
  },
  relations: {
    course: {
      target: 'courses',
      type: 'many-to-one',
      joinColumn: {
        name: 'course_id',
        referencedColumnName: 'id',
        foreignKeyConstraintName: 'course_section_course_id_fk',
      },
      onDelete: 'CASCADE',
    },
    subsections: {
      target: 'course_subsection',
      type: 'one-to-many',
      inverseSide: 'section',
      cascade: true,
    },
  },
})
