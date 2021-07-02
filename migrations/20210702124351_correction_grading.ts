import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.alterTable('essay_grading', table => {
        table.decimal('final_grading', 8, 2).notNullable().alter();
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.alterTable('essay_grading', table => {
        table.decimal('final_grading', 2, 1).notNullable().alter();
    });
}

