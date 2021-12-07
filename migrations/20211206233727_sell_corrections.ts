import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    try {
        await knex.schema.alterTable('settings', table => {
            table.boolean('sellCorrections').notNullable().defaultTo(false);
        })
    } catch (error: any) {
        await down(knex);
        throw error;
    }
}


export async function down(knex: Knex): Promise<void> {
    const exists = await knex.schema.hasColumn('settings', 'sellCorrections');
    if (exists) return knex.schema.alterTable('settings', table => {
        table.dropColumn('sellCorrections');
    });
}

