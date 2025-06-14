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
      type: 'int',
      nullable: true,
    },
    course_banner_imageUrl: {
      type: 'varchar',
      length: 2048,
      nullable: true,
    },
    course_name: {
      type: 'varchar',
      length: 30,
      nullable: true,
    },
    course_banner_description: {
      // 課程橫幅描述
      type: 'text',
      nullable: true,
      comment: '課程橫幅描述',
    },
    course_description: {
      // 課程簡介
      type: 'text',
      nullable: true,
      comment: '課程簡介',
    },
    course_description_imageUrl: {
      type: 'text',
      nullable: true,
    },
    course_hours: {
      type: 'numeric',
      precision: 10,
      scale: 2,
      nullable: true,
    },
    course_small_imageUrl: {
      type: 'varchar',
      length: 2048,
      nullable: true,
    },
    total_users: {
      type: 'integer',
      nullable: true,
    },
    trailer_name: {
      type: 'varchar',
      length: 255,
      nullable: true,
    },
    trailer_url: {
      type: 'varchar',
      length: 255,
      nullable: true,
    },
    trailer_status: {
      type: 'enum',
      enum: ['not_uploaded', 'processing', 'ready', 'failed'],
      default: 'not_uploaded',
    },
    trailer_size: {
      type: 'varchar',
      length: 50,
      nullable: true,
    },
    trailer_type: {
      type: 'varchar',
      length: 50,
      nullable: true,
    },
    suitable_for: {
      type: 'text',
      nullable: true,
      comment: '適合對象',
    },
    course_goal: {
      type: 'text',
      nullable: true,
      comment: '課程目標',
    },
    origin_price: {
      type: 'integer',
      nullable: true,
    },
    sell_price: {
      type: 'integer',
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
      inverseSide: 'courses',
      joinColumn: {
        name: 'teacher_id',
        referencedColumnName: 'id',
        foreignKeyConstraintName: 'courses_teacher_id_fk',
      },
      onDelete: 'SET NULL',
    },
    category: {
      target: 'course_categories',
      type: 'many-to-one',
      inverseSide: 'courses',
      joinColumn: {
        name: 'category_id',
        referencedColumnName: 'id',
        foreignKeyConstraintName: 'courses_course_categories_id_fk',
      },
      onDelete: 'SET NULL',
    },
    handouts: {
      target: 'course_handouts',
      type: 'one-to-many',
      inverseSide: 'course',
      cascade: true, // 建議保留，可自動建立/刪除 handouts
    },
  },
})
