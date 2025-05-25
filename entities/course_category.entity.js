const { EntitySchema } = require('typeorm');

// 測試用，塞資料，非正式格式
module.exports = new EntitySchema({
    name: 'course_category',
    tableName: 'course_category',
    columns: {
        id: {
            primary: true,
            type: 'uuid',
            generated: 'uuid',
        },
        name: {
            type: 'varchar',
            length: 10,
            unique:true,
            nullable: true     //暫, 測試資料用
        },
        created_at: {
            type: 'timestamp',
            createDate: true,
        }
    }
});
