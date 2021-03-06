import { Knex } from "knex";
import { ProductRepositoryInterface } from "../../cases/ProductCase";
import { SubscriptionFilter, SubscriptionInsertionInterface, SubscriptionRepositoryInterface } from "../../cases/SubscriptionCase";
import { UserRepositoryInterface } from "../../cases/UserCase";
import Subscription, { SubscriptionInterface } from "../../entities/Subscription";
import { Context } from "../interfaces";
import ProductRepository, { courseParser, courseTagParser } from "./ProductRepository";
import Repository, { FieldsMap } from "./Repository";
import UserRepository from "./UserRepository";
import qs from 'querystring';

export const SubscriptionService = (db: Knex) => db<Partial<SubscriptionModel>, SubscriptionModel[]>('subscriptions');

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

interface EmailErrorReceivers {
    name: string;
    email: string;
    erro: any;
}

export type HotmartStatus = 'ACTIVE' | 'INACTIVE' | 'DELAYED' | 'CANCELLED_BY_CUSTOMER' | 'CANCELLED_BY_SELLER' | 'CANCELLED_BY_ADMIN' | 'STARTED' | 'OVERDUE';

export interface HotmartSubscriptionFilter {
    max_results?: number | number[];
    product_id?: number | number[];
    plan?: string | string[];
    status?: HotmartStatus | HotmartStatus[];
    subscriber_email?: string | string[];
}

export interface HotmartSalesFilter {
    max_results?: number | number[];
    product_id?: number | number[];
    plan?: string | string[];
    status?: HotmartStatus | HotmartStatus[];
    subscriber_email?: string | string[];
    transaction?: string | string[];
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

export interface HotmartPurchase {
    "transaction": string;
    "approved_date": number;
    "payment_engine": string;
    "status": string;
    "price": {
        "value": number;
        "currency_code": string
    };
    "payment_type": string;
    "payment_method": string;
    "recurrency_number": number;
    "under_warranty": boolean;
    "purchase_subscription": boolean;
}

const parseCode = (code?: number | null | string) => (!!code || code === 0) ? Number(code) : null;

const fieldsMap: FieldsMap<SubscriptionModel, SubscriptionInterface> = [
    [['user', Number], ['user', Number]],
    [['expiration', val => new Date(val)], ['expiration', val => new Date(val)]],
    [['id', Number], ['id', Number]],
    [['hotmart_id', parseCode], ['code', parseCode]],
    [['product', Number], ['product', Number]],
    [['registrationDate', val => new Date(val)], ['registrationDate', val => new Date(val)]],
    [['active', Boolean], ['active', Boolean]],
    [['course_tag', courseTagParser], ['course', courseParser]],
];

export default class SubscriptionRepository extends Repository<SubscriptionModel, SubscriptionInterface, Subscription> implements SubscriptionRepositoryInterface {
    public readonly users: UserRepository;
    public readonly products: ProductRepositoryInterface;
    protected readonly fieldsMap;
    protected readonly service;
    protected readonly entity;
    protected readonly searchFields = [];

    constructor(context: Context) {
        super(context);
        this.users = new UserRepository(context);
        this.products = new ProductRepository(context);
        this.service = SubscriptionService;
        this.entity = Subscription;
        this.fieldsMap = fieldsMap;
    }

    public async create(data: SubscriptionInsertionInterface, acceptDuplicate: boolean = false) {
        const parsed = await this.toDb(data);
        const defaultError = { message: 'Erro ao salvar inscri????o', status: 500 };
        const [id] = await this.query.insert(parsed)
            .catch(error => {
                this.logger.error(error);
                if (error.code === 'ER_DUP_ENTRY') {
                    if (!acceptDuplicate) throw {
                        message: `C??digo '${parsed.hotmart_id}' j?? est?? atribuido a outra assinatura`,
                        status: 400,
                    };
                    return [];
                }
                throw { message: 'Erro ao gravar no banco de dados', status: 500 };
            });
        if (typeof id !== 'number' && !acceptDuplicate) throw defaultError;
        const created = await ((acceptDuplicate && !id) ? this.query.where('hotmart_id', parsed.hotmart_id) : this.query.where('id', id))
            .first().catch((error) => {
                this.logger.error(error);
                throw { message: 'Erro ao consultar inscri????o no banco de dados', status: 500 };
            });
        if (!created) throw defaultError;
        return await this.toEntity(created);
    }

    public async *getSubscriptionsFromHotmart(filter: HotmartSubscriptionFilter): AsyncGenerator<HotmartSubscription> {
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
                    },
                    paramsSerializer: qs.stringify,
                });
                nextPage = response.data.page_info.next_page_token;
                if (!response.data?.items) return;
                yield* response.data.items;
            } while (!!nextPage);
        } catch (error: any) {
            this.logger.error({ message: error.message, stack: error.stack });
            this.logger.error(error.response?.data);
            throw { message: 'Erro ao recuperar inscri????es da Hotmart', status: 500 };
        }
    }

    public errorMail(receiver: EmailErrorReceivers) {
        try {
            this.context.smtp.sendMail({
                from: this.context.settings.messageConfig.sender,
                subject: 'Erro na inscri????o do usu??rio',
                to: { email: receiver.email, name: receiver.name },
                text: receiver.erro
            });
        } catch (error) {
            throw { message: 'Erro ao enviar email para administradores.', status: 500 };
        }
    }

    public async getPurchasesFromHotmart(subscriberCode: string): Promise<HotmartPurchase[]> {
        try {
            const authToken = await this.authHotmart();
            const url = `https://${this.context.settings.hotmart.env}.hotmart.com/payments/api/v1/subscriptions/${subscriberCode}/purchases`;
            const response = await this.context.http.get(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                paramsSerializer: qs.stringify,
            });
            return response.data;
        } catch (error: any) {
            throw this.processError({ message: error.message, stack: error.stack });
        }
    }

    public async count(filter: SubscriptionFilter) {
        const { search, pagination, ...params } = filter;
        const parsed = await this.toDb(params);
        const counting = this.query;
        const [{ count }] = await counting.where(parsed).count({ count: '*' })
            .catch(error => {
                this.logger.error(error);
                throw { message: 'Erro ao consultar inscri????es no banco de dados', status: 500 };
            });
        return Number(count);
    }

    public async update(id: number, data: Partial<SubscriptionInterface>) {
        const parsed = await this.toDb(data);
        const updated = await this.query.where('id', id)
            .update(parsed).catch(error => {
                this.logger.error(error);
                throw { message: 'Erro ao gravar no banco de dados', status: 500 };
            });
        if (updated === 0) throw { message: 'Nenhuma inscri????o afetada', status: 500 };
        if (updated > 1) throw { message: 'Mais de um registro afetado', status: 500 };
        const subscriptionData = await this.query.where('id', id)
            .first().catch(error => {
                this.logger.error(error);
                throw { message: 'Erro ao ler banco de dados', status: 500 };
            });
        if (!subscriptionData) throw { message: 'Erro ao ler banco de dados', status: 500 };
        return await this.toEntity(subscriptionData);
    }

}