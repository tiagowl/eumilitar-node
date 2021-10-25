import * as yup from 'yup';
import { Context } from '../interfaces';
import SubscriptionRepository, { HotmartFilter } from '../models/Subscription';
import Controller, { paginationSchema } from './Controller';
import SubscriptionCase, { ChartFilter, SubscriptionCreation, SubscriptionFilter } from '../../cases/Subscription';
import Subscription, { SubscriptionInterface } from '../../entities/Subscription';
import CaseError, { Errors } from '../../cases/Error';
import ProductCase from '../../cases/Product';
import Product from '../../entities/Product';
import { Paginated } from '../../cases/interfaces';

export interface OrderData {
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

const getSchema = (hottok: string) => yup.object().shape({
    hottok: yup.string()
        .required('O campo "hottok" é obrigatório')
        .is([hottok], '"hottok" inválido'),
    prod: yup.number().required(),
    first_name: yup.string().required(),
    last_name: yup.string().required(),
    email: yup.string().required(),
    status: yup.string().required(),
});

export default class SubscriptionController extends Controller<OrderData> {
    private readonly repository: SubscriptionRepository;
    private readonly useCase: SubscriptionCase;

    constructor(context: Context) {
        const { settings: { hotmart: { hottok } } } = context;
        const schema = getSchema(hottok);
        super(context, schema);
        this.repository = new SubscriptionRepository(context);
        this.useCase = new SubscriptionCase(this.repository);
    }

    private async parseEntity(entity: SubscriptionInterface) {
        return { ...entity, };
    }

    private async writeNotification(data: OrderData, error: any) {
        return `${JSON.stringify(data)}\n${error.stack || JSON.stringify(error)}`;
    }

    private async notifyAdmins(data: OrderData, error: any) {
        return this.context.smtp.sendMail({
            subject: 'Erro ao criar usuário',
            to: { email: this.context.settings.messageConfig.adminMail, name: 'Admin' },
            from: this.context.settings.messageConfig.sender,
            text: await this.writeNotification(data, error),
        });
    }

    public async createFromHotmart(data: OrderData) {
        try {
            const validated = await this.validate<OrderData>(data);
            const payload: HotmartFilter = {
                'subscriber_email': validated.email,
                'product_id': data.prod,
                'status': 'ACTIVE',
            };
            const subscriptions = this.repository.getFromHotmart(payload);
            const createdList = [];
            for await (const subscription of subscriptions) {
                const created = await this.useCase.autoCreate({
                    email: validated.email,
                    firstName: validated.first_name,
                    lastName: validated.last_name,
                    product: validated.prod,
                    code: subscription.subscription_id,
                });
                if (!!created) {
                    const parsed = await this.parseEntity(created);
                    createdList.push(parsed);
                }
            }
            return createdList;
        } catch (error: any) {
            this.logger.error(error, { data: error?.response?.body });
            this.notifyAdmins(data, error).catch(this.logger.error);
            throw {
                message: error.message,
                status: error.status || 400
            };
        }
    }

    public async cancel(data: OrderData) {
        try {
            const validated = await this.validate(data);
            const subscriptions = this.repository.getFromHotmart({
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
            this.notifyAdmins(data, error).catch(this.logger.error);
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
            this.logger.error(error);
            throw { message: error.message, status: error.status || 400 };
        }
    }

    public async list(filter: SubscriptionFilter) {
        try {
            const parsed = await this.castFilter<SubscriptionFilter>(filter, filterSchema);
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
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: error.message, status: 500 };
        }
    }

    public async create(data: SubscriptionCreation) {
        try {
            const validated = await this.validate(data, manualCreationSchema);
            const created = await this.useCase.create(validated);
            return this.parseEntity(created);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: error.message, status: 500 };
        }
    }

    public async update(id: number, data: SubscriptionCreation) {
        try {
            const validated = await this.validate(data, manualCreationSchema);
            const updated = await this.useCase.update(id, validated);
            return this.parseEntity(updated);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: error.message, status: 500 };
        }
    }

    public async activeChart(filter: ChartFilter) {
        try {
            const parsed = await this.castFilter(filter, chartFilterSchema);
            const chart = await this.useCase.activeChart(parsed);
            return chart;
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: error.message, status: 500 };
        }
    }


    public async sync() {
        const users = await this.repository.users.getUnsyncUsers();
        this.logger.info(`Synchronizing ${users.length} users`);
        const synced = await Promise.all(users.map(async (user, index) => {
            this.logger.info(`User ${index + 1} of ${users.length} users`);
            const payload: HotmartFilter = {
                'subscriber_email': user.email,
                'status': 'ACTIVE',
            };
            const createdList = [];
            const subscriptions = this.repository.getFromHotmart(payload);
            await this.repository.users.fixPermission(user.user_id);
            for await (const subscription of subscriptions) {
                const created = await this.useCase.autoCreate({
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    product: subscription.product.id,
                    code: subscription.subscription_id,
                });
                if (!!created) {
                    const parsed = await this.parseEntity(created);
                    createdList.push(parsed);
                }
            }
            this.logger.info(`Synced ${createdList.length} subscriptions for user "${user.email}"`);
            return createdList;
        }));
        return synced.flat().filter(item => !!item);
    }
}