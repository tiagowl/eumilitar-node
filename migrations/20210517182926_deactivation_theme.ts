import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.alterTable('essay_themes', table => {
        table.boolean('deactivated').defaultTo(false).notNullable();
    })
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.alterTable('essay_themes', table => {
        table.dropColumn('deactivated');
    })
}

