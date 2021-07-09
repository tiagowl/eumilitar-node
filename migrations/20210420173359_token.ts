import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    const existsLoginSessions = await knex.schema.hasTable('login_sessions')
    if (existsLoginSessions) {
        return knex.schema.alterTable('login_sessions', (table) => {
            table.string('user_agent', 255).nullable()
        });
    }
}


export async function down(knex: Knex): Promise<void> {
    const existsLoginSessions = await knex.schema.hasTable('login_sessions')
    if (existsLoginSessions) {
        return knex.schema.alterTable('login_sessions', (table) => {
            table.dropColumn('user_agent')
        });
    }
}

