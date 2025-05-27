const { EntitySchema } = require('typeorm')

// 測試用，塞資料，非正式格式
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
    course_banner_imageUrl: {
      type: 'varchar',
      length: 2048,
      nullable: true, //暫, 測試資料用
    },
    course_name: {
      type: 'varchar',
      length: 30,
      nullable: true, //暫, 測試資料用
    },
    course_banner_description: {
      type: 'text',
      nullable: true, //暫, 測試資料用
    },
    course_description: {
      type: 'text',
      nullable: true, //暫, 測試資料用
    },
    course_description_image: {
      type: 'text',
      nullable: true, //暫, 測試資料用
    },
    course_hours: {
      type: 'numeric',
      precision: 10,
      scale: 2,
      nullable: true, //暫, 測試資料用
    },
    course_smallimage: {
      type: 'varchar',
      length: 2048,
      nullable: true, //暫, 測試資料用
    },
    total_users: {
      type: 'integer',
      nullable: true, //暫, 測試資料用
    },
    trailer_vimeo_id: {
      type: 'varchar',
      length: 20,
      nullable: true, //暫, 測試資料用
    },
    trailer_name: {
      type: 'varchar',
      length: 255,
      nullable: true, //暫, 測試資料用
    },
    trailer_url: {
      type: 'varchar',
      length: 255,
      nullable: true, //暫, 測試資料用
    },
    trailer_status: {
      type: 'enum',
      enum: ['processing', 'ready', 'failed'],
      default: 'processing',
    },
    handout_name: {
      type: 'varchar',
      nullable: true, //暫, 測試資料用
    },
    handout_size: {
      type: 'integer',
      nullable: true, //暫, 測試資料用
    },
    handout_type: {
      type: 'varchar',
      length: 50,
      nullable: true, //暫, 測試資料用
    },
    handout_url: {
      type: 'varchar',
      nullable: true, //暫, 測試資料用
    },
    suitable_for: {
      type: 'text',
      nullable: true, //暫, 測試資料用
    },
    course_goal: {
      type: 'text',
      nullable: true, //暫, 測試資料用
    },
    origin_price: {
      type: 'integer',
      nullable: true, //暫, 測試資料用
    },
    sell_price: {
      type: 'integer',
      nullable: true, //暫, 測試資料用
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
      inverseSide: 'teacher',
      joinColumn: {
        name: 'teacher_id',
        referencedColumnName: 'id', // 對應教師的 id 欄位
        foreignKeyConstraintName: 'courses_teacher_id_fk',
      },
      onDelete: 'SET NULL', // 刪除教師時設為 NULL
    },
    category: {
      target: 'course_categories', // 對應類別的實體
      type: 'many-to-one', // 多個課程對應一個類別
      inverseSide: 'courses',
      joinColumn: {
        name: 'category_id',
        referencedColumnName: 'id', // 對應類別的 id 欄位
        foreignKeyConstraintName: 'courses_course_categories_id_fk', // 外鍵約束名稱
      }, // 在課程表中的欄位名稱
      onDelete: 'SET NULL', // 刪除類別時設為 NULL
    },
    handouts: {
      target: 'course_handouts',
      type: 'one-to-many',
      inverseSide: 'course',
    },
  },
})
