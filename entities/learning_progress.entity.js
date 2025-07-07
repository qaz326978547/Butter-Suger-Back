const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
  name: 'learning_progress',
  tableName: 'learning_progress',
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
    subsection_id: {
      type: 'uuid',
      nullable: false,
    },
    status: {
      type: 'varchar',
      enum: ['in_progress', 'completed'],
      default: 'in_progress',
    },
    watched_time: {
      type: 'int',
      nullable: true,
    },
    completed_at: {
      type: 'timestamptz',
      nullable: true,
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
    }
  },
  relations: {
    user: {
      type: 'many-to-one',
      target: 'users',
      joinColumn: { name: 'user_id' },
      onDelete: 'CASCADE',
    },
    subsection: {
      type: 'many-to-one',
      target: 'course_subsection',
      joinColumn: { name: 'subsection_id' },
      onDelete: 'CASCADE',
    },
  },
})
