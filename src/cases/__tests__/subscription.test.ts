import faker from "faker";
import Subscription, { SubscriptionInterface } from "../../entities/Subscription";
import { ProductRepositoryInterface } from "../ProductCase";
import SubscriptionCase, { SubscriptionInsertionInterface, SubscriptionRepositoryInterface } from "../SubscriptionCase";
import { UserRepositoryInterface } from "../UserCase";
import getDb from "./repositories/database";
import SubscriptionTestRepository from "./repositories/SubscriptionTestRepository";
import UserTestRepository from "./repositories/UserTestRepository";

const db = getDb();

describe('#7 Assinaturas', () => {
    const repository = new SubscriptionTestRepository(db);
    const useCase = new SubscriptionCase(repository);
    const users = new UserTestRepository(db);
    const email = faker.internet.email();
    test('Criação automática', async done => {
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
        const canceled = await useCase.cancel(1);
        expect(canceled).toBeInstanceOf(Subscription);
        expect(canceled.active).toBeFalsy();
        done();
    });
    test('Listagem', async done => {
        const subscriptions = await useCase.filter({ 'active': true });
        expect(subscriptions).toBeInstanceOf(Array);
        if (!(subscriptions instanceof Array)) throw new Error();
        subscriptions.forEach(subscription => {
            expect(subscription).toBeInstanceOf(Subscription);
        });
        done();
    });
    test('Criação manual', async done => {
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
        const chart = await useCase.activeChart({});
        expect(chart).toBeInstanceOf(Array);
        chart.forEach(item => {
            expect(item, JSON.stringify(chart)).toBeDefined();
            expect(typeof item.key).toBe('string');
            expect(typeof item.value).toBe('number');
        });
        done();
    });
    test('task 209 https://ubistart.atlassian.net/browse/EUMILIT-209?atlOrigin=eyJpIjoiNzAzZWQwNThhMTNhNDA5MmJiNzdkZjdlMDgzZjI4ZjgiLCJwIjoiaiJ9',
        async done => {
            const code = faker.datatype.number();
            const created = await useCase.autoCreate({
                email,
                firstName: faker.name.firstName(),
                lastName: faker.name.lastName(),
                phone: faker.phone.phoneNumber('###########'),
                product: 0,
                code,
            });
            expect(created instanceof Subscription).toBeTruthy();
            const canceled = await useCase.cancel(code);
            expect(canceled instanceof Subscription).toBeTruthy();
            const created2 = await useCase.autoCreate({
                email,
                firstName: faker.name.firstName(),
                lastName: faker.name.lastName(),
                phone: faker.phone.phoneNumber('###########'),
                product: 0,
                code: faker.datatype.number(),
            });
            expect(created2 instanceof Subscription).toBeTruthy();
            const user = await users.get({ email });
            if(!user) throw new Error();
            expect(user.status).toBe('active');
            done();
        })
});
