import knex from 'knex';
import faker from 'faker';
import supertest from 'supertest';
import { UserService } from '../src/adapters/models/User';
import Application from '../src/drivers/api';
import { deleteUser, driverFactory, saveUser, userFactory } from './shortcuts';

const driver = driverFactory();
const app = new Application(driver);
const api = supertest(app.server);

describe('Teste na api', () => {
    const user = userFactory();
    const service = UserService(driver);
    beforeAll(async (done) => {
        await saveUser(user, service);
        done()
    })
    it('Teste no login', async (done) => {
        const credentials = {
            email: user.email,
            password: user.passwd,
        }
        const response = await api.post('/tokens/')
            .send(credentials)
            .set('User-Agent', faker.internet.userAgent());
        expect(response.status).toBe(201);
        expect(response.body.token).not.toBeNull()
        done()
    })
    afterAll(async (done) => {
        deleteUser(user, service)
        await driver.destroy()
        done()
    })
})