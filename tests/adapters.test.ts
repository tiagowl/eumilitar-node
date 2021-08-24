import AuthController from '../src/adapters/controllers/Auth';
import { UserService } from '../src/adapters/models/User';
import { TokenService } from '../src/adapters/models/Token';
import { contextFactory, hottok, createEssay, deleteUser, driver, generateConfirmationToken, saveConfirmationToken, saveUser, userFactory, mails } from './shortcuts';
import PasswordRecoveryController from '../src/adapters/controllers/PasswordRecovery';
import settings from '../src/settings';
import { PasswordRecoveryService } from '../src/adapters/models/PasswordRecoveries';
import CheckPasswordToken from '../src/adapters/controllers/CheckPasswordToken';
import ChangePasswordController from '../src/adapters/controllers/ChangePassword';
import crypto from 'crypto';
import EssayThemeRepository, { EssayThemeService } from '../src/adapters/models/EssayTheme';
import { EssayThemeCreation } from '../src/cases/EssayThemeCase';
import { Course } from '../src/entities/EssayTheme';
import faker from 'faker';
import EssayThemeController, { EssayThemeInput, EssayThemePagination } from '../src/adapters/controllers/EssayTheme';
import { Readable } from 'stream';
import EssayController, { EssayInput } from '../src/adapters/controllers/Essay';
import EssayInvalidationController from '../src/adapters/controllers/EssayInvalidation';
import CorrectionController from '../src/adapters/controllers/Correction';
import UserController from '../src/adapters/controllers/User';
import createLogger from '../src/drivers/logger';
import SubscriptionRepository, { SubscriptionService } from '../src/adapters/models/Subscription';
import ProductRepository, { ProductModel, ProductService } from '../src/adapters/models/Product';
import SubscriptionController from '../src/adapters/controllers/Subscription';
import ProductController from '../src/adapters/controllers/Products';
import { ProductCreation } from '../src/cases/ProductCase';

afterAll(async (done) => {
    await driver.destroy();
    done();
})

const context = contextFactory();

