import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    const existsProducts = await knex.schema.hasTable('products');
    if (existsProducts) {
        return knex.schema.alterTable('products', (table) => {
            table.string('status', 11).defaultTo("active");
        });
    }
}


export async function down(knex: Knex): Promise<void> {
    const existsProducts = await knex.schema.hasTable('products');
    if (existsProducts) {
        return knex.schema.alterTable('products', (table) => {
            table.dropColumn('status');
        });
    }
}

