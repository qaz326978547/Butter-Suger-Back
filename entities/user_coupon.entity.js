const { EntitySchema } = require('typeorm');

// 測試用，塞資料，非正式格式
module.exports = new EntitySchema({
    name: 'user_coupon',
    tableName: 'user_coupon',
    columns: {
        id: {
            primary: true,
            type: 'uuid',
            generated: 'uuid',
        },
        user_id: {
            type: 'uuid',
            nullable: false
        },
        coupon_id: {
            type: 'uuid',
            nullable: false
        },
        is_used: {
            type: 'boolean',
            default: false
        },
        use_at: {
            type: 'timestamp',
            nullable: true, 
        },
        created_at: {
            type: 'timestamp',
            createDate: true,
        }
    },
    relations: {
            users: {
                target: 'users',
                type: 'many-to-one',
                inverseSide: 'user_coupon',
                joinColumn: {
                    name: 'user_id',
                    referencedColumnName: 'id',
                    foreignKeyConstraintName: 'user_coupon_users_id_fk'
                }
            },
            coupon: {
                target: 'coupon',
                type: 'many-to-one',
                inverseSide: 'user_coupon',
                joinColumn: {
                    name: 'coupon_id',
                    referencedColumnName: 'id',
                    foreignKeyConstraintName: 'user_coupon_coupon_id_fk'
                }
            }
    }
});
