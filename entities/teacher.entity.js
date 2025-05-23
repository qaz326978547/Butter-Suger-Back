const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'teacher', // 實體的名稱
    tableName: 'teacher', // 對應的資料表名稱
    columns: {
      id: {
        primary: true, // 設定為主鍵
        type: 'uuid', // 資料型別為 UUID
        generated: 'uuid', // 設定為 UUID 自動生成
        nullable: false, // 不允許為 null
      },
      user_id: {
        type: 'uuid',
        unique: true,
        nullable: false
      },
      banner_image_url: {
        type: 'varchar',
        length: 500,
        nullable: true
      },
      rating_score: {
        type: 'numeric',
        precision: 10,
        scale: 2, 
        nullable: true, 
      },
      slogan: {
        type: 'varchar',
        length: 255,
        nullable: true
      },
      bank_name: {
        type: 'varchar',
        length: 50,
        nullable: false
      },
      bank_account: {
        type: 'varchar',
        length: 50,
        nullable: false
      },
      description: {
        type: 'text',
        nullable: false
      },
      specialization: {
        type: 'text',
        nullable: false
      },
      created_at: {
        type: 'timestamptz',
        default: () => 'CURRENT_TIMESTAMP', // 預設為當前時間
      },
      updated_at: {
        type: 'timestamptz',
        default: () => 'CURRENT_TIMESTAMP', // 預設為當前時間
        onUpdate: 'CURRENT_TIMESTAMP', // 更新時自動更新為當前時間
      }
    },
    relations: {
        users: {
            target: 'users',
            type: 'one-to-one',
            inverseSide: 'teacher',
            joinColumn: {
                name: 'user_id',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'teacher_users_id_fk'
            }
        }
    }
})