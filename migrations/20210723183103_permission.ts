import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex('users')
        .whereIn('permission', [2, 3, 4])
        .update('permission', 6);
}


export async function down(knex: Knex): Promise<void> {
    const subQuery = knex('subscriptions').where('product');
    await knex('users').where('permission', 6)
        .whereIn('user_id', subQuery)
}

