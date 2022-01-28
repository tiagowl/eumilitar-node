import faker from "faker";
import { userFactory, db, saveUser, hottok, mails, contextFactory } from "../../../tests/shortcuts";
import { Paginated } from "../../cases/interfaces";
import SubscriptionController from "../controllers/SubscriptionController";
import ProductRepository from "../models/ProductRepository";
import { SubscriptionService } from "../models/SubscriptionRepository";
import { UserService } from "../models/UserRepository";
import SubscriptionCase from "../../cases/SubscriptionCase";
import SubscriptionRepository from "../models/SubscriptionRepository";

const context = contextFactory();

describe('#8 Inscrições', () => {
    const email = 'teste.sandbox@hotmart.com';
    const user = userFactory({ email });
    const deleteAll = async (done: any) => {
        await UserService(db).where('email', email).del();
        done();
    };
    afterAll(deleteAll);
    beforeAll(deleteAll);
    const controller = new SubscriptionController(context);
    beforeAll(async done => {
        const productRepository = new ProductRepository(context);
        const product = await productRepository.get({ course: 'espcex' });
        await saveUser(user, UserService(db).onConflict().merge());
        await SubscriptionService(db).insert({
            hotmart_id: faker.datatype.number(),
            product: product.id,
            user: user.user_id,
            expiration: new Date(Date.now() + 10000),
            registrationDate: new Date(),
            active: true,
            course_tag: 2,
        }).onConflict('hotmart_id').merge();
        done();
    }, 10000);
    test('#81 Criação', async done => {
        const created = await controller.createFromHotmart({
            hottok, email,
            'first_name': faker.name.firstName(),
            'last_name': faker.name.lastName(),
            'prod': 2,
            'status': 'ACTIVE',
            phone_number: Number(faker.phone.phoneNumber('#########')),
            phone_local_code: Number(faker.phone.phoneNumber('##'))
        });
        expect(created).toBeDefined();
        expect(created.length).toBe(1);
        done();
    }, 10000);
    test('#82 Cancelamento', async done => {
        const productRepository = new ProductRepository(context);
        const product = await productRepository.get({ course: 'espcex' });
        const [inserted] = await SubscriptionService(db).insert({
            hotmart_id: 18,
            product: product.id,
            user: user.user_id,
            expiration: new Date(Date.now() + 10000),
            registrationDate: new Date(),
            active: true,
            course_tag: 2,
        }).onConflict().merge();
        expect(inserted).toBeDefined();
        const canceleds = await controller.cancel({
            hottok,
            email,
            first_name: 'Teste',
            last_name: 'Comprador',
            prod: 0,
            status: 'canceled',
        });
        expect(canceleds.length).toBeGreaterThan(0);
        canceleds.forEach(canceled => {
            expect(canceled).toBeDefined();
            expect(canceled.id).toBeDefined();
        });
        done();
    }, 10000);
    test('#83 Criação com produto inexistente', async done => {
        const mailsLength = mails.length;
        const productRepository = new ProductRepository(context);
        const product = await productRepository.get({ course: 'espcex' });
        await controller.createFromHotmart({
            hottok, email,
            'first_name': faker.name.firstName(),
            'last_name': faker.name.lastName(),
            'prod': product.code * 3,
            'status': 'ACTIVE',
            phone_number: Number(faker.phone.phoneNumber('#########')),
            phone_local_code: Number(faker.phone.phoneNumber('##'))
        }).catch((error) => {
            expect(error).toMatchObject({
                "message": "Produto não encontrado",
                "status": 404,
            });
        });
        done();
    }, 100000);
    test('#84 Listagem do usuário', async done => {
        expect(user).toBeDefined();
        const subscriptions = await controller.mySubscriptions(user?.user_id || 0);
        expect(subscriptions).toBeInstanceOf(Array);
        subscriptions.forEach(subscription => {
            expect(subscription.user).toBe(user?.user_id);
        });
        expect(subscriptions.length).toBeGreaterThan(0);
        done();
    }, 10000);
    test('#85 Cancelamento com assinatura inexistente', async done => {
        const notCanceled = await controller.cancel({
            hottok,
            email: faker.internet.email(),
            first_name: 'Teste',
            last_name: 'Comprador',
            prod: 0,
            status: 'canceled',
        });
        expect(notCanceled).toBeInstanceOf(Array);
        expect(notCanceled.length).toBe(0);
        done();
    }, 100000);
    test('#86 Listagem de todas', async done => {
        const list = await controller.list({ pagination: { 'ordering': 'id', 'page': 1, 'pageSize': 10 } }) as Paginated<any>;
        expect(list).not.toBeInstanceOf(Array);
        if (list instanceof Array) throw new Error();
        expect(list.page).toBeInstanceOf(Array);
        expect(list.page.length).toBe(10);
        expect(list.pages).toBe(Math.ceil(list.count / 10));
        done();
    });
    test('#87 Criação manual', async done => {
        const productRepository = new ProductRepository(context);
        const product = await productRepository.get({ course: 'esa' });
        const created = await controller.create({
            'expiration': new Date(Date.now() + 10000),
            'product': product.id,
            'user': user.user_id,
            active: true,
        });
        expect(created).toBeDefined();
        done();
    });
    test('#88 atualização manual', async done => {
        const selected = await SubscriptionService(db).first();
        expect(selected).toBeDefined();
        if (!selected) throw new Error();
        const productRepository = new ProductRepository(context);
        const product = await productRepository.get({ course: 'esa' });
        const updated = await controller.update(selected?.id, {
            'expiration': new Date(Date.now() + 10000),
            'product': product.id,
            'user': user.user_id,
            active: true,
        });
        expect(updated).toBeDefined();
        done();
    });
    test('#89 gráfico das ativas', async done => {
        const chart = await controller.activeChart({});
        expect(chart).toBeInstanceOf(Array);
        chart.forEach(item => {
            expect(item, JSON.stringify(chart)).toBeDefined();
            expect(typeof item.key).toBe('string');
            expect(typeof item.value).toBe('number');
        });
        done();
    });
    test('#90 adicionando um ano a data atual', async done=> {

        const productRepository = new ProductRepository(context);
        const product = await  productRepository.get({code: 5})
        
       
            let atual = new Date();
            let expiracaoProduto = new Date(Date.now() + product.expirationTime); 
            expect(expiracaoProduto.getDay).toBe(atual.getDay);
            expect(expiracaoProduto.getMonth).toBe(atual.getMonth);
            expect(expiracaoProduto.getFullYear()).toBe(atual.getFullYear() + 1);
        
        
        done();
    })

});

