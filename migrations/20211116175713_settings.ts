import { Knex } from "knex";

const table = 'settings';

export async function up(knex: Knex): Promise<void> {
    try {
        await knex.schema.createTable(table, table => {
            table.increments('id').index().primary().notNullable().unique();
            table.dateTime('lastModified').notNullable().defaultTo(knex.fn.now());
            table.integer('reviewExpiration').notNullable();
            table.integer('reviewRecuseExpiration').notNullable();
        });
    } catch (error: any) {
        await down(knex);
        throw error;
    }
}


export async function down(knex: Knex): Promise<void> {
    const exists = await knex.schema.hasTable(table);
    if (!exists) return;
    await knex.schema.dropTable(table);
}

