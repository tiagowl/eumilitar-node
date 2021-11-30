import { Knex } from "knex";

const tableName = 'warnings';

export async function up(knex: Knex): Promise<void> {
    try {
        await knex.schema.alterTable(tableName, table => {
            table.string('image', 300).nullable();
            table.text('message').nullable().alter();
        });
    } catch (error: any) {
        await down(knex);
        throw error;
    }
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable(tableName, table => {
        table.text('message').notNullable().alter();
        table.dropColumn('image');
    });
}

