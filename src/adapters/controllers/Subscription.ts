import * as yup from 'yup';
import { Context } from '../interfaces';
import SubscriptionRepository from '../models/Subscription';
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
    transaction: string;
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

export default class SubscriptionController extends Controller<OrderData> {
    private readonly repository: SubscriptionRepository;
    private readonly useCase: SubscriptionCase;
    private readonly cancelSchema: yup.ObjectSchema<any>;

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
            transaction: yup.string().required(),
        });
        super(context, schema);
        this.cancelSchema = yup.object({
            hottok: yup.string().required('O campo "hottok" é obrigatório').is([hottok], '"hottok" inválido'),
            subscriptionId: yup.number().required('O campo "subscriptionId" é obrigatório'),
            subscriberCode: yup.string().required('O campo "subscriberCode" é obrigatório'),
            cancellationDate: yup.number().required('O campo "cancellationDate" é obrigatório'),
            dateNextCharge: yup.number().required('O campo "dateNextCharge" é obrigatório'),
            actualRecurrenceValue: yup.number().required('O campo "actualRecurrenceValue" é obrigatório'),
            userName: yup.string().required('O campo "userName" é obrigatório'),
            userEmail: yup.string().required('O campo "userEmail" é obrigatório'),
            productName: yup.string().required('O campo "productName" é obrigatório'),
            subscriptionPlanName: yup.string().required('O campo "subscriptionPlanName" é obrigatório'),
        });
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
            const subscriptions = this.repository.getFromHotmart({
                'subscriber_email': validated.email,
                'transaction': validated.transaction,
                'status': 'ACTIVE',
            });
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

    public async cancel(data: CancelData) {
        try {
            const validated = await this.validate(data, this.cancelSchema);
            const subscription = await this.useCase.cancel(validated.subscriptionId);
            return this.parseEntity(subscription);
        } catch (error) {
            this.logger.error(error);
            if (error instanceof CaseError && error.code === 'not_found') {
                throw { message: 'Inscrição inexistente', status: 202 };
            }
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