describe('#1 Testes na autenticação', () => {
    const user = userFactory()
    const passwordService = PasswordRecoveryService(driver);
    beforeAll(async (done) => {
        const service = UserService(driver)
            .onConflict('user_id').merge();
        await saveUser(user, service)
        const themeService = EssayThemeService(driver);
        await themeService.delete().del()
        done();
    })
    afterAll(async (done) => {
        const service = UserService(driver);
        await deleteUser(user, service)
        const themeService = EssayThemeService(driver);
        await themeService.del().delete();
        done()
    })
    test('Login correto', async (done) => {
        const credentials = {
            email: user.email,
            password: user.passwd
        };
        const controller = new AuthController(await context);
        const token = await controller.auth(credentials);
        expect(token.token).not.toBeNull();
        const tokenService = TokenService(driver);
        tokenService.where('session_id', token.token).then(dbToken => {
            expect(dbToken[0]).not.toBeNull()
            done();
        })
    })
    test('Recuperação de senha', async (done) => {
        const service = UserService(driver);
        const userData = await service.where('email', user.email).first();
        const credentials = { email: user.email, }
        const controller = new PasswordRecoveryController(await context);
        const response = await controller.recover(credentials);
        expect(response).toEqual({ message: "Email enviado! Verifique sua caixa de entrada." });
        const token = await passwordService.where('user_id', userData?.user_id).first();
        expect(token).not.toBeNull();
        expect(token).not.toBeUndefined();
        expect(token?.token).not.toBeNull();
        expect(token?.token).not.toBeUndefined();
        done()
    })
    test('Recuperação de senha com email errado', async (done) => {
        const credentials = { email: 'wrong@mail.com' }
        const controller = new PasswordRecoveryController(await context);
        try {
            await controller.recover(credentials);
        } catch (error) {
            expect(error).toEqual({ message: 'Usuário não encontrado', status: 404 });
        }
        done()
    })
    test('Recuperação de senha com email inválido', async done => {
        const credentials = { email: 'wrongmail.com' }
        const controller = new PasswordRecoveryController(await context);
        try {
            await controller.recover(credentials);
        } catch (error) {
            expect(error).toMatchObject({
                message: "Email inválido",
                errors: [["email", "Email inválido",]],
                status: 400,
            });
        }
        done()
    })
    test('Verificar token de mudança de senha', async (done) => {
        const token = await generateConfirmationToken();
        const service = UserService(driver);
        const userData = await service.where('email', user.email).first();
        await saveConfirmationToken(token, userData?.user_id || 0, driver);
        const controller = new CheckPasswordToken(await context);
        const { isValid } = await controller.check({ token });
        expect(isValid).toBeTruthy()
        done();
    })
    test('Verificar token expirado de mudança de senha', async (done) => {
        const token = await generateConfirmationToken();
        const service = UserService(driver);
        const userData = await service.where('email', user.email).first();
        await saveConfirmationToken(token, userData?.user_id || 0, driver, new Date(Date.now() - 1000));
        const controller = new CheckPasswordToken(await context);
        const { isValid } = await controller.check({ token });
        expect(isValid).toBeFalsy()
        done();
    })
    test('Verificar token expirado de mudança de senha', async (done) => {
        const token = await generateConfirmationToken();
        const service = UserService(driver);
        const userData = await service.where('email', user.email).first();
        await saveConfirmationToken(token, userData?.user_id || 0, driver, new Date(0));
        const controller = new CheckPasswordToken(await context);
        const { isValid } = await controller.check({ token });
        expect(isValid).toBeFalsy()
        done();
    })
    test('Verificar token inválido de mudança de senha', async (done) => {
        const token = await generateConfirmationToken();
        const invalidToken = await generateConfirmationToken()
        const service = UserService(driver);
        const userData = await service.where('email', user.email).first();
        await saveConfirmationToken(token, userData?.user_id || 0, driver);
        const controller = new CheckPasswordToken(await context);
        const { isValid } = await controller.check({ token: invalidToken });
        expect(isValid).toBeFalsy()
        done();
    })
    test('Verificar token inválido de mudança de senha', async (done) => {
        const token = await generateConfirmationToken();
        const invalidToken = (await generateConfirmationToken()).slice(0, 15)
        const service = UserService(driver);
        const userData = await service.where('email', user.email).first();
        await saveConfirmationToken(token, userData?.user_id || 0, driver);
        const controller = new CheckPasswordToken(await context);
        const { isValid } = await controller.check({ token: invalidToken },);
        expect(isValid).toBeFalsy()
        done();
    })
    test('Mudar senha', async done => {
        const token = await generateConfirmationToken();
        const service = UserService(driver);
        const userData = await service.where('email', user.email).first();
        await saveConfirmationToken(token, userData?.user_id || 0, driver);
        const newPassword = 'newPassword'
        const controller = new ChangePasswordController(await context);
        const updated = await controller.updatePassword({
            password: newPassword,
            confirmPassword: newPassword,
            token,
        });
        expect(updated).toEqual({ updated: true })
        const checker = new CheckPasswordToken(await context);
        const { isValid } = await checker.check({ token },);
        expect(isValid).toBeFalsy()
        done();
    })
    test('Verificar autenticação', async (done) => {
        const credentials = {
            email: user.email,
            password: 'newPassword'
        };
        const auth = new AuthController(await context);
        const { token } = await auth.auth(credentials);
        const controller = new AuthController(await context);
        const response = await controller.checkToken({ token: token || '' });
        expect(response.isValid).toBeTruthy();
        expect(response.user).not.toBeNull();
        expect(response.user).not.toBeUndefined();
        expect(response.user?.email).toEqual(user.email);
        done();
    })
    test('Verificar autenticação com token inválido', async (done) => {
        const token = crypto.randomBytes(32).toString('base64');
        const controller = new AuthController(await context);
        const response = await controller.checkToken({ token: token || '' });
        expect(response.isValid).toBeFalsy();
        expect(response.user).toBeUndefined();
        done();
    })
})



