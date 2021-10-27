import faker from "faker";
import { Readable } from "stream";
import { userFactory, db, saveUser, deleteUser, createEssay, contextFactory } from "../../../tests/shortcuts";
import { EssayThemeCreation } from "../../cases/EssayTheme";
import { Course } from "../../entities/EssayTheme";
import EssayController, { EssayInput } from "../controllers/Essay";
import SingleEssayController from "../controllers/SingleEssay";
import EssayThemeRepository, { EssayThemeService } from "../models/EssayTheme";
import ProductRepository from "../models/Product";
import SubscriptionRepository from "../models/Subscription";
import { UserService } from "../models/User";

const context = contextFactory();

describe('#4 Redações', () => {
    const user = userFactory({ permission: 6 });
    const corrector = userFactory({ permission: 5 });
    beforeAll(async (done) => {
        const service = UserService(db)
            .onConflict('user_id').merge();
        await saveUser(user, service);
        await saveUser(corrector, service);
        done();
    });
    afterAll(async (done) => {
        const service = UserService(db)
            .onConflict('user_id').merge();
        await deleteUser(user, service);
        await deleteUser(corrector, service);
        const themeService = EssayThemeService(db);
        await themeService.delete().del();
        done();
    });
    test('#41 Criação de redações', async done => {
        const themeService = EssayThemeService(db);
        await themeService.delete().del();
        const repository = new EssayThemeRepository(context);
        const themeData: EssayThemeCreation = {
            title: 'Título',
            endDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 60),
            startDate: new Date(Date.now() - 160 * 24 * 60 * 60 * 60),
            helpText: faker.lorem.lines(3),
            file: '/usr/share/data/theme.pdf',
            courses: new Set(['espcex'] as Course[]),
            deactivated: false,
        };
        const theme = await repository.create(themeData);
        expect(theme.id).not.toBeUndefined();
        expect(theme.id).not.toBeNull();
        const subscriptionRepository = new SubscriptionRepository(context);
        const productRepository = new ProductRepository(context);
        const product = await productRepository.get({ course: 'espcex' });
        await subscriptionRepository.create({
            expiration: faker.date.future(),
            product: product.id,
            registrationDate: new Date(),
            user: user.user_id,
            code: faker.datatype.number(),
            course: 'esa',
            active: true,
        });
        const data: EssayInput = {
            // @ts-ignore
            file: {
                path: '/usr/share/data/theme.png',
                buffer: Buffer.from(new ArrayBuffer(10), 0, 2),
                size: 1,
                fieldname: 'themeFile',
                filename: faker.name.title(),
                destination: '/usr/share/data/',
                mimetype: 'application/pdf',
                encoding: 'utf-8',
                originalname: faker.name.title(),
                stream: new Readable(),
                location: faker.internet.url(),
            },
            student: user.user_id,
            course: 'espcex',
        };
        const controller = new EssayController(context);
        const created = await controller.create(data);
        expect(created.id, JSON.stringify(created)).not.toBeUndefined();
        expect(created.id, JSON.stringify(created)).not.toBeNaN();
        expect(created.course).toBe(data.course);
        done();
    }, 10000);
    test('Listagem', async done => {
        const controller = new EssayController(context);
        const base = await createEssay(context, user.user_id);
        const essays = await controller.myEssays(user.user_id);
        expect(essays).not.toBeUndefined();
        expect(essays.length).not.toBeLessThan(1);
        expect(essays[0]).toMatchObject(base);
        done();
    }, 10000);
    test('Listagem de todos', async (done) => {
        const controller = new EssayController(context);
        const essays = await controller.allEssays({});
        expect(essays).not.toBeUndefined();
        expect(essays.count).not.toBeLessThan(1);
        expect(essays.page.length).not.toBeLessThan(1);
        done();
    }, 10000);
    test('Recuperação de uma redação', async done => {
        const controller = new EssayController(context);
        const base = await createEssay(context, user.user_id);
        const essay = await controller.get(base.id);
        expect(essay).toMatchObject(base);
        expect(essay).toBeDefined();
        done();
    }, 10000);
    test('Atualização da redação', async done => {
        const controller = new EssayController(context);
        const base = await createEssay(context, user.user_id);
        const essay = await controller.partialUpdate(base.id,
            { corrector: corrector.user_id, status: 'correcting' }
        );
        expect(essay).toBeDefined();
        expect(essay.status).toBe('correcting');
        expect(corrector.user_id).toBe(essay?.corrector?.id);
        done();
    }, 10000);
    test('gráfico das enviadas', async done => {
        const controller = new EssayController(context);
        const chart = await controller.sentChart({
            period: {
                start: new Date(Date.now() - 2 * 360 * 24 * 60 * 60 * 1000),
                end: new Date()
            }
        });
        expect(chart).toBeInstanceOf(Array);
        expect(chart.length).toBe(24);
        chart.forEach(item => {
            expect(item, JSON.stringify(chart)).toBeDefined();
            expect(typeof item.key).toBe('string');
            expect(typeof item.value).toBe('number');
            expect(item.value).not.toBeNaN();
        });
        done();
    });
    test('gráfico de correções', async done => {
        const controller = new EssayController(context);
        const chart = await controller.evaluatedChart({
            period: {
                start: new Date(Date.now() - 2 * 360 * 24 * 60 * 60 * 1000),
                end: new Date()
            }
        });
        expect(chart).toBeInstanceOf(Array);
        expect(chart.length).toBe(24);
        chart.forEach(item => {
            expect(item, JSON.stringify(chart)).toBeDefined();
            expect(typeof item.key).toBe('string');
            expect(typeof item.value).toBe('number');
            expect(item.value).not.toBeNaN();
        });
        done();
    });
    test('gráfico tempo de correção', async done => {
        const controller = new EssayController(context);
        const chart = await controller.avgTimeCorrection({
            period: {
                start: new Date(Date.now() - 2 * 360 * 24 * 60 * 60 * 1000),
                end: new Date()
            }
        });
        expect(chart).toBeInstanceOf(Array);
        expect(chart.length).toBe(24);
        chart.forEach(item => {
            expect(item, JSON.stringify(chart)).toBeDefined();
            expect(typeof item.key).toBe('string');
            expect(typeof item.value).toBe('number');
            expect(item.value).not.toBeNaN();
        });
        done();
    });
    test('Criação de redações com token', async done => {
        const themeService = EssayThemeService(db);
        await themeService.delete().del();
        const repository = new EssayThemeRepository(context);
        const themeData: EssayThemeCreation = {
            title: 'Título',
            endDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 60),
            startDate: new Date(Date.now() - 160 * 24 * 60 * 60 * 60),
            helpText: faker.lorem.lines(3),
            file: '/usr/share/data/theme.pdf',
            courses: new Set(['espcex'] as Course[]),
            deactivated: false,
        };
        const theme = await repository.create(themeData);
        expect(theme.id).not.toBeUndefined();
        expect(theme.id).not.toBeNull();
        const subscriptionRepository = new SubscriptionRepository(context);
        const productRepository = new ProductRepository(context);
        const product = await productRepository.get({ course: 'espcex' });
        await subscriptionRepository.create({
            expiration: faker.date.future(),
            product: product.id,
            registrationDate: new Date(),
            user: user.user_id,
            code: faker.datatype.number(),
            course: 'esa',
            active: true,
        });
        const singleEssayController = new SingleEssayController(context);
        const student = await UserService(db).where('permission', 6).first();
        if (!theme || !student) {
            console.log(theme, student);
            throw new Error();
        }
        const single = await singleEssayController.create({ theme: theme.id, student: student.user_id });
        const data: EssayInput = {
            // @ts-ignore
            file: {
                path: '/usr/share/data/theme.png',
                buffer: Buffer.from(new ArrayBuffer(10), 0, 2),
                size: 1,
                fieldname: 'themeFile',
                filename: faker.name.title(),
                destination: '/usr/share/data/',
                mimetype: 'application/pdf',
                encoding: 'utf-8',
                originalname: faker.name.title(),
                stream: new Readable(),
                location: faker.internet.url(),
            },
            student: student.user_id,
            token: single.token,
        };
        const controller = new EssayController(context);
        const created = await controller.create(data);
        expect(created.id, JSON.stringify(created)).not.toBeUndefined();
        expect(created.id, JSON.stringify(created)).not.toBeNaN();
        expect(created.course).toBe('blank');
        done();
    }, 10000);
});
