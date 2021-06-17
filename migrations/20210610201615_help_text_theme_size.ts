import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.alterTable('essay_themes', table => {
        table.text('helpText').notNullable().alter();
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.alterTable('essay_themes', table => {
        table.string('helpText', 255).notNullable().defaultTo('');
    });
}

