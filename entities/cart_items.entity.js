const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
  name: 'cart_items', // 實體的名稱
  tableName: 'cart_items', // 對應的資料表名稱
  columns: {
        id: {
        primary: true, // 設定為主鍵
        type: 'uuid', // 資料型別為 UUID
        generated: 'uuid', // 設定為 UUID 自動生成
        },
        cart_id: {
            type: 'uuid',
            nullable: false,
        },
        course_id: {
            type: 'uuid',
            nullable: false,
        },
        created_at: {
            type: 'timestamp',
            createDate: true,
        }
    },
    relations: {
        carts: {
            target: 'carts',
            type: 'many-to-one',
            inverseSide: 'cart_items',
            joinColumn: {
                name: 'cart_id',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'cart_items_carts_id_fk'
            }
        },
        courses: {
            target: 'courses',
            type: 'many-to-one',
            inverseSide: 'cart_items',
            joinColumn: {
                name: 'course_id',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'cart_items_courses_id_fk'
            }
        }
    }
})
