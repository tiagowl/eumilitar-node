import AuthController from '../src/adapters/controllers/Auth';
import { UserService } from '../src/adapters/models/User';
import { TokenService } from '../src/adapters/models/Token';
import { createEssay, deleteUser, driverFactory, generateConfirmationToken, saveConfirmationToken, saveUser, smtpFactory, userFactory } from './shortcuts';
import PasswordRecoveryController from '../src/adapters/controllers/PasswordRecovery';
import settings from '../src/settings';
import { PasswordRecoveryService } from '../src/adapters/models/PasswordRecoveries';
import CheckPasswordToken from '../src/adapters/controllers/CheckPasswordToken';
import ChangePasswordController from '../src/adapters/controllers/ChangePassword';
import CheckAuthController from '../src/adapters/controllers/CheckAuth';
import crypto from 'crypto';
import EssayThemeRepository, { EssayThemeService } from '../src/adapters/models/EssayTheme';
import { EssayThemeCreation } from '../src/cases/EssayThemeCase';
import { Course } from '../src/entities/EssayTheme';
import faker from 'faker';
import EssayThemeController, { EssayThemeInput, EssayThemePagination } from '../src/adapters/controllers/EssayTheme';
import { Readable } from 'stream';
import EssayController, { EssayInput } from '../src/adapters/controllers/Essay';
import EssayInvalidationController from '../src/adapters/controllers/EssayInvalidation';

const driver = driverFactory()

beforeAll(async (done) => {
    await driver.migrate.latest();
    done();
})

afterAll(async (done) => {
    await driver.destroy();
    done();
})

