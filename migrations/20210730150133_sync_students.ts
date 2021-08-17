import { Knex } from "knex";
import axios, { AxiosResponse } from 'axios';
import { config } from 'dotenv';
import { resolve } from 'path';
import { SingleBar, Presets } from 'cli-progress';

config({ path: resolve(__dirname, '..') });

const apiToken = process.env.HOTMART_TOKEN;
const apiEnv = process.env.HOTMART_ENV as 'sandbox' || 'developers';

const onError = (error: any) => {
    console.error(error.response.data);
    throw error;
}

async function getAccessToken(): Promise<string> {
    console.info('Getting token');
    const url = `https://api-sec-vlc.hotmart.com/security/oauth/token`;
    const params = {
        grant_type: 'client_credentials',
        client_id: process.env.HOTMART_ID,
        client_secret: process.env.HORTMART_SECRET,
    };
    const headers = {
        'Authorization': `Basic ${apiToken}`,
        'Content-Type': 'application/json',
    };
    const { data } = await axios({
        url,
        headers,
        params,
        method: 'POST',
        maxRedirects: 20
    }).catch(onError);
    console.info('Token received');
    return data.access_token;
}

async function* getPages(): AsyncGenerator<any, void, unknown> {
    const token = await getAccessToken();
    const url = `https://${apiEnv}.hotmart.com/payments/api/v1/subscriptions`;
    const params = {
        max_results: 500,
        status: 'ACTIVE',
    };
    let nextPage: string | null = null;
    do {
        const response: AxiosResponse = await axios.get(url, {
            params: !!nextPage ? { ...params, page_token: nextPage } : params,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            }
        }).catch(onError);
        yield response.data;
        nextPage = response.data.page_info.next_page_token;
    } while (!!nextPage);
}

export async function up(knex: Knex): Promise<void> {
    try {
        await knex.schema.alterTable('subscriptions', table => {
            table.integer('hotmart_id').unsigned()
                .unique().nullable();
        });
        await knex.schema.alterTable('products', table => {
            table.bigInteger('expiration_time').defaultTo(360 * 24 * 60 * 60 * 1000)
                .notNullable().unsigned();
        });
        const pages = getPages();
        const trx = await knex.transaction();
        let pageNumber = 0;
        let pagesAmount = 0;
        for await (const page of pages) {
            pageNumber++;
            if(!pagesAmount) pagesAmount = Math.ceil(page.page_info.total_results / page.page_info.results_per_page);
            const subscriptions: any[] = page.items;
            const bar = new SingleBar({}, Presets.shades_classic);
            console.info(`Processando página ${pageNumber} de ${pagesAmount}`);
            bar.start(1 + subscriptions.length * 2, 0);
            const data = await Promise.all(subscriptions.map(async subscription => {
                const { subscriber } = subscription;
                const product = await knex('products').where('id_hotmart', subscription.product.id)
                    .select('course_tag', 'expiration_time').first();
                if (!product) return bar.increment();
                const user = await knex('users')
                    .where('status', 1)
                    .where('email', subscriber.email)
                    .select('user_id').first();
                if (!user) return bar.increment();
                bar.increment();
                return {
                    product: product?.course_tag || 1,
                    user: user?.user_id || 1,
                    expiration: new Date(subscription.accession_date + product.expiration_time),
                    registrationDate: new Date(),
                    hotmart_id: subscription.subscription_id,
                };
            }));
            const filteredData = data.filter((item) => {
                bar.increment();
                return !!item;
            });
            if (filteredData.length > 0) {
                await trx('subscriptions').insert(filteredData).onConflict('hotmart_id').ignore();
            }
            bar.increment();
            bar.stop();
        }
        await trx.commit();
    } catch (error) {
        await down(knex);
        throw error;
    }
}


export async function down(knex: Knex): Promise<void> {
    await knex('subscriptions').whereNot('hotmart_id', null).del();
    await knex.schema.alterTable('products', table => {
        table.dropColumn('expiration_time');
    });
    await knex.schema.alterTable('subscriptions', table => {
        table.dropColumn('hotmart_id');
    });
}

