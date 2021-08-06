import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('subscriptions', table => {
        table.boolean('active').defaultTo(true).notNullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex('subscriptions').where('active', false).del();
    await knex.schema.alterTable('subscriptions', table => {
        table.dropColumn('active');
    });
}

