import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    const schema = knex.schema;
    const exists = await schema.hasTable('essays');
    return (exists ? schema :
        schema.createTable('essays', table => {
            table.increments('essay_id').index()
                .notNullable();
            table.string('file_name', 255).notNullable();
            table.string('file_url', 200).notNullable();
            table.string('file_path', 255).notNullable();
            table.integer('user_id', 11).unsigned()
                .references('user_id').inTable('users')
                .onDelete('CASCADE').onUpdate('CASCADE')
                .notNullable();
            table.integer('course_tag', 1).notNullable();
            table.dateTime('sent_date').notNullable()
        })
    ).alterTable('essays', (table) => {
        table.boolean('local').defaultTo(true)
            .notNullable();
        table.dateTime('last_modified').notNullable()
            .defaultTo(knex.fn.now());
        table.integer('theme').unsigned()
            .references('id').inTable('essay_themes')
            .onDelete('CASCADE').onUpdate('CASCADE')
            .nullable();
        table.string('status', 15).nullable();
        table.string('file_name').defaultTo('')
            .nullable().alter();
        table.dateTime('sent_date').notNullable()
            .defaultTo(knex.fn.now()).alter()
    })
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.alterTable('essays', table => {
        table.dropForeign('theme');
        table.dropColumn('local');
        table.dropColumn('last_modified');
        table.dropColumn('theme');
        table.dropColumn('status');
        table.string('file_name', 255).notNullable().alter();
    });
}