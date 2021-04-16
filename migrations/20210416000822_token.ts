import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.alterTable('login_sessions', (table) => {
        table.string('user_agent').nullable()
    })
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.alterTable('login_sessions', (table) => {
        table.dropColumn('user_agent')
    });
}

