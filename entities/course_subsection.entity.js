const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'course_subsections',
    tableName: 'course_subsections',
    columns: {
        id: {
            primary: true,
            type: 'uuid',
            generated: 'uuid',
        },
        order_index: {
            type: 'int',
        },
        subsection_title: {
            type: 'varchar',
            length: 255,
        },
        video_file_id: {
            type: 'varchar',
            length: 255,
        },
        video_file_url: {
            type: 'varchar',
            length: 255,
        },
        video_file_name: {
            type: 'varchar',
            length: 255,
        },
        video_duration: {
            type: 'int',
        },
        uploaded_at: {
            type: 'timestamp',
        },
        video_status: {
            type: 'enum',
            enum: ['processing', 'ready', 'failed'],
            default: 'processing',
        },
        is_preview_available: {
            type: 'boolean',
            default: false,
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
        section: {
            type: 'many-to-one', // 多個小節對應一個章節
            target: 'course_sections', 
            joinColumn: { name: 'section_id' }, //對應章節的外建
            onDelete: 'CASCADE',
        },
    },
});
