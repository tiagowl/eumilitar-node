import * as yup from 'yup';
import { Context } from '../interfaces';
import SubscriptionRepository, { HotmartSubscriptionFilter } from '../models/SubscriptionRepository';
import Controller, { paginationSchema } from './Controller';
import SubscriptionCase, { ChartFilter, SubscriptionCreation, SubscriptionFilter } from '../../cases/SubscriptionCase';
import Subscription, { SubscriptionInterface } from '../../entities/Subscription';
import CaseError, { Errors } from '../../cases/ErrorCase';
import ProductCase from '../../cases/ProductCase';
import Product from '../../entities/Product';
import { Filter, Paginated } from '../../cases/interfaces';

export interface OrderData {
    hottok: string;
    prod: number;
    first_name: string;
    last_name: string;
    email: string;
    status: string;
    phone_number: number;
    phone_local_code: number;
}

export interface CancelOrderData {
    hottok: string;
    prod: number;
    first_name: string;
    last_name: string;
    email: string;
    status: string;
}

export interface CancelData {
    hottok: string;
    subscriptionId: number;
    subscriberCode: string;
    cancellationDate: number;
    dateNextCharge: number;
    actualRecurrenceValue: number;
    userName: string;
    userEmail: string;
    productName: string;
    subscriptionPlanName: string;
}

const filterSchema = yup.object().shape({
    id: yup.number(),
    product: yup.number(),
    user: yup.number(),
    expiration: yup.date(),
    registrationDate: yup.date(),
    code: yup.number(),
    active: yup.boolean(),
    course: yup.string(),
    pagination: paginationSchema,
}).noUnknown();

const manualCreationSchema = yup.object().shape({
    user: yup.number().required('O campo "usuário" é obrigatório'),
    expiration: yup.date().required('O campo "expiração" é obrigatório'),
    product: yup.number().required('O campo "produto" é obrigatório'),
    code: yup.number().positive().nullable(true),
    active: yup.boolean().required('O campo "ativo" é obrigatório'),
});

const chartFilterSchema = yup.object().shape({
    product: yup.number(),
    user: yup.number(),
    expiration: yup.date(),
    registrationDate: yup.date(),
    course: yup.string(),
    period: yup.object({
        start: yup.date(),
        end: yup.date(),
    }),
});

function timeOut(val: number) {
    return new Promise((accept) => setTimeout(accept, val));
}

const getSchema = (hottok: string) => yup.object().shape({
    hottok: yup.string()
        .required('O campo "hottok" é obrigatório')
        .is([hottok], '"hottok" inválido'),
    prod: yup.number().required(),
    first_name: yup.string().required(),
    last_name: yup.string().required(),
    email: yup.string().required(),
    status: yup.string().required(),
    phone_number: yup.number().required(),
    phone_local_code: yup.number().required(),
});

const getCancelSchema = (hottok: string) => yup.object().shape({
    hottok: yup.string()
        .required('O campo "hottok" é obrigatório')
        .is([hottok], '"hottok" inválido'),
    prod: yup.number().required(),
    first_name: yup.string().required(),
    last_name: yup.string().required(),
    email: yup.string().required(),
    status: yup.string().required(),
});

export default class SubscriptionController extends Controller {
    private readonly repository: SubscriptionRepository;
    private readonly useCase: SubscriptionCase;

    constructor(context: Context) {
        super(context);
        this.repository = new SubscriptionRepository(context);
        this.useCase = new SubscriptionCase(this.repository);
    }

    private async parseEntity(entity: SubscriptionInterface) {
        return { ...entity, };
    }

    private async notifySupport(data: OrderData | CancelOrderData, error: any) {
        try {
            return this.context.smtp.sendMail({
                subject: 'Erro ao criar usuário',
                to: { email: this.context.settings.messageConfig.supportMail, name: 'Admin' },
                from: this.context.settings.messageConfig.sender,
                text: `${JSON.stringify({ data, error })}\n${error.stack || JSON.stringify(error)}`,
            });
        } catch (error: any) {
            this.logger.error(error);
            throw error;
        }
    }

    public sendErrorMail(error: any){
        [
            {name: "Edward Losque", email: "edward.losque@ubistart.com"},
            {name: "Malheiro", email: "suporte@eumilitar.com"}
        ].forEach(receiver => {
            this.repository.errorMail({name: receiver.name, email: receiver.email, erro: error});
        });
    }

    public async createFromHotmart(data: OrderData) {
        try {
            const { settings: { hotmart: { hottok } } } = this.context;
            const schema = getSchema(hottok);
            const validated = await this.validate<OrderData>(data, schema);
            const payload: HotmartSubscriptionFilter = {
                'subscriber_email': validated.email,
                'product_id': data.prod,
                'status': 'ACTIVE',
            };
            const subscriptions = this.repository.getSubscriptionsFromHotmart(payload);
            const createdList = [];
            for await (const subscription of subscriptions) {
                this.logger.info(JSON.stringify(subscription));
                const purchases = await this.repository.getPurchasesFromHotmart(subscription.subscriber_code);
                const purchase = purchases[purchases.length - 1];
                const created = await this.useCase.autoCreate({
                    email: validated.email,
                    firstName: validated.first_name,
                    lastName: validated.last_name,
                    product: validated.prod,
                    code: subscription.subscription_id,
                    phone: !!validated.phone_number ? `${validated.phone_local_code}${validated.phone_number}` : undefined,
                    approvedDate: purchase?.approved_date,
                });
                if (!!created) {
                    const parsed = await this.parseEntity(created);
                    createdList.push(parsed);
                } else this.logger.warn(`Inscrição não criada: ${JSON.stringify(subscription)}`);
            }
            return createdList;
        } catch (error: any) {
            this.logger.error(error, { data: error?.response?.body });
            this.notifySupport(data, error);
            throw {
                message: error.message,
                status: error.status || 400
            };
        }
    }

