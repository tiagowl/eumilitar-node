import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('essay_themes', (table) => {
        table.increments('id').primary().index().notNullable();
        table.string('title', 255).notNullable();
        table.string('helpText', 255).notNullable().defaultTo('');
        table.string('file', 255).notNullable();
        table.string('courses').notNullable();
        table.timestamp('startDate').notNullable();
        table.timestamp('endDate').notNullable();
        table.timestamp('lastModified').notNullable().defaultTo(knex.fn.now());
    })
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('essay_themes');
}

