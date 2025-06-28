const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
  name: 'course_handouts',
  tableName: 'course_handouts',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    course_id: {
      type: 'uuid',
    },
    name: {
      type: 'varchar',
      length: 255,
      nullable: true,
    },
    url: {
      type: 'varchar',
      length: 2048,
    },
    size: {
      type: 'varchar',
      length: 50,
      nullable: true,
    },
    type: {
      type: 'varchar',
      length: 100,
      nullable: true,
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
    course: {
      target: 'courses',
      type: 'many-to-one',
      joinColumn: {
        name: 'course_id',
        referencedColumnName: 'id',
        foreignKeyConstraintName: 'course_handouts_course_id_fk',
      },
      onDelete: 'CASCADE', // 課程刪除時，自動刪除 handouts
    },
  },
})
