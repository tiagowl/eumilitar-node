import { Knex } from "knex";
import { ProductRepositoryInterface } from "../../cases/ProductCase";
import { SubscriptionFilter, SubscriptionInsertionInterface, SubscriptionRepositoryInterface } from "../../cases/Subscription";
import { UserRepositoryInterface } from "../../cases/UserUseCase";
import Subscription, { SubscriptionInterface } from "../../entities/Subscription";
import { Context } from "../interfaces";
import ProductRepository, { courseParser, courseTagParser } from "./Product";
import Repository, { FieldsMap } from "./Repository";
import UserRepository from "./User";

export const SubscriptionService = (driver: Knex) => driver<Partial<SubscriptionModel>, SubscriptionModel[]>('subscriptions');

export interface SubscriptionModel {
    hotmart_id: number;
    id: number;
    product: number;
    user: number;
    expiration: Date;
    registrationDate: Date;
    active: boolean;
    course_tag: 2 | 3;
}

type HotmartStatus = 'ACTIVE' | 'INACTIVE' | 'DELAYED' | 'CANCELLED_BY_CUSTOMER' | 'CANCELLED_BY_SELLER' | 'CANCELLED_BY_ADMIN' | 'STARTED' | 'OVERDUE';

export interface HotmartFilter {
    max_results?: number;
    product_id?: number;
    plan?: string[];
    status?: HotmartStatus;
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
    [['active', Boolean], ['active', Boolean]],
    [['course_tag', courseTagParser], ['course', courseParser]],
];

export default class SubscriptionRepository extends Repository<SubscriptionModel, SubscriptionInterface> implements SubscriptionRepositoryInterface {
    public readonly users: UserRepositoryInterface;
    public readonly products: ProductRepositoryInterface;

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
                const params: any = !!nextPage ? { ...filter, page_token: nextPage || '' } : filter;
                const response = await this.context.http.get(url, {
                    params,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`,
                    }
                });
                nextPage = response.data.page_info.next_page_token;
                if (!response.data?.items) return;
                yield* response.data.items;
            } while (!!nextPage);
        } catch (error) {
            this.logger.error(error);
            this.logger.error(error.response?.data);
            throw error;
        }
    }

    public async count(filter: SubscriptionFilter) {
        const { search, pagination, ...params } = filter;
        const parsed = await this.toDb(params);
        const counting = this.query;
        const [{ count }] = await counting.where(parsed).count({ count: '*' })
            .catch(error => {
                this.logger.error(error);
                throw { message: 'Erro ao consultar banco de dados', status: 500 };
            });
        return Number(count);
    }

    public async filter(filter: SubscriptionFilter) {
        const { search, pagination, ...params } = filter;
        const parsed = await this.toDb(params);
        const service = this.query;
        await this.paginate(service, pagination);
        const subscriptions = await service.where(parsed)
            .catch(error => {
                this.logger.error(error);
                throw { message: 'Erro ao consultar banco de dados', status: 500 };
            });
        const page = await Promise.all(subscriptions.map(async data => {
            const parsedData = await this.toEntity(data);
            return new Subscription(parsedData);
        }));
        return page;
    }


    public async update(id: number, data: Partial<SubscriptionInterface>) {
        const parsed = await this.toDb(data);
        const updated = await this.query.where('id', id)
            .update(parsed).catch(error => {
                this.logger.error(error);
                throw { message: 'Erro ao gravar no banco de dados', status: 500 };
            });
        if (updated === 0) throw { message: 'Nenhuma inscrição afetada', status: 500 };
        if (updated > 1) throw { message: 'Mais de um registro afetado', status: 500 };
        const subscriptionData = await this.query.where('id', id)
            .first().catch(error => {
                this.logger.error(error);
                throw { message: 'Erro ao ler banco de dados', status: 500 };
            });
        if (!subscriptionData) throw { message: 'Erro ao ler banco de dados', status: 500 };
        const parsedData = await this.toEntity(subscriptionData);
        return new Subscription(parsedData);
    }
}