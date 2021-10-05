import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    try {
        await knex.schema.alterTable('password_reset', table => {
            table.string('selector', 36).notNullable().alter();
        });
    } catch (error) {
        await down(knex);
        throw error;
    }
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('password_reset', table => {
        table.string('selector', 16).notNullable().alter();
    });
}

