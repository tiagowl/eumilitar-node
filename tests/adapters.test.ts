import AuthController from '../src/adapters/controllers/Auth';
import { UserService } from '../src/adapters/models/User';
import { TokenService } from '../src/adapters/models/Token';
import { deleteUser, driverFactory, saveUser, userFactory } from './shortcuts';

const driver = driverFactory()

describe('Testes na autenticação', () => {
    const user = userFactory()
    const service = UserService(driver);
    beforeAll(async (done) => {
        saveUser(user, service).finally(done)
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
        tokenService.where('session_id', token.token).first().then(dbToken => {
            expect(dbToken[0]).not.toBeNull()
            done();
        })
    })
    afterAll((done) => {
        deleteUser(user, service)
            .finally(done)
    })
})


afterAll(() => {
    driver.destroy()
})