import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    try {
        await knex.schema.alterTable('login_sessions', table => {
            table.dropPrimary();
        })
        await knex.schema.alterTable('login_sessions', table => {
            table.increments('id').index().primary();
        })
    } catch (error) {
        await down(knex).catch(() => {
            throw error;
        });
        throw error;
    }
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('login_sessions', table => {
        table.dropColumn('id');
        table.primary(['session_id'])
    });
}