describe('#2 Testes nos temas de redação', () => {
    afterAll(async (done) => {
        const themeService = EssayThemeService(driver);
        await themeService.delete().del()
        done();
    })
    test('#21 Teste no modelo', async done => {
        const repository = new EssayThemeRepository(await context);
        const data: EssayThemeCreation = {
            title: 'Título',
            endDate: new Date(Date.now() - 150 * 24 * 60 * 60),
            startDate: new Date(Date.now() - 160 * 24 * 60 * 60),
            helpText: faker.lorem.lines(3),
            file: '/usr/share/data/theme.pdf',
            courses: new Set(['esa', 'espcex'] as Course[]),
            deactivated: false,
        }
        const created = await repository.create(data);
        expect(created.id).not.toBeUndefined();
        expect(created.id).not.toBeNull();
        done()
    })
    test('#22 Teste na criação pelo controller', async done => {
        const data: EssayThemeInput = {
            title: 'Título',
            endDate: new Date(Date.now() - 50 * 24 * 60 * 60),
            startDate: new Date(Date.now() - 70 * 24 * 60 * 60),
            helpText: faker.lorem.lines(3),
            deactivated: false,
            // @ts-ignore
            file: {
                path: '/usr/share/data/theme.pdf',
                buffer: Buffer.from(new ArrayBuffer(10), 0, 2),
                size: 1,
                bucket: faker.internet.userName(),
                fieldname: 'themeFile',
                filename: faker.name.title(),
                destination: '/usr/share/data/',
                mimetype: 'application/pdf',
                encoding: 'utf-8',
                originalname: faker.name.title(),
                stream: new Readable(),
                location: faker.internet.url(),
            },
            courses: ['esa', 'espcex'] as Course[]
        }
        const controller = new EssayThemeController(await context);
        const created = await controller.create(data);
        expect(created.id).not.toBeNull();
        expect(created.id).not.toBeUndefined();
        expect(created.title).toEqual(data.title);
        done();
    })
    test('#23 Lista todos os temas', async done => {
        const pagination: EssayThemePagination = {
            page: '1',
            size: '2',
            order: 'id',
        }
        const data: EssayThemeInput = {
            title: faker.name.title(),
            endDate: new Date(Date.now() + 370 * 24 * 60 * 60),
            startDate: new Date(Date.now() + 350 * 24 * 60 * 60),
            helpText: faker.lorem.lines(3),
            deactivated: false,
            // @ts-ignore
            file: {
                path: '/usr/share/data/theme.pdf',
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
            courses: ['esa', 'espcex'] as Course[],
        }
        const controller = new EssayThemeController(await context);
        await controller.create(data);
        await controller.create({ ...data, startDate: new Date(Date.now() + 790 * 24 * 60 * 60), endDate: new Date(Date.now() + 800 * 24 * 60 * 60) });
        const themes = await controller.listAll(pagination);
        expect(themes.count).toBe(themes.page.length);
        expect(themes.count).toBe(2);
        expect(themes.page).toBeInstanceOf(Array);
        await Promise.all(themes.page.map(async theme => {
            expect(theme.id, JSON.stringify(theme)).not.toBeUndefined();
            expect(theme.active, JSON.stringify(theme)).not.toBeUndefined();
        }))
        done()
    })
    test('#24 Atualização dos temas', async done => {
        const data: EssayThemeInput = {
            title: faker.name.title(),
            endDate: new Date(Date.now() + 3700 * 24 * 60 * 60),
            startDate: new Date(Date.now() + 3500 * 24 * 60 * 60),
            helpText: faker.lorem.lines(3),
            deactivated: false,
            // @ts-ignore
            file: {
                path: '/usr/share/data/theme.pdf',
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
            courses: ['esa'] as Course[],
        }
        const controller = new EssayThemeController(await context);
        const all = await controller.listAll();
        expect(all.pages).not.toBeLessThan(1);
        expect(all.page).toBeInstanceOf(Array);
        expect(all.page.length).not.toBeLessThan(1)
        const selected = all.page[0]
        expect(selected.id).not.toBeUndefined();
        const updated = await controller.update(selected.id || 0, data);
        expect(data.title).toEqual(updated.title);
        expect(data.courses).toEqual(updated.courses);
        done();
    })
})



describe('#4 Redações', () => {
    const user = userFactory({ permission: 6 });
    const corrector = userFactory({ permission: 5 });
    beforeAll(async (done) => {
        const service = UserService(driver)
            .onConflict('user_id').merge();
        await saveUser(user, service);
        await saveUser(corrector, service);
        done();
    })
    afterAll(async (done) => {
        const service = UserService(driver)
            .onConflict('user_id').merge();
        await deleteUser(user, service);
        await deleteUser(corrector, service);
        const themeService = EssayThemeService(driver);
        await themeService.delete().del();
        done()
    })
    test('#41 Criação de redações', async done => {
        const themeService = EssayThemeService(driver);
        await themeService.delete().del()
        const repository = new EssayThemeRepository(await context);
        const themeData: EssayThemeCreation = {
            title: 'Título',
            endDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 60),
            startDate: new Date(Date.now() - 160 * 24 * 60 * 60 * 60),
            helpText: faker.lorem.lines(3),
            file: '/usr/share/data/theme.pdf',
            courses: new Set(['espcex'] as Course[]),
            deactivated: false,
        }
        const theme = await repository.create(themeData);
        expect(theme.id).not.toBeUndefined();
        expect(theme.id).not.toBeNull();
        const subscriptionRepository = new SubscriptionRepository(await context);
        const productRepository = new ProductRepository(await context);
        const product = await productRepository.get({ course: 'espcex' })
        await subscriptionRepository.create({
            expiration: faker.date.future(),
            product: product.id,
            registrationDate: new Date(),
            user: user.user_id,
            code: faker.datatype.number(),
            course: 'esa',
        })
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
        }
        const controller = new EssayController(await context);
        const created = await controller.create(data);
        expect(created.id, JSON.stringify(created)).not.toBeUndefined();
        expect(created.id, JSON.stringify(created)).not.toBeNaN();
        expect(created.course).toBe(data.course);
        done();
    }, 10000)
    test('Listagem', async done => {
        const controller = new EssayController(await context);
        const base = await createEssay(await context, user.user_id);
        const essays = await controller.myEssays(user.user_id);
        expect(essays).not.toBeUndefined();
        expect(essays.length).not.toBeLessThan(1);
        expect(essays[0]).toMatchObject(base);
        done();
    }, 10000)
    test('Listagem de todos', async (done) => {
        const controller = new EssayController(await context);
        const essays = await controller.allEssays({});
        expect(essays).not.toBeUndefined();
        expect(essays.count).not.toBeLessThan(1);
        expect(essays.page.length).not.toBeLessThan(1);
        done();
    }, 10000)
    test('Recuperação de uma redação', async done => {
        const controller = new EssayController(await context);
        const base = await createEssay(await context, user.user_id);
        const essay = await controller.get(base.id);
        expect(essay).toMatchObject(base);
        expect(essay).toBeDefined();
        done();
    }, 10000)
    test('Atualização da redação', async done => {
        const controller = new EssayController(await context);
        const base = await createEssay(await context, user.user_id);
        const essay = await controller.partialUpdate(base.id,
            { corrector: corrector.user_id, status: 'correcting' }
        );
        expect(essay).toBeDefined();
        expect(essay.status).toBe('correcting');
        expect(corrector.user_id).toBe(essay?.corrector?.id);
        done();
    }, 10000)
})

