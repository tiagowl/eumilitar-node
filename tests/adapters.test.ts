import AuthController from '../src/adapters/controllers/Auth';
import knex from 'knex';
import bcrypt from 'bcrypt';
import settings from '../src/settings';
import faker from 'faker';
import { UserService } from '../src/adapters/models/User';
import { TokenService } from '../src/adapters/models/Token';

const dbSetting = {
    client: 'sqlite3',
    connection: {
        filename: ':memory:'
    },
    seeds: {
        directory: '~/tests/file'
    },
    useNullAsDefault: true,
    debug: true,
    pool: {
        min: 1,
        max: 10,
        idleTimeoutMillis: 360000 * 1000,
    }
}

const driver = knex(settings.database)

async function hashPassword(password: string) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

const userFactory = () => ({
    email: faker.internet.email(),
    passwd: faker.internet.password(),
    user_id: 43242345,
    first_name: faker.name.firstName(),
    last_name: faker.name.lastName(),
    status: 1,
    permission: 1,
    date_created: new Date(),
    date_modified: new Date()
})

describe('Testes na autenticação', () => {
    const user = userFactory()
    const service = UserService(driver);
    beforeAll(async (done) => {
        const userDB = { ...user, passwd: await hashPassword(user.passwd) }
        driver.migrate.latest()
        service.insert(userDB)
            .finally(done);
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
        service.where('user_id', user.user_id)
            .where('email', user.email)
            .delete()
            .finally(done)
    })
})
