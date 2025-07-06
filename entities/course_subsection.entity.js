const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
  name: 'course_subsection',
  tableName: 'course_subsection',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    section_id: {
      type: 'uuid',
    },
    order_index: {
      type: 'int',
      default: 0,
    },
    subsection_title: {
      type: 'varchar',
      length: 255,
      nullable: false,
    },
    video_file_url: {
      type: 'varchar',
      length: 255,
      nullable: true,
    },
    video_duration: {
      type: 'int',
      nullable: true,
    },
    uploaded_at: {
      type: 'timestamptz',
      nullable: true,
    },
    status: {
      type: 'enum',
      enum: ['available', 'processing'],
      default: 'processing',
    },
    is_preview_available: {
      type: 'boolean',
      default: false,
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
    section: {
      target: 'course_section',
      type: 'many-to-one',
      joinColumn: {
        name: 'section_id',
        referencedColumnName: 'id',
        foreignKeyConstraintName: 'course_subsection_section_id_fk',
      },
      onDelete: 'CASCADE',
    },
  },
})