describe('#5 Invalidações', () => {
    const user = userFactory();
    beforeAll(async (done) => {
        const service = UserService(driver)
            .onConflict('user_id').merge();
        await saveUser(user, service)
        done();
    })
    afterAll(async (done) => {
        const service = UserService(driver);
        await deleteUser(user, service);
        const themeService = EssayThemeService(driver);
        await themeService.delete().del();
        done()
    })
    test('Invalidação da redação', async done => {
        const essays = new EssayController(await context);
        const essay = await createEssay(await context, user.user_id);
        await essays.partialUpdate(essay.id,
            { corrector: user.user_id, status: 'correcting' }
        );
        const controller = new EssayInvalidationController(await context);
        const created = await controller.create({ essay: essay.id, corrector: user.user_id, comment: faker.lorem.lines(7), reason: 'other' });
        expect(created).toBeDefined();
        expect(created.id).toBeDefined();
        expect(created.essay).toBe(essay.id);
        done();
    }, 10000)
    test('Recuperação da invalidação', async done => {
        const essays = new EssayController(await context);
        const essay = await createEssay(await context, user.user_id);
        await essays.partialUpdate(essay.id,
            { corrector: user.user_id, status: 'correcting' }
        );
        const controller = new EssayInvalidationController(await context);
        const created = await controller.create({ essay: essay.id, corrector: user.user_id, comment: faker.lorem.lines(7), reason: 'other' });
        expect(created).toBeDefined();
        const invalidation = await controller.get(essay.id);
        expect(invalidation).toMatchObject(created);
        expect(invalidation).toBeDefined();
        expect(invalidation.id).toBeDefined();
        expect(invalidation.essay).toBe(essay.id);
        done();
    }, 10000)
})

