const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
  name: 'order', // 實體的名稱
  tableName: 'order', // 對應的資料表名稱
  columns: {
        id: {
            primary: true, // 設定為主鍵
            type: 'uuid', // 資料型別為 UUID
            generated: 'uuid', // 設定為 UUID 自動生成
        },
        user_id: {
            type: 'uuid',
            nullable: false,
        },
        coupon_id: {
            type: 'uuid',
            nullable: true,
        },
        discount_amount: {
            type: 'integer',
            nullable: false     
        },
        final_amount: {
            type: 'integer',
            nullable: false     
        },
        order_number: {
            type: 'varchar',
            length: 50, 
            nullable: false     
        },
        payway: {
            type: 'varchar',
            length: 20, 
            nullable: true     //藍新金流回傳資料
        },
        payment_status: {
            type: 'varchar',
            enum: ['pending', 'paid', 'failed'], 
            nullable: false     
        },
        payment_date: {
            type: 'timestamp',
            nullable: true
        },
        pay_trade_no: {
            type: 'varchar',
            length: 50, 
            nullable: true     
        },
        pay_check_mac_value: {
            type: 'varchar',
            length: 250, 
            nullable: false     
        },
        pay_rtn_msg: {
            type: 'jsonb',
            nullable: true
        },
        created_at: {
            type: 'timestamp',
            createDate: true,
        }
    }
})
