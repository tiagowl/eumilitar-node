import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('subscriptions', table => {
        table.increments('id').index()
            .primary().notNullable().unique();
        table.integer('product', 11)
            .references('product_id').inTable('products')
            .onDelete('CASCADE').onUpdate('CASCADE')
            .notNullable();
        table.integer('user', 11).unsigned()
            .references('user_id').inTable('users')
            .onDelete('CASCADE').onUpdate('CASCADE')
            .notNullable();
        table.dateTime('expiration').notNullable();
        table.dateTime('registrationDate')
            .defaultTo(knex.fn.now())
            .notNullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('subscriptions');
}

