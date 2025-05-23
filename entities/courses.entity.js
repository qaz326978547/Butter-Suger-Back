const { EntitySchema } = require('typeorm');

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
        },
        course_banner_imageUrl: {
            type: 'varchar',
            length: 2048,
            nullable: true
        },
        course_name: {
            type: 'varchar',
        },
        course_banner_description: {
            type: 'text',
            nullable: true,
        },
        course_description: {
            type: 'text',
            nullable: true,
        },
        course_description_image: {
            type: 'text',
            nullable: true,
        },
        course_hours: {
            type: 'int',
            default: 0,
        },
        course_smallimage: {
            type: 'varchar',
            length: 2048,
            nullable: true,
        },
        total_users: {
            type: 'int',
            nullable: true,
            default: 0,
        },
        trailer_vimeo_id: {
            type: 'varchar',
            length: 20,
            nullable: true,
        },
        trailer_name: {
            type: 'varchar',
            length: 255,
            nullable: true,
        },
        trailer_url: {
            type: 'varchar',
            length: 255,
            nullable: true,
        },
        trailer_status: {
            type: 'enum',
            enum: ['processing', 'ready', 'failed'],
            default: 'processing',
        },
        handout_name: {
            type: 'varchar',
            nullable: true,
        },
        suitable_for: {
            type: 'text',
            nullable: true,
        },
        course_goal: {
            type: 'text',
            nullable: true,
        },
        origin_price: {
            type: 'int',
            default: 0,
        },
        price: {
            type: 'int',
            default: 0,
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
        category: {
            type: 'many-to-one', // 多個課程對應一個類別
            target: 'course_categories', // 對應類別的實體
            joinColumn: { name: 'category_id' }, // 在課程表中的欄位名稱
            onDelete: 'SET NULL', // 刪除類別時設為 NULL
        },
        sections: {
            type: 'one-to-many', // 一個課程對應多個章節
            target: 'course_sections', // 對應章節的實體
            inverseSide: 'course', // 章節實體中的 course 屬性
        },
    },
});
