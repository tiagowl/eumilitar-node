import { Knex } from "knex";

const tableName = 'password_reset';

export async function up(knex: Knex): Promise<void> {
    return knex.schema.alterTable(tableName, (table) => {
        table.increments('id').primary(tableName);
        table.integer('user_id').unsigned()
            .references('user_id').inTable('users')
            .onDelete('CASCADE').onUpdate('CASCADE')
            .nullable();
        table.dropColumn('email');
    });
}


export async function down(knex: Knex): Promise<void> {
    const emailExits = await knex.schema.hasColumn(tableName, 'email');
    const idExits = await knex.schema.hasColumn(tableName, 'id');
    const userIdExits = await knex.schema.hasColumn(tableName, 'user_id');
    return knex.schema.alterTable(tableName, (table) => {
        if(userIdExits) {
            table.dropForeign('user_id');
            table.dropColumn('user_id');
        }
        if(idExits) {
            table.dropColumn('id');
        }
        if(!emailExits) table.string('email', 255).index().notNullable();
    });
}

