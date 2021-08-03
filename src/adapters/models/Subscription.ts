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
        const [id] = await this.query.insert(parsed).catch(error => {
            this.logger.error(error);
            throw { message: 'Erro ao gravar no banco de dados', status: 500 };
        });
        if (typeof id !== 'number') throw defaultError;
        const created = await this.query.where('id', id).first().catch((error) => {
            this.logger.error(error);
            throw { message: 'Erro ao consultar banco de dados', status: 500 };
        });
        if (!created) throw defaultError;
        return new Subscription(created);
    }

    public async filter(filter: Partial<SubscriptionInterface>) {
        const subscriptions = await this.query.where(filter);
        return Promise.all(subscriptions.map(async data => new Subscription(data)));
    }
}