import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    try {
        await knex.schema.alterTable('users', table => {
            table.string('phone', (2 + 2 + 1 + 8)).nullable();
        });
    } catch (error: any) {
        await down(knex);
        throw error;
    }
}


export async function down(knex: Knex): Promise<void> {
    const exists = await knex.schema.hasColumn('users', 'phone');
    if (!exists) return;
    await knex.schema.alterTable('users', table => {
        table.dropColumn('phone');
    });
}