describe('#1 Testes na autenticação', () => {
    const user = userFactory()
    const passwordService = PasswordRecoveryService(driver);
    beforeAll(async (done) => {
        const service = UserService(driver);
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
        const controller = new AuthController(driver);
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
        const smtp = await smtpFactory();
        const controller = new PasswordRecoveryController(driver, smtp, settings.messageConfig);
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
        const smtp = await smtpFactory();
        const controller = new PasswordRecoveryController(driver, smtp, settings.messageConfig);
        try {
            await controller.recover(credentials);
        } catch (error) {
            expect(error).toEqual({ message: 'Usuário não encontrado' })
        }
        done()
    })
    test('Recuperação de senha com mail inválido', async done => {
        const credentials = { email: 'wrongmail.com' }
        const smtp = await smtpFactory();
        const controller = new PasswordRecoveryController(driver, smtp, settings.messageConfig);
        try {
            await controller.recover(credentials);
        } catch (error) {
            expect(error).toEqual({
                message: "Email inválido",
                errors: [["email", "Email inválido",]]
            });
        }
        done()
    })
    test('Verificar token de mudança de senha', async (done) => {
        const token = await generateConfirmationToken();
        const service = UserService(driver);
        const userData = await service.where('email', user.email).first();
        saveConfirmationToken(token, userData?.user_id || 0, driver);
        const controller = new CheckPasswordToken(driver);
        const { isValid } = await controller.check({ token });
        expect(isValid).toBeTruthy()
        done();
    })
    test('Verificar token expirado de mudança de senha', async (done) => {
        const token = await generateConfirmationToken();
        const service = UserService(driver);
        const userData = await service.where('email', user.email).first();
        saveConfirmationToken(token, userData?.user_id || 0, driver, new Date());
        const controller = new CheckPasswordToken(driver);
        const { isValid } = await controller.check({ token });
        expect(isValid).toBeFalsy()
        done();
    })
    test('Verificar token expirado de mudança de senha', async (done) => {
        const token = await generateConfirmationToken();
        const service = UserService(driver);
        const userData = await service.where('email', user.email).first();
        saveConfirmationToken(token, userData?.user_id || 0, driver, new Date(0));
        const controller = new CheckPasswordToken(driver);
        const { isValid } = await controller.check({ token });
        expect(isValid).toBeFalsy()
        done();
    })
    test('Verificar token inválido de mudança de senha', async (done) => {
        const token = await generateConfirmationToken();
        const invalidToken = await generateConfirmationToken()
        const service = UserService(driver);
        const userData = await service.where('email', user.email).first();
        saveConfirmationToken(token, userData?.user_id || 0, driver);
        const controller = new CheckPasswordToken(driver);
        const { isValid } = await controller.check({ token: invalidToken });
        expect(isValid).toBeFalsy()
        done();
    })
    test('Verificar token inválido de mudança de senha', async (done) => {
        const token = await generateConfirmationToken();
        const invalidToken = (await generateConfirmationToken()).slice(0, 15)
        const service = UserService(driver);
        const userData = await service.where('email', user.email).first();
        saveConfirmationToken(token, userData?.user_id || 0, driver);
        const controller = new CheckPasswordToken(driver);
        const { isValid } = await controller.check({ token: invalidToken },);
        expect(isValid).toBeFalsy()
        done();
    })
    test('Mudar senha', async done => {
        const token = await generateConfirmationToken();
        const service = UserService(driver);
        const userData = await service.where('email', user.email).first();
        saveConfirmationToken(token, userData?.user_id || 0, driver);
        const newPassword = 'newPassword'
        const controller = new ChangePasswordController(driver);
        const updated = await controller.updatePassword({
            password: newPassword,
            confirmPassword: newPassword,
            token,
        });
        expect(updated).toEqual({ updated: true })
        const checker = new CheckPasswordToken(driver);
        const { isValid } = await checker.check({ token },);
        expect(isValid).toBeFalsy()
        done();
    })
    test('Verificar autenticação', async (done) => {
        const credentials = {
            email: user.email,
            password: 'newPassword'
        };
        const auth = new AuthController(driver);
        const { token } = await auth.auth(credentials);
        const controller = new CheckAuthController(driver);
        const response = await controller.check({ token: token || '' });
        expect(response.isValid).toBeTruthy();
        expect(response.user).not.toBeNull();
        expect(response.user).not.toBeUndefined();
        expect(response.user?.email).toEqual(user.email);
        done();
    })
    test('Verificar autenticação com token inválido', async (done) => {
        const token = crypto.randomBytes(32).toString('base64');
        const controller = new CheckAuthController(driver);
        const response = await controller.check({ token: token || '' });
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
    test('Teste no modelo', async done => {
        const repository = new EssayThemeRepository(driver);
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
    test('Teste na criação pelo controller', async done => {
        const data: EssayThemeInput = {
            title: 'Título',
            endDate: new Date(Date.now() - 50 * 24 * 60 * 60),
            startDate: new Date(Date.now() - 70 * 24 * 60 * 60),
            helpText: faker.lorem.lines(3),
            deactivated: false,
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
            },
            courses: ['esa', 'espcex'] as Course[]
        }
        const controller = new EssayThemeController(driver);
        const created = await controller.create(data);
        expect(created.id).not.toBeNull();
        expect(created.id).not.toBeUndefined();
        expect(created.title).toEqual(data.title);
        done();
    })
    test('Lista todos os temas', async done => {
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
            },
            courses: ['esa', 'espcex'] as Course[],
        }
        const controller = new EssayThemeController(driver);
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
    test('#3 Atualização dos temas', async done => {
        const data: EssayThemeInput = {
            title: faker.name.title(),
            endDate: new Date(Date.now() + 3700 * 24 * 60 * 60),
            startDate: new Date(Date.now() + 3500 * 24 * 60 * 60),
            helpText: faker.lorem.lines(3),
            deactivated: false,
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
            },
            courses: ['esa'] as Course[],
        }
        const controller = new EssayThemeController(driver);
        const all = await controller.listAll();
        expect(all.pages).not.toBeLessThan(1);
        expect(all.page).toBeInstanceOf(Array);
        expect(all.page.length).not.toBeLessThan(1)
        const selected = all.page[0]
        expect(selected.id).not.toBeUndefined();
        const updated = await controller.update(selected.id || 0, data);
        expect(data.title).toEqual(updated.title);
        data.endDate.setMilliseconds(0);
        expect(data.endDate).toEqual(updated.endDate);
        expect(data.courses).toEqual(updated.courses);
        done();
    })
})



describe('#4 Redações', () => {
    const user = userFactory();
    beforeAll(async (done) => {
        const service = UserService(driver);
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
    test('Criação de redações', async done => {
        const themeService = EssayThemeService(driver);
        await themeService.delete().del()
        const repository = new EssayThemeRepository(driver);
        const themeData: EssayThemeCreation = {
            title: 'Título',
            endDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 60),
            startDate: new Date(Date.now() - 160 * 24 * 60 * 60 * 60),
            helpText: faker.lorem.lines(3),
            file: '/usr/share/data/theme.pdf',
            courses: new Set(['esa', 'espcex'] as Course[]),
            deactivated: false,
        }
        const theme = await repository.create(themeData);
        expect(theme.id).not.toBeUndefined();
        expect(theme.id).not.toBeNull();
        const data: EssayInput = {
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
            },
            student: user.user_id,
            course: 'espcex',
        }
        const controller = new EssayController(driver);
        const created = await controller.create(data);
        expect(created.id, JSON.stringify(created)).not.toBeUndefined();
        expect(created.id, JSON.stringify(created)).not.toBeNaN();
        expect(created.course).toBe(data.course);
        done();
    })
    test('Listagem', async done => {
        const controller = new EssayController(driver);
        const essays = await controller.myEssays(user.user_id);
        expect(essays).not.toBeUndefined();
        expect(essays.length).not.toBeLessThan(1);
        done();
    })
    test('Listagem de todos', async (done) => {
        const controller = new EssayController(driver);
        const essays = await controller.allEssays({});
        expect(essays).not.toBeUndefined();
        expect(essays.count).not.toBeLessThan(1);
        expect(essays.page.length).not.toBeLessThan(1);
        done();
    })
    test('Recuperação de uma redação', async done => {
        const controller = new EssayController(driver);
        const base = await createEssay(driver, user.user_id);
        const essay = await controller.get(base.id);
        expect(essay).toMatchObject(base);
        expect(essay).toBeDefined();
        done();
    })
    test('Atualização da redação', async done => {
        const controller = new EssayController(driver);
        const base = await createEssay(driver, user.user_id);
        const essay = await controller.partialUpdate(base.id,
            { corrector: base.student, status: 'correcting' }
        );
        expect(essay).toBeDefined();
        expect(essay.status).toBe('correcting');
        expect(base.student).toBe(essay.corrector);
        done();
    })
})

describe('#5 Invalidações', () => {
    const user = userFactory();
    beforeAll(async (done) => {
        const service = UserService(driver);
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
        const essays = new EssayController(driver);
        const essay = await createEssay(driver, user.user_id);
        await essays.partialUpdate(essay.id,
            { corrector: user.user_id, status: 'correcting' }
        );
        const controller = new EssayInvalidationController(driver);
        const created = await controller.create({ essay: essay.id, corrector: user.user_id, comment: faker.lorem.lines(7), reason: 'other' });
        expect(created).toBeDefined();
        expect(created.id).toBeDefined();
        expect(created.essay).toBe(essay.id);
        done();
    })
})