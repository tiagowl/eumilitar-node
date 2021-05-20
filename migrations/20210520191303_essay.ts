import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.alterTable('essays', (table) => {
        table.boolean('local').defaultTo(true)
            .notNullable();
        table.dateTime('last_modified').notNullable()
            .defaultTo(knex.fn.now());
        table.integer('theme').unsigned()
            .references('essay_themes').inTable('users')
            .onDelete('CASCADE').onUpdate('CASCADE')
            .nullable();
        table.string('status', 15).nullable();
    })
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.alterTable('essay', table => {
        table.dropColumn('local');
        table.dropColumn('last_modified');
    });
}