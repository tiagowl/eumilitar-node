import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    try {
        await knex.schema.createTable('logs', table => {
            table.increments('id').index().notNullable().primary();
            table.integer('user', 11).unsigned().nullable()
                .references('user_id').inTable('users')
                .onDelete('CASCADE');
            table.dateTime('registrationDate')
                .defaultTo(knex.fn.now()).notNullable();
            table.string('event', 50).notNullable();
            table.string('userAgent', 200).nullable();
            table.string('ip', 20).notNullable();
            table.text('error').nullable();
            table.text('details').nullable();
        })
    } catch (error: any) {
        down(knex);
        throw error;
    }
}


export async function down(knex: Knex): Promise<void> {
    const exists = knex.schema.hasTable('logs');
    if (exists) return;
    await knex.schema.dropTable('logs');
}

