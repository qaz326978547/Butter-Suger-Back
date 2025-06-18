const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'learning_process',
    tableName: 'learning_process',
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
        course_id: {
            type: 'uuid',
            nullable: false
        },
        section_id: {
            type: 'uuid',
            nullable: false
        },
        subsection_id: {
            type: 'uuid',
            nullable: false
        },
        status: {
            type: 'varchar',
            enum: ['not_started', 'in_progress', 'completed'],
            default:'not_started'  
        },
        watched_time: {
            type: 'varchar',
            nullable: true
        },
        completed_at: {
            type: 'timestamp',
            nullable: true,
        },
    },
    relations: {
        user: {
            type: 'many-to-one',
            target: 'users',
            joinColumn: { name: 'user_id' },
            onDelete: 'CASCADE'
        },
        course: {
            type: 'many-to-one', 
            target: 'courses',
            joinColumn: { name: 'course_id' },
            onDelete: 'CASCADE' 
        },
        section: {
            type: 'many-to-one', 
            target: 'course_sections',
            joinColumn: { name: 'section_id' },
            onDelete: 'CASCADE' 
        },
        subsection: {
            type: 'many-to-one', 
            target: 'course_subsections',
            joinColumn: { name: 'subsection_id' },
            onDelete: 'CASCADE' 
        }
    },
});
