import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.alterTable('essay_grading', table => {
        for (let index = 1; index <= 14; index++) {
            table.dropColumn(`comment_c${index}`);
        }
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.alterTable('essay_grading', table => {
        for (let index = 1; index <= 14; index++) {
            table.string(`comment_c${index}`, 500)
                .nullable().defaultTo(null);
        }
    });
}

