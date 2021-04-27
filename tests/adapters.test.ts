import AuthController from '../src/adapters/controllers/Auth';
import { UserService } from '../src/adapters/models/User';
import { TokenService } from '../src/adapters/models/Token';
import { deleteUser, driverFactory, saveUser, smtpFactory, userFactory } from './shortcuts';
import PasswordRecoveryController from '../src/adapters/controllers/PasswordRecovery';
import settings from '../src/settings';
import { PasswordRecoveryService } from '../src/adapters/models/PasswordRecoveries';

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
            expect(error).toEqual({ message: "Email inválido" });
        }
        done()
    })
    afterAll((done) => {
        const service = UserService(driver);
        deleteUser(user, service)
            .finally(done)
    })
})


afterAll(async (done) => {
    await driver.destroy()
    done()
})