import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    const columns = await Promise.all(new Array(14).fill(0).map(async (_, index) => {
        const column = `comment_c${index + 1}`;
        const exists = await knex.schema.hasColumn('essay_grading', column);
        return exists ? column : false;
    }));
    return knex.schema.alterTable('essay_grading', async table => {
        columns.forEach(column => {
            if (column) table.dropColumn(column);
        });
    });
}


export async function down(knex: Knex): Promise<void> {
    const columns = await Promise.all(new Array(14).fill(0).map(async (_, index) => {
        const column = `comment_c${index + 1}`;
        const exists = await knex.schema.hasColumn('essay_grading', column);
        return !exists ? column : false;
    }));
    return knex.schema.alterTable('essay_grading', table => {
        columns.forEach(column => {
            if(column) table.string(column, 500)
                .nullable().defaultTo(null);
        });
    });
}