describe('#6 Correções', () => {
    const user = userFactory();
    beforeAll(async (done) => {
        const service = UserService(driver)
            .onConflict('user_id').merge();
        await saveUser(user, service)
        done();
    })
    afterAll(async (done) => {
        const service = UserService(driver);
        await deleteUser(user, service);
        const themeService = EssayThemeService(driver);
        await themeService.delete().del();
        done()
    })
    test('Correção', async done => {
        const essays = new EssayController(await context);
        const essay = await createEssay(await context, user.user_id);
        await essays.partialUpdate(essay.id,
            { corrector: user.user_id, status: 'correcting' }
        );
        const controller = new CorrectionController(await context);
        const data = {
            'essay': essay.id,
            'corrector': user.user_id,
            'accentuation': "Sim",
            'agreement': "Sim",
            'cohesion': "Sim",
            'comment': faker.lorem.lines(5),
            'conclusion': "Sim",
            'erased': "Não",
            'followedGenre': "Sim",
            'hasMarginSpacing': "Sim",
            'isReadable': "Sim",
            'obeyedMargins': "Sim",
            'organized': "Sim",
            'orthography': "Sim",
            'points': 9.4,
            'repeated': "Não",
            'understoodTheme': "Sim",
            'veryShortSentences': "Não",
        }
        const created = await controller.create(data);
        expect(created.essay).toBe(essay.id);
        (Object.entries(data) as [keyof typeof data, any][])
            .forEach(([key, value]) => {
                if (key === 'corrector') return;
                expect(created[key]).toBeDefined();
                expect(created[key]).toBe(value);
            })
        done();
    })
    test('Recuperar correção', async (done) => {
        const essays = new EssayController(await context);
        const essay = await createEssay(await context, user.user_id);
        await essays.partialUpdate(essay.id,
            { corrector: user.user_id, status: 'correcting' }
        );
        const controller = new CorrectionController(await context);
        const pre = {
            'essay': essay.id,
            'corrector': user.user_id,
            'accentuation': "Sim",
            'agreement': "Sim",
            'cohesion': "Sim",
            'comment': faker.lorem.lines(5),
            'conclusion': "Sim",
            'erased': "Não",
            'followedGenre': "Sim",
            'hasMarginSpacing': "Sim",
            'isReadable': "Sim",
            'obeyedMargins': "Sim",
            'organized': "Sim",
            'orthography': "Sim",
            'points': 9.4,
            'repeated': "Não",
            'understoodTheme': "Sim",
            'veryShortSentences': "Não",
        }
        await controller.create(pre);
        const data = await controller.get({ essay: essay.id });
        expect(data).toBeDefined();
        expect(data.essay).toBe(essay.id);
        (Object.entries(pre) as [keyof typeof pre, any][])
            .forEach(([key, value]) => {
                if (key === 'corrector') return;
                expect(data[key]).toBeDefined();
                expect(data[key]).toBe(value);
            })
        done();
    })
})

