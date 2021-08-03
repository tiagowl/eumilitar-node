import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.alterTable('essays', table => {
        table.integer('corrector', 11).unsigned()
            .references('user_id').inTable('users')
            .onDelete('CASCADE').onUpdate('CASCADE')
            .nullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.alterTable('essays', table => {
        table.dropForeign(['corrector'], 'essays_corrector_foreign');
        table.dropColumn('corrector');
    });
}

