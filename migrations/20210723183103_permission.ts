import { Knex } from "knex";

const permissions = [2, 3, 4];
export async function up(knex: Knex): Promise<void> {
    await Promise.all(permissions.map(async (permission) => {
        const users = await knex('users')
            .where('permission', permission)
            .where('status', 1);
        const expiration = new Date(Date.now() + 360 * 24 * 60 * 60 * 1000);
        if (permission === 4) {
            const esa = await knex('products').where('course_tag', 2).first();
            const espcex = await knex('products').where('course_tag', 3).first();
            return Promise.all(users.map(async user => {
                const base = { expiration, user: user.user_id, };
                return knex('subscriptions').insert([
                    { ...base, product: esa.product_id, },
                    { ...base, product: espcex.product_id, },
                ]);
            }));
        } else {
            const product = await knex('products').where('course_tag', permission).first();
            return Promise.all(users.map(async user => {
                return knex('subscriptions').insert({
                    product: product.product_id,
                    expiration,
                    user: user.user_id,
                });
            }));
        }
    }));
    await knex('users')
        .whereIn('permission', permissions)
        .update('permission', 6);
}


export async function down(knex: Knex): Promise<void> {
    const users = await knex('users').where('permission', 6);
    await Promise.all(users.map(async user => {
        const subscriptions = await knex('subscriptions')
            .where('user', user.user_id).select('product');
        const permission = await subscriptions.reduce(async (current: Promise<number>, subscription) => {
            const value = await current;
            const product = await knex('products').where('product_id', subscription.product)
                .select('course_tag').first();
            if (value === 0 || value === product.course_tag) return product.course_tag;
            return 4;
        }, Promise.resolve(0));
        if (permission === 0) {
            return knex('users').where('user_id', user.user_id).update({ permission: 4, status: 0 });
        }
        return knex('users').where('user_id', user.user_id).update({ permission });
    }));
    await knex('subscriptions').truncate();
}

