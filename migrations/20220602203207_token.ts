import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    const existsUsers = await knex.schema.hasTable('users');
    if (existsUsers) {
        return knex.schema.alterTable('users', (table) => {
            table.string('avatar_url', 255).defaultTo(null);
        });
    }

}


export async function down(knex: Knex): Promise<void> {
    const existsUsers = await knex.schema.hasTable('users');
    if (existsUsers) {
        return knex.schema.alterTable('users', (table) => {
            table.dropColumn('avatar_url');
        });
    }
}

