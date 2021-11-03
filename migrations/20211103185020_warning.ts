import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    try {
        await knex.schema.createTable('warnings', table => {
            table.increments('id').index().notNullable().unique();
            table.string('title', 200).notNullable();
            table.text('message').notNullable();
            table.dateTime('lastModified').defaultTo(knex.fn.now()).notNullable();
        });
    } catch (error) {
        await down(knex);
        throw error;
    }
}


export async function down(knex: Knex): Promise<void> {
    const exists = await knex.schema.hasTable('warnings');
    if (!exists) return;
    await knex.schema.dropTable('warnings');
}

