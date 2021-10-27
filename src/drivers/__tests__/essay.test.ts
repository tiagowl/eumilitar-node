import faker from "faker";
import supertest from "supertest";
import { userFactory, db, saveUser, deleteUser, appFactory, jp, createEssay, contextFactory } from "../../../tests/shortcuts";
import EssayThemeRepository, { EssayThemeService } from "../../adapters/models/EssayTheme";
import ProductRepository from "../../adapters/models/Product";
import SubscriptionRepository from "../../adapters/models/Subscription";
import { UserModel, UserService } from "../../adapters/models/User";
import { EssayThemeCreation } from "../../cases/EssayTheme";
import { Course } from "../../entities/EssayTheme";
import { authenticate } from "./tools";

const context = contextFactory();

describe('#3 Redações', () => {
    const app = appFactory();
    const api = supertest(app.server);
    const user: UserModel = userFactory();
    const student: UserModel = userFactory({ permission: 6 });
    const admin: UserModel = userFactory({ permission: 1 });
    beforeAll(async (done) => {
        const themeService = EssayThemeService(db);
        await themeService.delete().del();
        const service = () => UserService(db)
            .onConflict('user_id').merge();
        await saveUser(admin, service());
        const repository = new EssayThemeRepository(context);
        const themeData: EssayThemeCreation = {
            title: 'Título',
            endDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 60),
            startDate: new Date(Date.now() - 160 * 24 * 60 * 60 * 60),
            helpText: faker.lorem.lines(3),
            file: '/usr/share/data/theme.pdf',
            courses: new Set(['esa', 'espcex'] as Course[]),
            deactivated: false,
        };
        const theme = await repository.create(themeData);
        expect(theme.id).not.toBeUndefined();
        expect(theme.id).not.toBeNull();
        await saveUser(user, service());
        await saveUser(student, service());
        done();
    });
    afterAll(async (done) => {
        const service = UserService(db);
        await deleteUser(user, service);
        const themeService = EssayThemeService(db);
        await themeService.del().delete();
        done();
    });
    test('Criação', async done => {
        const subscriptionRepository = new SubscriptionRepository(context);
        const productRepository = new ProductRepository(context);
        const product = await productRepository.get({ course: 'esa' });
        await subscriptionRepository.create({
            expiration: faker.date.future(),
            product: product.id,
            registrationDate: new Date(),
            user: student.user_id,
            code: faker.datatype.number(),
            course: 'espcex',
            active: true,
        });
        const header = await authenticate(student, api);
        const buffer = Buffer.from(new ArrayBuffer(10), 0, 2);
        const { body, status, error } = await api.post('/essays/')
            .set('Authorization', header)
            .field('course', 'esa')
            .attach('file', buffer, { filename: 'file.png', contentType: 'image/png' });
        expect(body.id, jp({ body, error })).not.toBeUndefined();
        expect(status, jp({ body, error })).toBe(201);
        done();
    });
    test('Listagem', async done => {
        const header = await authenticate(student, api);
        const { body, status, error } = await api.get('/essays/')
            .set('Authorization', header);
        expect(body, jp({ body, error, header })).toBeInstanceOf(Array);
        expect(status, jp({ body, error })).toBe(200);
        body.forEach((essay: any) => {
            expect(essay.course).toBeDefined();
            expect(essay.id).toBeDefined();
            expect(essay.file).toBeDefined();
        });
        done();
    });
    test('Listagem de todos', async done => {
        const header = await authenticate(user, api);
        const { body, status, error } = await api.get('/essays/')
            .set('Authorization', header);
        expect(body.page, jp({ body, error })).not.toBeUndefined();
        expect(body.page, jp({ body, error })).toBeInstanceOf(Array);
        expect(status, jp({ body, error })).toBe(200);
        body.page.forEach((essay: any) => {
            expect(essay.course).toBeDefined();
            expect(essay.id).toBeDefined();
            expect(essay.file).toBeDefined();
        });
        done();
    });
    test('Recuperação de uma redação', async done => {
        const header = await authenticate(user, api);
        const base = await createEssay(context, user.user_id);
        const response = await api.get(`/essays/${base.id}/`)
            .set('Authorization', header);
        expect(response.status, jp(response.body)).toBe(200);
        expect(response.body).toBeDefined();
        expect(response.body).toMatchObject(base);
        done();
    });
    test('Início da correção da redação', async done => {
        const header = await authenticate(user, api);
        const base = await createEssay(context, user.user_id);
        const response = await api.post(`/essays/${base.id}/corrector/`)
            .set('Authorization', header);
        expect(response.status, jp(response.body)).toBe(201);
        expect(response.body).toBeDefined();
        expect(response.body).toMatchObject(base);
        expect(response.body.corrector.id).toEqual(user.user_id);
        done();
    });
    test('Cancelamento da correção', async done => {
        const header = await authenticate(user, api);
        const base = await createEssay(context, user.user_id);
        await api.post(`/essays/${base.id}/corrector/`)
            .set('Authorization', header);
        const response = await api.delete(`/essays/${base.id}/corrector/`)
            .set('Authorization', header);
        expect(response.status, jp(response.body)).toBe(200);
        expect(response.body, jp(response.body)).toBeDefined();
        expect(response.body, jp(response.body)).toMatchObject(base);
        expect(response.body.corrector, jp(response.body)).toBeNull();
        done();
    });
    test('Gráfico de enviadas', async done => {
        if (!admin) throw new Error('Sem usuário');
        const header = await authenticate(admin, api);
        const response = await api.get('/essays/charts/sent/')
            .query({
                period: {
                    start: new Date(Date.now() - (2 * 360 * 24 * 60 * 60 * 1000)),
                    end: new Date(),
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
    test('Gráfico de corrigidas', async done => {
        if (!admin) throw new Error('Sem usuário');
        const header = await authenticate(admin, api);
        const response = await api.get('/essays/charts/evaluated/')
            .query({
                period: {
                    start: new Date(Date.now() - (2 * 360 * 24 * 60 * 60 * 1000)),
                    end: new Date(),
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
