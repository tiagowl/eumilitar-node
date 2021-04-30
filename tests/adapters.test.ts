import AuthController from '../src/adapters/controllers/Auth';
import { UserService } from '../src/adapters/models/User';
import { TokenService } from '../src/adapters/models/Token';
import { deleteUser, driverFactory, generateConfirmationToken, saveConfirmationToken, saveUser, smtpFactory, userFactory } from './shortcuts';
import PasswordRecoveryController from '../src/adapters/controllers/PasswordRecovery';
import settings from '../src/settings';
import { PasswordRecoveryService } from '../src/adapters/models/PasswordRecoveries';
import CheckPasswordToken from '../src/adapters/controllers/CheckPasswordToken';
import ChangePasswordController from '../src/adapters/controllers/ChangePassword';
import CheckAuth from '../src/adapters/controllers/CheckAuth';

const driver = driverFactory()

beforeAll(async (done) => {
    await driver.migrate.latest();
    done();
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
    test('Verificação do token de autenticação', async done => {
        const credentials = {
            email: user.email,
            password: 'newPassword'
        };
        const auth = new AuthController(credentials, driver);
        const token = (await auth.auth()).token || '';
        const controller = new CheckAuth({ token }, driver);
        const response = await controller.check();
        expect(response.isAuthenticated).toBeTruthy();
        expect(user.email).toEqual(response.user?.email)
        done();
    })
})


afterAll(async (done) => {
    await driver.destroy()
    done()
})