    public async cancel(data: CancelOrderData) {
        try {
            const schema = getCancelSchema(this.context.settings.hotmart.hottok);
            const validated = await this.validate(data, schema);
            const subscriptions = this.repository.getSubscriptionsFromHotmart({
                subscriber_email: validated.email,
                status: ['INACTIVE', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_SELLER', 'CANCELLED_BY_ADMIN'],
            });
            const canceledList = [];
            for await (const subscription of subscriptions) {
                const canceled = await this.useCase.cancel(subscription.subscription_id)
                    .catch(error => {
                        if (!(error instanceof CaseError && error.code === Errors.NOT_FOUND)) {
                            throw error;
                        }
                    });
                if (!!canceled) {
                    const parsed = await this.parseEntity(canceled);
                    canceledList.push(parsed);
                }
            }
            return canceledList;
        } catch (error: any) {
            this.logger.error(error);
            this.notifySupport(data, error);
            if (error.status) throw error;
            throw { message: 'Erro ao cancelar inscrição', status: 500 };
        }
    }

    public async mySubscriptions(userId: number) {
        try {
            await yup.number().required('É preciso informar o usuário')
                .positive().min(0).validate(userId);
            const subscriptions = (await this.useCase.filter({ user: userId })) as Subscription[];
            return Promise.all(subscriptions.map(async subscription => this.parseEntity(subscription)));
        } catch (error: any) {
            throw await this.processError(error);
        }
    }

    public async list(filter: Filter<SubscriptionInterface>) {
        try {
            const parsed = await this.castFilter<Filter<SubscriptionInterface>>(filter, filterSchema);
            const filtered = await this.useCase.filter(parsed);
            const productCase = new ProductCase(this.repository.products);
            const products = await productCase.list({}) as Product[];
            const isList = filtered instanceof Array;
            const page = await Promise.all((isList ? (filtered as Subscription[]) : (filtered as Paginated<Subscription>).page).map(async subscription => {
                const data = await this.parseEntity(subscription);
                const product = products.find(({ id }) => id === data.product);
                if (!product) throw { message: `Produto "${data.product}" não encontrado`, status: 500 };
                return { ...data, product: { ...product } };
            }));
            if (isList) return page;
            return {
                ...filtered,
                page,
            };
        } catch (error: any) {
            throw await this.processError(error);
        }
    }

    public async create(data: SubscriptionCreation) {
        try {
            const validated = await this.validate(data, manualCreationSchema);
            const created = await this.useCase.create(validated);
            return await this.parseEntity(created);
        } catch (error: any) {
            throw await this.processError(error);
        }
    }

    public async update(id: number, data: SubscriptionCreation) {
        try {
            const validated = await this.validate(data, manualCreationSchema);
            const updated = await this.useCase.update(id, validated);
            return await this.parseEntity(updated);
        } catch (error: any) {
            throw await this.processError(error);
        }
    }

    public async activeChart(filter: ChartFilter) {
        try {
            const parsed = await this.castFilter(filter, chartFilterSchema);
            const chart = await this.useCase.activeChart(parsed);
            return chart;
        } catch (error: any) {
            throw await this.processError(error);
        }
    }

    public async sync() {
        const usersGenerator = this.repository.users.getUnsyncUsers();
        let page = 1;
        for await (const users of usersGenerator) {
            this.logger.info(`[${new Date().toISOString()}]: Synchronizing ${users.length} users in page ${page}`);
            page++;
            await Promise.allSettled(users.map(async (user) => {
                try {
                    const payload: HotmartSubscriptionFilter = {
                        'subscriber_email': user.email,
                        'status': 'ACTIVE',
                    };
                    let createdList = 0;
                    const subscriptions = this.repository.getSubscriptionsFromHotmart(payload);
                    await this.repository.users.fixPermission(user.user_id);
                    listingSubscriptions: for await (const subscription of subscriptions) {
                        try {
                            const purchases = await this.repository.getPurchasesFromHotmart(subscription.subscriber_code);
                            const purchase = purchases[purchases.length - 1];
                            const created = await this.useCase.autoCreate({
                                email: user.email,
                                firstName: user.first_name,
                                lastName: user.last_name,
                                product: subscription.product.id,
                                code: subscription.subscription_id,
                                approvedDate: purchase?.approved_date,
                            });
                            if (!!created) {
                                createdList++;
                            } else this.logger.warn(`Inscrição não criada: ${JSON.stringify({ subscription })}`);
                        } catch (error: any) {
                            if (error instanceof CaseError) continue listingSubscriptions;
                            this.logger.error(`${JSON.stringify({ error: { message: error.message, stack: error.stack }, subscription })}`);
                        }
                    }
                    this.logger.info(`[${new Date().toISOString()}]: Synced ${createdList} subscriptions for user "${user.email} #${user.user_id}"`);
                } catch (error: any) {
                    this.logger.error(`[${new Date().toISOString()}]: Email: ${user.email} - ${JSON.stringify({ error })} ${error.stack}`);
                    await timeOut(3 * 60 * 1000);
                }
            }));
            await timeOut(1.5 * 60 * 1000);
        }
    }
}