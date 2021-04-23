import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    const tableExists = await knex.schema.hasTable('password_reset');
    if(tableExists) return;
    return knex.schema.createTable('password_reset', (table) => {
        table.string('email', 255).index().notNullable();
        table.string('selector', 16).notNullable();
        table.string('token', 64).notNullable();
        table.dateTime('expires').notNullable();
    })
}


export async function down(knex: Knex): Promise<void> {
}