describe('#7 Testes no usuário', () => {
    const user = userFactory()
    beforeAll(async (done) => {
        const service = UserService(driver)
            .onConflict(['email', 'user_id'])
            .merge();
        await saveUser(user, service)
        const themeService = EssayThemeService(driver);
        await themeService.delete().del()
        done();
    })
    afterAll(async (done) => {
        const service = UserService(driver);
        await deleteUser(user, service)
        const themeService = EssayThemeService(driver);
        await themeService.del().delete();
        done()
    })
    test('#71 Listagem', async done => {
        const controller = new UserController(await context);
        const users = await controller.all({ status: 'active' });
        expect(users).toBeDefined();
        if (!(users instanceof Array)) throw new Error();
        expect(users.length).toBeGreaterThan(0);
        users.forEach(user => {
            expect(user.status).toBe('active');
            expect(user.id).toBeDefined();
        })
        done();
    });
    test('#71 Criação', async done => {
        const controller = new UserController(await context);
        const user = await controller.create({
            email: faker.internet.email(),
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            password: faker.internet.password(),
            permission: 'admin',
            status: 'active',
        });
        expect(user).toBeDefined();
        expect(user.id).toBeDefined();
        done();
    });
    test('#71 Listagem', async done => {
        const controller = new UserController(await context);
        const page = await controller.all({ status: 'active', pagination: { 'page': 1, pageSize: 20, ordering: 'id' } });
        expect(page).toBeDefined();
        if ((page instanceof Array)) throw new Error();
        const users = page.page;
        expect(typeof page.count).toBe('number');
        expect(typeof page.pages).toBe('number');
        expect(users.length).toBeGreaterThan(0);
        users.forEach(user => {
            expect(user.status).toBe('active');
            expect(user.id).toBeDefined();
        })
        done();
    });
});

