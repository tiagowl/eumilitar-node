import * as yup from 'yup';
import { Context } from '../interfaces';
import SubscriptionRepository, { HotmartFilter, HotmartStatus } from '../models/Subscription';
import Controller from './Controller';
import SubscriptionCase from '../../cases/Subscription';
import { SubscriptionInterface } from '../../entities/Subscription';
import CaseError from '../../cases/Error';

export interface OrderData {
    hottok: string;
    prod: number;
    first_name: string;
    last_name: string;
    email: string;
    status: string;
}

export default class SubscriptionController extends Controller<OrderData> {
    private readonly repository: SubscriptionRepository;
    private readonly useCase: SubscriptionCase;

    constructor(context: Context) {
        const { settings: { hotmart: { hottok } } } = context;
        const schema = yup.object().shape({
            hottok: yup.string()
                .required('O campo "hottok" é obrigatório')
                .is([hottok], '"hottok" inválido'),
            prod: yup.number().required(),
            first_name: yup.string().required(),
            last_name: yup.string().required(),
            email: yup.string().required(),
            status: yup.string().required(),
        });
        super(context, schema);
        this.repository = new SubscriptionRepository(context);
        this.useCase = new SubscriptionCase(this.repository);
    }

    private async parseEntity(entity: SubscriptionInterface) {
        return {
            ...entity,
        };
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

    public async create(data: OrderData) {
        try {
            const validated = await this.validate<OrderData>(data);
            const payload: HotmartFilter = {
                'subscriber_email': validated.email,
                'status': 'ACTIVE',
            };
            const subscriptions = this.repository.getFromHotmart(payload);
            const createdList = [];
            for await (const subscription of subscriptions) {
                const created = await this.useCase.create({
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
        } catch (error) {
            this.logger.error(error, { data: error?.response?.body });
            await this.notifyAdmins(data, error);
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
                // tslint:disable-next-line
                console.log(JSON.stringify(subscription))
                const canceled = await this.useCase.cancel(subscription.subscription_id)
                    .catch(error => {
                        if (!(error instanceof CaseError && error.code === 'not_found')) {
                            throw error;
                        }
                    });
                if (!!canceled) {
                    const parsed = await this.parseEntity(canceled);
                    canceledList.push(parsed);
                }
            }
            return canceledList;
        } catch (error) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: 'Erro ao cancelar inscrição', status: 500 };
        }
    }

    public async mySubscriptions(userId: number) {
        try {
            await yup.number().required('É preciso informar o usuário')
                .positive().min(0).validate(userId);
            const subscriptions = await this.useCase.filter({ user: userId });
            return Promise.all(subscriptions.map(async subscription => this.parseEntity(subscription)));
        } catch (error) {
            this.logger.error(error);
            throw { message: error.message, status: error.status || 400 };
        }
    }
}