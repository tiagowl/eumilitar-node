import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    const existsUsers = await knex.schema.hasTable('users');
    const existsLoginSessions = await knex.schema.hasTable('login_sessions');
    if (existsUsers && existsLoginSessions) return;
    const createUsers = existsUsers ? knex.schema : knex.schema
        .createTable('users', (table) => {
            table.increments('user_id').primary().unsigned();
            table.string('first_name', 50).notNullable();
            table.string('last_name', 80).notNullable();
            table.string('email', 255).unique().notNullable();
            table.string('passwd', 255).notNullable();
            table.text('access_code').nullable().defaultTo(null);
            table.integer('status', 1).nullable().defaultTo(2).unsigned().comment('0 = conta inativa, 1 = conta ativa, 2 = conta pendente');
            table.integer('permission', 1).nullable().defaultTo(3).comment('1 = Administrador, 2 = Aluno ESA, 3 = Aluno EsPCEX');
            table.dateTime('date_created').notNullable().defaultTo(knex.fn.now());
            table.dateTime('date_modified').notNullable();
        });
    if (existsLoginSessions) return createUsers;
    const createLoginSessions = createUsers
        .createTable('login_sessions', (table) => {
            table.string('session_id', 255).primary();
            table.integer('user_id', 11).unsigned().references('user_id').inTable('users').onDelete('CASCADE');
            table.timestamp('login_time').notNullable().defaultTo(knex.fn.now());
        });
    return createLoginSessions;
}


export async function down(knex: Knex): Promise<void> {}

