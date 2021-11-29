import { Knex } from "knex";

const tableName = 'essay_themes';

export async function up(knex: Knex): Promise<void> {
    try {
        await knex.schema.alterTable(tableName, table => {
            table.string('videoUrl', 300).nullable();
        })
    } catch (error: any) {
        await down(knex);
        throw error;
    }
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable(tableName, table => {
        table.dropColumn('videoUrl');
    });
}

