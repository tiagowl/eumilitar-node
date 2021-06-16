import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema
        .createTable('essay_invalidations', table => {
            table.increments('id').index().notNullable();
            table.integer('corrector', 11).unsigned()
                .references('user_id').inTable('users')
                .onDelete('SET NULL').onUpdate('CASCADE')
                .nullable();
            table.integer('essay')
                .references('essay_id').inTable('essays')
                .onDelete('CASCADE').onUpdate('CASCADE')
                .notNullable();
            table.string('reason', 30).notNullable();
            table.dateTime('invalidationDate').notNullable()
                .defaultTo(knex.fn.now());
            table.text('comment').nullable();
        })
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('essay_invalidations');
}

