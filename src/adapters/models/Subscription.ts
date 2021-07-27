import { Knex } from "knex";
import { ProductRepositoryInterface } from "../../cases/ProductCase";
import { SubscriptionInsertionInterface, SubscriptionRepositoryInterface } from "../../cases/Subscription";
import { UserRepositoryInterface } from "../../cases/UserUseCase";
import Subscription, { SubscriptionInterface } from "../../entities/Subscription";
import { Context } from "../interfaces";
import ProductRepository from "./Product";
import Repository from "./Repository";
import UserRepository from "./User";

export const SubscriptionService = (driver: Knex) => driver<SubscriptionInterface, SubscriptionInterface[]>('subscriptions');

export default class SubscriptionRepository extends Repository<SubscriptionInterface, SubscriptionInterface> implements SubscriptionRepositoryInterface {
    public users: UserRepositoryInterface;
    public products: ProductRepositoryInterface;

    constructor(context: Context) {
        const { logger, driver } = context;
        super([], logger, driver);
        this.users = new UserRepository(driver, logger);
        this.products = new ProductRepository(driver, logger);
    }

    get query() {
        return SubscriptionService(this.driver);
    }

    public async create(data: SubscriptionInsertionInterface) {
        const defaultError = { message: 'Erro ao salvar inscrição', status: 500 };
        const [id] = await this.query.insert(data).catch(error => {
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