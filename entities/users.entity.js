const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
  name: 'users', // 實體的名稱
  tableName: 'users', // 對應的資料表名稱
  columns: {
    id: {
      primary: true, // 設定為主鍵
      type: 'uuid', // 資料型別為 UUID
      generated: 'uuid', // 設定為 UUID 自動生成
      nullable: false, // 不允許為 null
    },
    google_id: {
      type: 'varchar',
      unique: true, // 設定為唯一
      nullable: false, // 不允許為 null
    },
    name: {
      type: 'varchar',
      nullable: false, // 不允許為 null
    },
    nickname: {
      type: 'varchar',
      nullable: true, // 可以為 null
    },
    email: {
      type: 'varchar',
      unique: true, // 設定為唯一
      nullable: false, // 不允許為 null
    },
    phone: {
      type: 'varchar',
      nullable: true, // 可以為 null
    },
    birthday: {
      type: 'date',
      nullable: true, // 可以為 null
    },
    sex: {
      type: 'enum',
      enum: ['male', 'female'],
      nullable: true, // 可以為 null
    },
    address: {
      type: 'text',
      nullable: true, // 可以為 null
    },
    role: {
      type: 'enum',
      enum: ['student', 'teacher', 'admin'],
      nullable: false, // 不允許為 null
    },
    is_active: {
      type: 'boolean',
      default: true, // 預設為 true
    },
    is_verified: {
      //是否已驗證
      type: 'boolean',
      default: false, // 預設為 false
    },
    login_count: {
      type: 'int',
      default: 0, // 預設為 0
    },
    profile_image_url: {
      type: 'varchar',
      nullable: true, // 可以為 null
    },
    google_token: {
      type: 'text',
      nullable: true, // 可以為 null
    },
    last_login_at: {
      type: 'timestamptz',
      nullable: true, // 可以為 null
    },
    created_at: {
      type: 'timestamptz',
      default: () => 'CURRENT_TIMESTAMP', // 預設為當前時間
    },
    updated_at: {
      type: 'timestamptz',
      default: () => 'CURRENT_TIMESTAMP', // 預設為當前時間
      onUpdate: 'CURRENT_TIMESTAMP', // 更新時自動更新為當前時間
    },
  },
})
