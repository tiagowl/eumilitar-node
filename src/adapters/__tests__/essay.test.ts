import faker from "faker";
import { Readable } from "stream";
import { userFactory, db, saveUser, deleteUser, createEssay, contextFactory, jp } from "../../../tests/shortcuts";
import { EssayInvalidationCreationData } from "../../cases/EssayInvalidation";
import { EssayThemeCreation } from "../../cases/EssayTheme";
import { Course } from "../../entities/EssayTheme";
import User from "../../entities/User";
import EssayController, { EssayInput } from "../controllers/Essay";
import EssayInvalidationController from "../controllers/EssayInvalidation";
import SingleEssayController from "../controllers/SingleEssay";
import { EssayService } from "../models/Essay";
import EssayThemeRepository, { EssayThemeService } from "../models/EssayTheme";
import ProductRepository from "../models/Product";
import SubscriptionRepository from "../models/Subscription";
import UserRepository, { UserService } from "../models/User";

const context = contextFactory();

describe('#4 Redações', () => {
    const controller = new EssayController(context);
    const student = userFactory({ permission: 6 });
    const corrector = userFactory({ permission: 5 });
    const admin = userFactory({ permission: 1 });
    const userRepository = new UserRepository(context);
    const invalidationController = new EssayInvalidationController(context);
    let agentStudent: User;
    let agentAdmin: User;
    let agentCorrector: User;
    beforeAll(async (done) => {
        const service = UserService(db)
            .onConflict('user_id').merge();
        await saveUser(student, service);
        await saveUser(admin, service);
        await saveUser(corrector, service);
        agentStudent = await userRepository.toEntity(student);
        agentAdmin = await userRepository.toEntity(admin);
        agentCorrector = await userRepository.toEntity(corrector);
        done();
    });
    afterAll(async (done) => {
        const service = UserService(db)
            .onConflict('user_id').merge();
        await deleteUser(student, service);
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
            user: student.user_id,
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
            student: student.user_id,
            course: 'espcex',
        };
        const created = await controller.create(data, agentStudent);
        expect(created.id, JSON.stringify(created)).not.toBeUndefined();
        expect(created.id, JSON.stringify(created)).not.toBeNaN();
        expect(created.course).toBe(data.course);
        done();
    }, 10000);
    test('#42 Listagem', async done => {
        const base = await createEssay(context, student.user_id);
        const essays = await controller.myEssays(agentStudent);
        expect(essays).not.toBeUndefined();
        expect(essays.length).not.toBeLessThan(1);
        expect(essays[0]).toMatchObject(base);
        done();
    }, 10000);
    test('#43 Listagem de todos', async (done) => {
        const essays = await controller.allEssays({}, agentStudent);
        expect(essays).not.toBeUndefined();
        expect(essays.count).not.toBeLessThan(1);
        expect(essays.page.length).not.toBeLessThan(1);
        done();
    }, 10000);
    test('#44 Recuperação de uma redação', async done => {
        const base = await createEssay(context, student.user_id);
        const essay = await controller.get(base.id, agentStudent);
        expect(essay).toMatchObject(base);
        expect(essay).toBeDefined();
        expect(typeof essay.canResend).toBe('boolean');
        done();
    }, 10000);
    test('#45 Atualização da redação', async done => {
        const base = await createEssay(context, student.user_id);
        const essay = await controller.partialUpdate(base.id,
            { status: 'correcting' },
            agentCorrector,
        );
        expect(essay).toBeDefined();
        expect(essay.status).toBe('correcting');
        expect(corrector.user_id).toBe(essay?.corrector?.id);
        done();
    }, 10000);
    test('#46 gráfico das enviadas', async done => {
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
    test('#47 gráfico de correções', async done => {
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
    test('#48 gráfico tempo de correção', async done => {
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
    test('#49 Criação de redações com token', async done => {
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
            user: student.user_id,
            code: faker.datatype.number(),
            course: 'esa',
            active: true,
        });
        const singleEssayController = new SingleEssayController(context);
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
        const created = await controller.create(data, agentStudent);
        expect(created.id, JSON.stringify(created)).not.toBeUndefined();
        expect(created.id, JSON.stringify(created)).not.toBeNaN();
        expect(created.course).toBe('blank');
        done();
    }, 10000);
    test('#50 Reenvio da redação', async done => {
        await EssayService(db).where('user_id', student.user_id).del();
        const essay = await createEssay(context, student.user_id);
        await controller.partialUpdate(essay.id, { status: 'correcting' }, agentCorrector);
        const invalidationData: EssayInvalidationCreationData = { essay: essay.id, corrector: corrector.user_id, comment: faker.lorem.lines(7), reason: 'other' };
        const created = await invalidationController.create(invalidationData);
        expect(created).toBeDefined();
        const recovered = await controller.get(essay.id, agentStudent);
        expect(recovered).toBeDefined();
        expect(recovered.id).toBe(essay.id);
        expect(recovered.status).toBe('invalid');
        expect(recovered.canResend, jp(recovered)).toBeTruthy();
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
            invalidEssay: essay.id,
        };
        const resent = await controller.create(data, agentStudent);
        expect(resent).toBeDefined();
        expect(resent.canResend).toBeFalsy();
        done();
    });
});
