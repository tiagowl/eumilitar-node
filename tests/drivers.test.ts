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
        saveUser(user, service).finally(done)
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
    it('Teste login falho', async (done) => {
        const wrongCredentials = {
            email: 'lsjflas@faldfjl.comdd',
            password: 'flasjdfljslfj',
        }
        const response = await api.post('/tokens/')
            .send(wrongCredentials)
            .set('User-Agent', faker.internet.userAgent())
        expect(response.status).toBe(400)
        expect(response.body.errors.length).toBe(2)
        done()
    })
    it('Senha errada', async done => {
        const wrongPassword = {
            email: user.email,
            password: '454',
        }
        const response = await api.post('/tokens/')
            .send(wrongPassword)
            .set('User-Agent', faker.internet.userAgent())
        expect(response.status).toBe(400)
        expect(response.body.errors.length).toBe(1)
        done()
    })
    afterAll(async (done) => {
        await deleteUser(user, service)
        await driver.destroy()
        done()
    })
})