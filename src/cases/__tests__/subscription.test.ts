import faker from "faker";
import Subscription, { SubscriptionInterface } from "../../entities/Subscription";
import { ProductRepositoryInterface } from "../Product";
import SubscriptionCase, { SubscriptionInsertionInterface, SubscriptionRepositoryInterface } from "../Subscription";
import { UserRepositoryInterface } from "../User";
import getDb from "./database";
import { ProductTestRepository } from "./product.test";
import { UserTestRepository } from "./user.test";

const db = getDb();

export class SubscriptionTestRepository implements SubscriptionRepositoryInterface {
    private database: Subscription[];
    public users: UserRepositoryInterface;
    public products: ProductRepositoryInterface;

    constructor() {
        this.database = db.subscriptions;
        this.users = new UserTestRepository();
        this.products = new ProductTestRepository();
    }

    public async create(data: SubscriptionInsertionInterface) {
        const subscription = new Subscription({
            id: this.database.length,
            ...data,
        });
        this.database.push(subscription);
        return subscription;
    }

    public async filter(filter: Partial<SubscriptionInsertionInterface>) {
        const fields = Object.entries(filter) as [keyof SubscriptionInsertionInterface, number | Date][];
        if (!fields.length) return this.database;
        return this.database.filter(item => (
            !!fields.filter(([key, value]) => item[key] === value).length
        ));
    }

    public async update(id: number, data: Partial<SubscriptionInterface>) {
        let subscription: Subscription;
        this.database = this.database.map((item) => {
            if (item.id === id) {
                Object.assign(item, data);
                subscription = item;
            }
            return item;
        });
        // @ts-ignore
        return subscription;
    }

    public async count(filter: Partial<SubscriptionInsertionInterface>) {
        const data = await this.filter(filter);
        return data.length;
    }
}


describe('#7 Assinaturas', () => {
    test('Criação automática', async done => {
        const repository = new SubscriptionTestRepository();
        const useCase = new SubscriptionCase(repository);
        const subscription = await useCase.autoCreate({
            email: faker.internet.email(),
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            product: 10,
            code: faker.datatype.number(),
        });
        expect(subscription).toBeInstanceOf(Subscription);
        done();
    });
    test('Cancelamento', async done => {
        const repository = new SubscriptionTestRepository();
        const useCase = new SubscriptionCase(repository);
        const canceled = await useCase.cancel(1);
        expect(canceled).toBeInstanceOf(Subscription);
        expect(canceled.active).toBeFalsy();
        done();
    });
    test('Listagem', async done => {
        const repository = new SubscriptionTestRepository();
        const useCase = new SubscriptionCase(repository);
        const subscriptions = await useCase.filter({ 'active': true });
        expect(subscriptions).toBeInstanceOf(Array);
        if (!(subscriptions instanceof Array)) throw new Error();
        subscriptions.forEach(subscription => {
            expect(subscription).toBeInstanceOf(Subscription);
        });
        done();
    });
    test('Criação manual', async done => {
        const repository = new SubscriptionTestRepository();
        const useCase = new SubscriptionCase(repository);
        const subscription = await useCase.create({
            product: 1,
            code: faker.datatype.number(),
            user: 0,
            expiration: new Date(Date.now() + 1000),
            active: true,
        });
        expect(subscription).toBeInstanceOf(Subscription);
        done();
    });
    test('Atualização manual', async done => {
        const repository = new SubscriptionTestRepository();
        const useCase = new SubscriptionCase(repository);
        const subscription = await useCase.update(0, {
            product: 1,
            code: faker.datatype.number(),
            user: 0,
            expiration: new Date(Date.now() + 1000),
            active: true,
        });
        expect(subscription).toBeInstanceOf(Subscription);
        done();
    });
    test('Gráfico ativos', async done => {
        const repository = new SubscriptionTestRepository();
        const useCase = new SubscriptionCase(repository);
        const chart = await useCase.activeChart({});
        expect(chart).toBeInstanceOf(Array);
        chart.forEach(item => {
            expect(item, JSON.stringify(chart)).toBeDefined();
            expect(typeof item.key).toBe('string');
            expect(typeof item.value).toBe('number');
        });
        done();
    });
});
