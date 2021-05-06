import AuthController from '../src/adapters/controllers/Auth';
import { UserService } from '../src/adapters/models/User';
import { TokenService } from '../src/adapters/models/Token';
import { deleteUser, driverFactory, generateConfirmationToken, saveConfirmationToken, saveUser, smtpFactory, userFactory } from './shortcuts';
import PasswordRecoveryController from '../src/adapters/controllers/PasswordRecovery';
import settings from '../src/settings';
import { PasswordRecoveryService } from '../src/adapters/models/PasswordRecoveries';
import CheckPasswordToken from '../src/adapters/controllers/CheckPasswordToken';
import ChangePasswordController from '../src/adapters/controllers/ChangePassword';
import CheckAuthController from '../src/adapters/controllers/CheckAuth';
import crypto from 'crypto';
import EssayThemeRepository, { EssayThemeService } from '../src/adapters/models/EssayTheme';
import { EssayThemeCreation } from '../src/cases/EssayThemeCase';
import EssayTheme, { Course } from '../src/entities/EssayTheme';
import faker from 'faker';
import EssayThemeController, { EssayThemeInput } from '../src/adapters/controllers/EssayTheme';
import { Readable } from 'stream';

const driver = driverFactory()

beforeAll(async (done) => {
    await driver.migrate.latest();
    done();
})

afterAll(async (done) => {
    await driver.destroy()
    done()
})

describe('Testes na autenticação', () => {
    const user = userFactory()
    const passwordService = PasswordRecoveryService(driver);
    beforeAll(async (done) => {
        const service = UserService(driver);
        await saveUser(user, service)
        done();
    })
    afterAll((done) => {
        const service = UserService(driver);
        deleteUser(user, service)
            .finally(done)
    })
    test('Login correto', async (done) => {
        const credentials = {
            email: user.email,
            password: user.passwd
        };
        const controller = new AuthController(credentials, driver);
        const token = await controller.auth();
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
        const controller = new PasswordRecoveryController(credentials, driver, smtp, settings.messageConfig);
        const response = await controller.recover();
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
        const controller = new PasswordRecoveryController(credentials, driver, smtp, settings.messageConfig);
        try {
            await controller.recover();
        } catch (error) {
            expect(error).toEqual({ message: 'Usuário não encontrado' })
        }
        done()
    })
    test('Recuperação de senha com mail inválido', async done => {
        const credentials = { email: 'wrongmail.com' }
        const smtp = await smtpFactory();
        const controller = new PasswordRecoveryController(credentials, driver, smtp, settings.messageConfig);
        try {
            await controller.recover();
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
        const controller = new CheckPasswordToken({ token }, driver);
        const { isValid } = await controller.check();
        expect(isValid).toBeTruthy()
        done();
    })
    test('Verificar token expirado de mudança de senha', async (done) => {
        const token = await generateConfirmationToken();
        const service = UserService(driver);
        const userData = await service.where('email', user.email).first();
        saveConfirmationToken(token, userData?.user_id || 0, driver, new Date());
        const controller = new CheckPasswordToken({ token }, driver);
        const { isValid } = await controller.check();
        expect(isValid).toBeFalsy()
        done();
    })
    test('Verificar token expirado de mudança de senha', async (done) => {
        const token = await generateConfirmationToken();
        const service = UserService(driver);
        const userData = await service.where('email', user.email).first();
        saveConfirmationToken(token, userData?.user_id || 0, driver, new Date(0));
        const controller = new CheckPasswordToken({ token }, driver);
        const { isValid } = await controller.check();
        expect(isValid).toBeFalsy()
        done();
    })
    test('Verificar token inválido de mudança de senha', async (done) => {
        const token = await generateConfirmationToken();
        const invalidToken = await generateConfirmationToken()
        const service = UserService(driver);
        const userData = await service.where('email', user.email).first();
        saveConfirmationToken(token, userData?.user_id || 0, driver);
        const controller = new CheckPasswordToken({ token: invalidToken }, driver);
        const { isValid } = await controller.check();
        expect(isValid).toBeFalsy()
        done();
    })
    test('Verificar token inválido de mudança de senha', async (done) => {
        const token = await generateConfirmationToken();
        const invalidToken = (await generateConfirmationToken()).slice(0, 15)
        const service = UserService(driver);
        const userData = await service.where('email', user.email).first();
        saveConfirmationToken(token, userData?.user_id || 0, driver);
        const controller = new CheckPasswordToken({ token: invalidToken }, driver);
        const { isValid } = await controller.check();
        expect(isValid).toBeFalsy()
        done();
    })
    test('Mudar senha', async done => {
        const token = await generateConfirmationToken();
        const service = UserService(driver);
        const userData = await service.where('email', user.email).first();
        saveConfirmationToken(token, userData?.user_id || 0, driver);
        const newPassword = 'newPassword'
        const controller = new ChangePasswordController({
            password: newPassword,
            confirmPassword: newPassword,
            token,
        }, driver);
        const updated = await controller.updatePassword();
        expect(updated).toEqual({ updated: true })
        const checker = new CheckPasswordToken({ token }, driver);
        const { isValid } = await checker.check();
        expect(isValid).toBeFalsy()
        done();
    })
    test('Verificar autenticação', async (done) => {
        const credentials = {
            email: user.email,
            password: 'newPassword'
        };
        const auth = new AuthController(credentials, driver);
        const { token } = await auth.auth();
        const controller = new CheckAuthController({ token: token || '' }, driver);
        const response = await controller.check();
        expect(response.isValid).toBeTruthy();
        expect(response.user).not.toBeNull();
        expect(response.user).not.toBeUndefined();
        expect(response.user?.email).toEqual(user.email);
        done();
    })
    test('Verificar autenticação com token inválido', async (done) => {
        const token = crypto.randomBytes(32).toString('base64');
        const controller = new CheckAuthController({ token: token || '' }, driver);
        const response = await controller.check();
        expect(response.isValid).toBeFalsy();
        expect(response.user).toBeUndefined();
        done();
    })
})

describe('Testes nos temas de redação', () => {
    test('Teste no modelo', async done => {
        const repository = new EssayThemeRepository(driver);
        const data: EssayThemeCreation = {
            title: 'Título',
            endDate: new Date(Date.now() + 15 * 24 * 60 * 60),
            startDate: new Date(),
            helpText: faker.lorem.lines(3),
            file: '/usr/share/data/theme.pdf',
            courses: new Set(['esa', 'espcex'] as Course[])
        }
        const created = await repository.create(data);
        expect(created.id).not.toBeUndefined();
        expect(created.id).not.toBeNull();
        done()
    })
    test('Teste na criação pelo controller', async done => {
        const data: EssayThemeInput = {
            title: 'Título',
            endDate: new Date(Date.now() + 15 * 24 * 60 * 60),
            startDate: new Date(),
            helpText: faker.lorem.lines(3),
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
        const controller = new EssayThemeController(data, driver);
        const created = await controller.create();
        expect(created.id).not.toBeNull();
        expect(created.id).not.toBeUndefined();
        expect(created.title).toEqual(data.title);
        done();
    })
})