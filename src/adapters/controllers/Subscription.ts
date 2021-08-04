import * as yup from 'yup';
import { Context } from '../interfaces';
import SubscriptionRepository from '../models/Subscription';
import Controller from './Controller';
import SubscriptionCase from '../../cases/Subscription';
import { SubscriptionInterface } from '../../entities/Subscription';

export interface OrderData {
    hottok: string;
    prod: number;
    first_name: string;
    last_name: string;
    email: string;
    status: string;
    transaction: string;
}

export default class SubscriptionController extends Controller<OrderData> {
    private repository: SubscriptionRepository;
    private useCase: SubscriptionCase;

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
        this.repository = new SubscriptionRepository(context);
        this.useCase = new SubscriptionCase(this.repository);
    }

    private async parseEntity(entity: SubscriptionInterface) {
        return {
            ...entity,
        };
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
            throw {
                message: error.message,
                status: error.status || 400
            };
        }
    }
}