import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    try {
        await knex.schema.createTable('single_essays', table => {
            table.increments('id').index().primary().notNullable();
            table.integer('theme_id').references('id')
                .inTable('essay_themes').onDelete('CASCADE')
                .notNullable().unsigned();
            table.integer('user_id', 11).unsigned()
                .references('user_id').inTable('users')
                .onDelete('CASCADE').notNullable();
            table.string('token', 64).notNullable().unique();
            table.dateTime('registration_date').notNullable();
            table.dateTime('expiration').notNullable();
            table.dateTime('sent_date').nullable();
            table.integer('essay_id', 11).nullable();
            table.foreign('essay_id').references('essays.essay_id')
                .onDelete('CASCADE');
        });
    } catch (error: any) {
        await down(knex);
        throw error;
    }
}


export async function down(knex: Knex): Promise<void> {
    const exists = await knex.schema.hasTable('single_essays');
    if (exists) await knex.schema.dropTable('single_essays');
}

