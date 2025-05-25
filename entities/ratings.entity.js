const { EntitySchema } = require('typeorm');

// 測試用，塞資料，非正式格式
module.exports = new EntitySchema({
    name: 'ratings',
    tableName: 'ratings',
    columns: {
        id: {
            primary: true,
            type: 'uuid',
            generated: 'uuid',
        },
        user_id: {
            type: 'uuid',
            nullable: true
        },
        course_id: {
            type: 'uuid',
            nullable: true
        },
        rating_score:{
            type: 'numeric',
            precision: 10,
            scale: 2, 
            nullable: true, 
        },
        review_text: {
            type: 'text',
            nullable: false
        },
        created_at: {
            type: 'timestamp',
            createDate: true,
        }
    },
    checks: [
        {
            expression: '"rating_score">=1 AND "rating_score"<=5 ',
            name: 'CHK_rating_score_range',
        }
    ],
    relations: {
        users: {
            target: 'users',
            type: 'many-to-one', // 多個評價對應一個學生
            inverseSide: 'ratings',
            joinColumn: {
                name: 'user_id',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'ratings_users_id_fk'
            },
            onDelete: 'SET NULL', // 刪除教師時設為 NULL
        },
        courses: {
            target: 'courses', // 對應類別的實體
            type: 'many-to-one', // 多個評價對應一個課程
            inverseSide: 'ratings',
            joinColumn: { 
                name: 'course_id',
                referencedColumnName: 'id', 
                foreignKeyConstraintName: 'ratings_courses_id_fk'
            }, 
            onDelete: 'SET NULL', // 刪除類別時設為 NULL
        }
    },
});
