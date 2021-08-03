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
    transaction: number;
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
            transaction: yup.number().required(),
        });
        super(context, schema);
        this.repository = new SubscriptionRepository(context);
        this.useCase = new SubscriptionCase(this.repository);
    }

    private async parseEntity(entity: SubscriptionInterface) {
        return entity;
    }

    public async create(data: OrderData) {
        try {
            const validated = await this.validate<OrderData>(data);
            const created = await this.useCase.create({
                email: validated.email,
                firstName: validated.first_name,
                lastName: validated.last_name,
                product: validated.prod,
                code: validated.transaction,
                expiration: new Date(),
            });
            return this.parseEntity(created);
        } catch (error) {
            this.logger.error(error);
            throw { message: error.message, status: error.status || 400 };
        }
    }
}