describe('#8 Inscrições', () => {
    const email = 'teste.sandbox@hotmart.com';
    const user = userFactory({ email });
    const deleteAll = async (done: any) => {
        await UserService(driver).where('email', email).del();
        done()
    };
    afterAll(deleteAll);
    beforeAll(deleteAll);
    beforeAll(async done => {
        const productRepository = new ProductRepository(await context);
        const product = await productRepository.get({ course: 'espcex' });
        await SubscriptionService(driver).insert({
            hotmart_id: faker.datatype.number(),
            product: product.id,
            user: user.user_id,
            expiration: new Date(Date.now() + 10000),
            registrationDate: new Date(),
            active: true,
            course_tag: 2,
        }).onConflict().ignore();
        await saveUser(user, UserService(driver));
        done();
    }, 100000);
    test('#81 Criação', async done => {
        const controller = new SubscriptionController(await context);
        const productRepository = new ProductRepository(await context);
        const product = await productRepository.get({ course: 'espcex' });
        const created = await controller.create({
            hottok, email,
            'first_name': faker.name.firstName(),
            'last_name': faker.name.lastName(),
            'prod': product.code,
            'status': 'ACTIVE',
        });
        expect(created).toBeDefined();
        expect(created.length).toBeGreaterThan(0);
        done();
    }, 100000);
    test('#82 Cancelamento', async done => {
        const [selected] = await SubscriptionService(driver)
            .whereIn('user',
                UserService(driver)
                    .where('email', email).select('user_id as user')
            );
        expect(selected).toBeDefined();
        const controller = new SubscriptionController(await context);
        const canceled = await controller.cancel({
            hottok,
            userEmail: email,
            'actualRecurrenceValue': faker.datatype.number(),
            'cancellationDate': Date.now(),
            'dateNextCharge': Date.now(),
            'productName': faker.name.title(),
            'subscriberCode': faker.datatype.string(),
            'subscriptionId': selected.hotmart_id,
            'subscriptionPlanName': faker.name.title(),
            'userName': faker.name.findName(),
        })
        expect(canceled).toBeDefined();
        expect(canceled.id).toBeDefined();
        done();
    }, 100000);
    test('#83 Criação com produto inexistente', async done => {
        const mailsLength = mails.length;
        const controller = new SubscriptionController(await context);
        const productRepository = new ProductRepository(await context);
        const product = await productRepository.get({ course: 'espcex' });
        await controller.create({
            hottok, email,
            'first_name': faker.name.firstName(),
            'last_name': faker.name.lastName(),
            'prod': product.code * 3,
            'status': 'ACTIVE',
        }).catch((error) => {
            expect(error).toMatchObject({
                "message": "Produto não encontrado",
                "status": 404,
            });
        });
        done();
    }, 100000);
    test('#84 Listagem', async done => {
        const controller = new SubscriptionController(await context);
        expect(user).toBeDefined();
        const subscriptions = await controller.mySubscriptions(user?.user_id || 0);
        expect(subscriptions).toBeInstanceOf(Array);
        subscriptions.forEach(subscription => {
            expect(subscription.user).toBe(user?.user_id);
        });
        expect(subscriptions.length).toBeGreaterThan(0);
        done();
    }, 100000);
    test('#85 Cancelamento com assinatura inexistente', async done => {
        const controller = new SubscriptionController(await context);
        try {
            await controller.cancel({
                hottok,
                userEmail: email,
                'actualRecurrenceValue': faker.datatype.number(),
                'cancellationDate': Date.now(),
                'dateNextCharge': Date.now(),
                'productName': faker.name.title(),
                'subscriberCode': faker.datatype.string(),
                'subscriptionId': 234,
                'subscriptionPlanName': faker.name.title(),
                'userName': faker.name.findName(),
            })
        } catch (error) {
            expect(error).toMatchObject({ message: 'Inscrição inexistente', status: 202 });
        }
        done();
    }, 100000);
});


describe('#9 Produtos', () => {
    const toRemove: number[] = [];
    afterAll(async done => {
        await ProductService(driver)
            .whereIn('product_id', toRemove).del();
        done();
    }, 10000);
    beforeAll(async done => {
        const product = {
            'course_tag': 2,
            'expiration_time': faker.datatype.number(),
            'id_hotmart': faker.datatype.number(),
            'product_name': faker.name.title(),
        }
        const [id] = await ProductService(driver).insert(product);
        toRemove.push(id);
        done();
    }, 10000);
    test('Criação', async done => {
        const controller = new ProductController(await context);
        const created = await controller.create({
            code: faker.datatype.number(),
            course: 'esa',
            expirationTime: 30 * 24 * 60 * 60 * 1000,
            name: faker.company.companyName(),
        });
        toRemove.push(created.id);
        expect(created.id).toBeDefined();
        done();
    }, 10000);
    test('Listagem', async done => {
        const controller = new ProductController(await context);
        const products = await controller.list();
        expect(products).toBeInstanceOf(Array);
        products.forEach(product => {
            expect(product).toBeDefined();
        });
        expect(products.length).toBeGreaterThan(0);
        done();
    }, 10000);
    test('Atualização', async done => {
        const controller = new ProductController(await context);
        const [product] = await controller.list();
        const data: ProductCreation = {
            code: faker.datatype.number(),
            course: 'esa',
            expirationTime: 30 * 24 * 60 * 60 * 1000,
            name: faker.company.companyName(),
        };
        const updated = await controller.fullUpdate(product.id, data);
        expect(updated.id).toBe(product.id);
        (Object.entries(data) as [keyof typeof updated, any][]).forEach(([key, value]) => {
            expect(updated[key]).toBe(value);
        });
        done();
    }, 10000);
});