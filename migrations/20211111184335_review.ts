import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    try {
        await knex.schema.createTable('reviews', table => {
            table.increments('id').index().primary().unique();
            table.integer('grade', 2).notNullable();
            table.integer('user', 11).references('user_id')
                .inTable('users').onDelete('CASCADE')
                .notNullable().unsigned();
            table.text('description').nullable();
            table.dateTime('registrationDate').notNullable()
                .defaultTo(knex.fn.now());
        });
    } catch (error: any) {
        await down(knex);
        throw error;
    }
}


export async function down(knex: Knex): Promise<void> {
    const exists = await knex.schema.hasTable('reviews');
    if (!exists) return;
    await knex.schema.dropTable('reviews');
}

