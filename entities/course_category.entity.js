const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'course_categories',
    tableName: 'course_categories',
    columns: {
        id: {
            primary: true,
            type: 'int',
            generated: true,
        },
        name: {
            type: 'varchar',
        },
        created_at: {
            type: 'timestamp',
            createDate: true,
        },
    },
    relations: {
        courses: {
            type: 'one-to-many', // 一個類別對應多個課程
            target: 'courses', 
            inverseSide: 'category', // 課程的反向關聯
            
        },
    },
});
