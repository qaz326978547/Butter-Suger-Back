const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'course_sections',
    tableName: 'course_sections',
    columns: {
        id: {
            primary: true,
            type: 'uuid',
            generated: 'uuid',
        },
        course_id: {
            type: 'uuid',
            nullable: false
        },
        order_index: {
            type: 'int',
        },
        main_section_title: {
            type: 'varchar',
            length: 255,
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
        course: {
            type: 'many-to-one', // 多個章節對應一個課程
            target: 'courses',
            joinColumn: { name: 'course_id' },
            onDelete: 'CASCADE', // 當課程被刪除時，相關的章節也會被刪除
        },
        subsections: {
            type: 'one-to-many',
            target: 'course_subsections',
            inverseSide: 'section', // 反向關聯 
        },
    },
});
