const { EntitySchema } = require('typeorm');

// 測試用，塞資料，非正式格式
module.exports = new EntitySchema({
    name: 'coupon',
    tableName: 'coupon',
    columns: {
        id: {
            primary: true,
            type: 'uuid',
            generated: 'uuid',
        },
        code: {
            type: 'varchar',
            nullable: false
        },
        discount_amount: {
            type: 'integer',
            nullable: false
        },
        min_order:{
            type: 'integer',
            nullable: false, 
        },
        start_date:{
            type: 'timestamp',
            nullable: false, 
        },
        end_date:{
            type: 'timestamp',
            nullable: false, 
        },
        created_at: {
            type: 'timestamp',
            createDate: true,
        }
    }
});
