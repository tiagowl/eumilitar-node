import { Knex } from "knex";

const tableName = 'users';

const fullPermissions = ["SEE_USERS", "UPDATE_STUDENTS", "CREATE_STUDENTS", "CREATE_USERS", "CREATE_SINGLE_ESSAY", "UPDATE_USER_PASSWORD", "SEE_DASHBOARD", "MANAGE_THEMES", "MANAGE_PRODUCTS", "SEE_ESSAYS", "CORRECT_ESSAYS", "UPDATE_SETTINGS"];

export async function up(knex: Knex): Promise<void> {
    try {
        await knex.schema.alterTable(tableName, table => {
            table.string('permissions', 500).nullable();
            table.string('email', 255).unique().notNullable().index().alter();
        });
        await knex('users').where('permission', 1)
            .update('permissions', JSON.stringify(fullPermissions));
    } catch (error: any) {
        console.error(error);
        await down(knex);
        throw error;
    }
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable(tableName, table => {
        table.dropIndex('email')
        table.dropUnique(['email']);
    });
    if (!await knex.schema.hasColumn(tableName, 'permissions')) return;
    await knex.schema.alterTable(tableName, table => {
        table.dropColumn('permissions');
    });
}

