import faker from "faker";
import qs from "qs";
import supertest from "supertest";
import { userFactory, db, saveUser, appFactory, hottok, jp, contextFactory } from "../../../tests/shortcuts";
import ProductRepository from "../../adapters/models/Product";
import SubscriptionRepository, { SubscriptionService } from "../../adapters/models/Subscription";
import UserRepository, { UserModel, UserService } from "../../adapters/models/User";
import Subscription from "../../entities/Subscription";
import { authenticate } from "./tools";

const context = contextFactory();

describe('#6 Inscrições', () => {
    const app = appFactory();
    const api = supertest(app.server);
    const email = 'teste.sandbox@hotmart.com';
    const student: UserModel = userFactory({ permission: 6 });
    const admin: UserModel = userFactory({ permission: 1 });
    const user = userFactory({ email });
    const userRepository = new UserRepository(context);
    const deleteAll = async (done: any) => {
        await userRepository.query.whereIn('email', [email]).del();
        done();
    };
    beforeAll(async (done) => {
        const service = () => UserService(db)
            .onConflict('user_id').merge();
        await saveUser(student, service());
        await saveUser(admin, service());
        await SubscriptionService(db).insert({
            user: student.user_id,
            hotmart_id: faker.datatype.number(),
            product: 2,
            expiration: faker.date.future(),
            registrationDate: new Date(),
            active: true,
            course_tag: 2,
        });
        await saveUser(user, UserService(db).onConflict('user_id').merge());
        await SubscriptionService(db).where('hotmart_id', 18).del();
        done();
    }, 100000);
    beforeAll(deleteAll);
    afterAll(deleteAll);
    test('#61 Criação', async done => {
        const productRepository = new ProductRepository(context);
        const product = await productRepository.get({ course: 'espcex' });
        const response = await api.post('/subscriptions/')
            .type('application/x-www-form-urlencoded')
            .send(qs.stringify({
                email,
                hottok,
                prod: product.id,
                callback_type: 1,
                aff: '',
                aff_name: '',
                currency: 'BRL',
                transaction: 'HP1121336654889',
                xcod: '',
                payment_type: 'credit_card',
                payment_engine: 'hotmart',
                status: 'approved',
                prod_name: 'Produto test postback2',
                producer_name: 'Producer Test Name',
                producer_document: 12345678965,
                producer_legal_nature: 'Pessoa Física',
                transaction_ext: 'HP11315117833431',
                purchase_date: '2017 - 11 - 27T11: 49: 04Z',
                confirmation_purchase_date: '2017 - 11 - 27T11: 49: 06Z',
                currency_code_from: 'BRL',
                currency_code_from_: 'BRL',
                original_offer_price: 1500.00,
                productOfferPaymentMode: 'pagamento_unico',
                warranty_date: '2017 - 12 - 27T00: 00: 00Z',
                receiver_type: 'SELLER',
                installments_number: 12,
                funnel: false,
                order_bump: false,
                cms_marketplace: 149.50,
                cms_vendor: 1350.50,
                off: 'test',
                price: 1500.00,
                full_price: 1500.00,
                subscriber_code: 'I9OT62C3',
                signature_status: 'active',
                subscription_status: 'active',
                name_subscription_plan: 'plano de teste',
                has_co_production: false,
                name: 'Teste Comprador',
                first_name: 'Teste',
                last_name: 'Comprador',
                phone_checkout_local_code: 999999999,
                phone_checkout_number: '00',
                phone_number: 99999999,
                phone_local_code: 55,
                sck: ''
            }));
        expect(response.body, jp(response.body)).toBeInstanceOf(Array);
        expect(response.body.length).toBeGreaterThan(0);
        const user = await userRepository.get({ id: response.body[0].user });
        expect(typeof user?.phone, JSON.stringify(user?.phone)).toBe('string');
        done();
    });
    test('#62 Cancelamento', async done => {
        await saveUser(user, UserService(db).onConflict('user_id').merge());
        const productRepository = new ProductRepository(context);
        const product = await productRepository.get({ course: 'espcex' });
        await SubscriptionService(db).where('hotmart_id', 18).del();
        const [inserted] = await SubscriptionService(db).insert({
            hotmart_id: 18,
            product: product.id,
            user: user.user_id,
            expiration: new Date(Date.now() + 10000),
            registrationDate: new Date(),
            active: true,
            course_tag: 2,
        });
        expect(inserted).toBeDefined();
        const selected = await SubscriptionService(db)
            .where('hotmart_id', 18).first();
        expect(selected).toBeDefined();
        const response = await api.post('/subscriptions/cancelation/')
            .type('application/json')
            .send({
                hottok,
                email,
                first_name: 'Teste',
                last_name: 'Comprador',
                prod: 0,
                status: 'canceled',
            });
        expect(response.status, jp(response.body)).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBeGreaterThan(0);
        response.body.forEach((item: any) => {
            expect(item.active).toBeFalsy();
        });
        done();
    });
    test('Listagem ', async done => {
        if (!student) throw new Error('Sem usuário');
        const header = await authenticate(student, api);
        const response = await api.get('/users/profile/subscriptions/')
            .set('Authorization', header);
        expect(response.status, jp(response.body)).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        done();
    });
    test('Listagem ', async done => {
        if (!admin) throw new Error('Sem usuário');
        const header = await authenticate(admin, api);
        const response = await api.get('/subscriptions/')
            .query({ pagination: { page: 1, pageSize: 10, ordering: 'id' } })
            .set('Authorization', header);
        expect(response.status, jp(response.body)).toBe(200);
        expect(response.body.page).toBeInstanceOf(Array);
        expect(response.body.page.length).toBe(10);
        done();
    });
    test('Filtragem', async done => {
        if (!admin) throw new Error('Sem usuário');
        const header = await authenticate(admin, api);
        const response = await api.get('/subscriptions/')
            .query({ user: student.user_id })
            .set('Authorization', header);
        expect(response.status, jp(response.body)).toBe(200);
        expect(response.body, jp(response.body)).toBeInstanceOf(Array);
        expect(response.body.length, jp(response.body)).toBeGreaterThan(0);
        response.body.forEach((item: any) => {
            expect(item.user).toBe(student.user_id);
        });
        done();
    });
    test('Criação manual', async done => {
        const productRepository = new ProductRepository(context);
        const product = await productRepository.get({ course: 'esa' });
        if (!admin) throw new Error('Sem usuário');
        const header = await authenticate(admin, api);
        const response = await api.get('/subscriptions/')
            .send({
                'expiration': new Date(Date.now() + 10000),
                'product': product.id,
                'user': user.user_id,
                'active': true,
            })
            .set('Authorization', header);
        expect(response.status, jp(response.body)).toBe(200);
        expect(response.body, jp(response.body)).toBeDefined();
        expect(response.body, jp(response.body)).not.toBeNull();
        done();
    });
    test('Atualização manual', async done => {
        const productRepository = new ProductRepository(context);
        const product = await productRepository.get({ course: 'espcex' });
        const subscriptionRepository = new SubscriptionRepository(context);
        const [selected] = await subscriptionRepository.filter({ course: 'esa' }) as Subscription[];
        if (!admin) throw new Error('Sem usuário');
        const header = await authenticate(admin, api);
        const response = await api.put(`/subscriptions/${selected.id}/`)
            .send({
                'expiration': new Date(Date.now() + 1000000),
                'product': product.id,
                'user': user.user_id,
                'active': true,
            })
            .set('Authorization', header);
        expect(response.status, jp(response.body)).toBe(200);
        expect(response.body, jp(response.body)).toBeDefined();
        expect(response.body.product, jp(response.body)).toBe(product.id);
        expect(response.body, jp(response.body)).not.toBeNull();
        done();
    });
    test('Gráfico de ativas', async done => {
        if (!admin) throw new Error('Sem usuário');
        const header = await authenticate(admin, api);
        const response = await api.get('/subscriptions/charts/actives/')
            .query({
                period: {
                    start: new Date(Date.now() - 2 * 12 * 30 * 24 * 60 * 60 * 1000),
                    end: new Date()
                }
            })
            .set('Authorization', header);
        expect(response.status, jp(response.body)).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBe(24);
        response.body.forEach((item: any) => {
            expect(item, JSON.stringify(response.body)).toBeDefined();
            expect(typeof item.key).toBe('string');
            expect(typeof item.value).toBe('number');
        });
        done();
    });
    test('Gráfico do tempo médio de correção', async done => {
        if (!admin) throw new Error('Sem usuário');
        const header = await authenticate(admin, api);
        const response = await api.get('/essays/charts/avg-correction-time/')
            .query({
                period: {
                    start: new Date(Date.now() - 2 * 12 * 30 * 24 * 60 * 60 * 1000),
                    end: new Date()
                }
            })
            .set('Authorization', header);
        expect(response.status, jp(response.body)).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBe(24);
        response.body.forEach((item: any) => {
            expect(item, JSON.stringify(response.body)).toBeDefined();
            expect(typeof item.key).toBe('string');
            expect(typeof item.value).toBe('number');
        });
        done();
    });
});