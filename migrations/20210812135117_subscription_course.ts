import { Knex } from "knex";

const courses = [2, 3];

export async function up(knex: Knex): Promise<void> {
    try {
        await knex.schema.alterTable('subscriptions', table => {
            table.integer('course_tag', 1).notNullable().defaultTo(0);
        });
        await Promise.all(courses.map(async course => {
            await knex('subscriptions')
                .whereIn('product', knex('products').where('course_tag', course).select('product_id'))
                .update('course_tag', course);
        }));
    } catch (error) {
        await down(knex);
        throw error;
    }
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('subscriptions', table => {
        table.dropColumn('course_tag');
    });
}

