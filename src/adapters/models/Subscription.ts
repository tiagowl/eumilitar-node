import { Knex } from "knex";
import { ProductRepositoryInterface } from "../../cases/ProductCase";
import { SubscriptionInsertionInterface, SubscriptionRepositoryInterface } from "../../cases/Subscription";
import { UserRepositoryInterface } from "../../cases/UserUseCase";
import Subscription, { SubscriptionInterface } from "../../entities/Subscription";
import { Context } from "../interfaces";
import ProductRepository from "./Product";
import Repository, { FieldsMap } from "./Repository";
import UserRepository from "./User";

export const SubscriptionService = (driver: Knex) => driver<Partial<SubscriptionModel>, SubscriptionModel[]>('subscriptions');

export interface SubscriptionModel extends SubscriptionInterface {
    hotmart_id: number;
}

type HotmartStatus = 'ACTIVE' | 'INACTIVE' | 'DELAYED' | 'CANCELLED_BY_CUSTOMER' | 'CANCELLED_BY_SELLER' | 'CANCELLED_BY_ADMIN' | 'STARTED' | 'OVERDUE';

export interface HotmartFilter {
    max_results?: number;
    product_id?: number;
    plan?: string[];
    status?: HotmartStatus;
    transaction?: string;
    subscriber_email?: string;
}

export interface HotmartSubscription {
    "subscriber_code": string;
    "subscription_id": number;
    "status": HotmartStatus;
    "accession_date": number;
    "request_date": number;
    "trial": boolean;
    "plan": {
        "name": string
    };
    "product": {
        "id": number;
        "name": string;
        "ucode": string
    };
    "price": {
        "value": number;
        "currency_code": string
    };
    "subscriber": {
        "name": string;
        "email": string;
        "ucode": string
    };
}

const fieldsMap: FieldsMap<SubscriptionModel, SubscriptionInterface> = [
    [['user', Number], ['user', Number]],
    [['expiration', val => new Date(val)], ['expiration', val => new Date(val)]],
    [['id', Number], ['id', Number]],
    [['hotmart_id', Number], ['code', Number]],
    [['product', Number], ['product', Number]],
    [['registrationDate', val => new Date(val)], ['registrationDate', val => new Date(val)]],
];

export default class SubscriptionRepository extends Repository<SubscriptionModel, SubscriptionInterface> implements SubscriptionRepositoryInterface {
    public users: UserRepositoryInterface;
    public products: ProductRepositoryInterface;

    constructor(context: Context) {
        super(fieldsMap, context, SubscriptionService);
        this.users = new UserRepository(context);
        this.products = new ProductRepository(context);
    }

    public async create(data: SubscriptionInsertionInterface) {
        const parsed = await this.toDb(data);
        const defaultError = { message: 'Erro ao salvar inscrição', status: 500 };
        const [id] = await this.query.insert(parsed)
            .onConflict('hotmart_id').ignore()
            .catch(error => {
                this.logger.error(error);
                throw { message: 'Erro ao gravar no banco de dados', status: 500 };
            });
        if (typeof id !== 'number') throw defaultError;
        const created = await this.query.where('id', id)
            .first().catch((error) => {
                this.logger.error(error);
                throw { message: 'Erro ao consultar banco de dados', status: 500 };
            });
        if (!created) throw defaultError;
        return new Subscription(await this.toEntity(created));
    }

    public async *getFromHotmart(filter: HotmartFilter): AsyncGenerator<HotmartSubscription> {
        try {
            const authToken = await this.authHotmart();
            const url = `https://${this.context.settings.hotmart.env}.hotmart.com/payments/api/v1/subscriptions`;
            let nextPage;
            do {
                const params: any = { ...filter, page_token: nextPage || '' };
                const response = await this.context.http.get(url, {
                    params,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`,
                    }
                });
                nextPage = response.data.page_info.next_page_token;
                if (!response.data?.items) return;
                for (const item of response.data.items) {
                    yield item;
                }
            } while (!!nextPage);
        } catch (error) {
            this.logger.error(error);
            this.logger.error(error.response?.data);
            throw error;
        }
    }

    public async filter(filter: Partial<SubscriptionInterface>) {
        const parsed = await this.toDb(filter);
        const subscriptions = await this.query.where(parsed);
        return Promise.all(subscriptions.map(async data => {
            const parsedData = await this.toEntity(data);
            return new Subscription(parsedData);
        }));
    }
}