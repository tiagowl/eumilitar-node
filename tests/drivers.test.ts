import faker from 'faker';
import supertest from 'supertest';
import { UserService } from '../src/adapters/models/User';
import Application from '../src/drivers/api';
import { deleteUser, driverFactory, generateConfirmationToken, saveConfirmationToken, saveUser, smtpFactory, userFactory } from './shortcuts';

const driver = driverFactory();

beforeAll(async (done) => {
    await driver.migrate.latest()
    done()
})

describe('Teste na api', () => {

    const user = userFactory();
    beforeAll(async (done) => {
        const service = UserService(driver);
        saveUser(user, service).finally(done)
    })
    it('Teste no login', async (done) => {
        const smtp = await smtpFactory()
        const app = new Application(driver, smtp);
        const api = supertest(app.server);
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
        const smtp = await smtpFactory()
        const app = new Application(driver, smtp);
        const api = supertest(app.server);
        const wrongCredentials = {
            email: 'lsjflas@faldfjl.comdd',
            password: user.passwd,
        }
        const response = await api.post('/tokens/')
            .send(wrongCredentials)
            .set('User-Agent', faker.internet.userAgent())
        expect(response.status).toBe(400)
        expect(response.body.token).toBeUndefined()
        expect(response.body.errors.length).toBe(1)
        expect(response.body.errors).toEqual([['email', 'Email inválido']])
        done()
    })
    it('Senha errada', async done => {
        const smtp = await smtpFactory()
        const app = new Application(driver, smtp);
        const api = supertest(app.server);
        const wrongPassword = {
            email: user.email,
            password: '454',
        }
        const response = await api.post('/tokens/')
            .send(wrongPassword)
            .set('User-Agent', faker.internet.userAgent())
        expect(response.status).toBe(400)
        expect(response.body.errors.length).toBe(1)
        expect(response.body.token).toBeUndefined()
        expect(response.body.errors).toEqual([['password', 'Senha inválida']])
        done()
    })
    it('Email errado', async (done) => {
        const smtp = await smtpFactory()
        const app = new Application(driver, smtp);
        const api = supertest(app.server);
        const wrongPassword = {
            email: 'fdd',
            password: '454',
        }
        const response = await api.post('/tokens/')
            .send(wrongPassword)
            .set('User-Agent', faker.internet.userAgent())
        expect(response.status).toBe(400)
        expect(response.body.errors.length).toBe(1)
        expect(response.body.token).toBeUndefined()
        expect(response.body.errors).toEqual([['email', 'Informe um email válido']])
        done()
    })
    it('Recuperação de senha', async (done) => {
        const smtp = await smtpFactory()
        const app = new Application(driver, smtp);
        const api = supertest(app.server);
        const credentials = { email: user.email };
        const response = await api.post('/password-recoveries/')
            .send(credentials)
        expect(response.body).toEqual({ message: "Email enviado! Verifique sua caixa de entrada." });
        expect(response.status).toBe(201);
        done();
    })
    test('Verificar token de mudança de senha', async (done) => {
        const smtp = await smtpFactory()
        const app = new Application(driver, smtp);
        const api = supertest(app.server);
        const token = await generateConfirmationToken();
        const service = UserService(driver);
        const userData = await service.where('email', user.email).first();
        saveConfirmationToken(token, userData?.user_id || 0, driver);
        const response = await api.get(`/password-recoveries/${encodeURIComponent(token)}/`);
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ isValid: true });
        done();
    })
    afterAll(async (done) => {
        const service = UserService(driver);
        await deleteUser(user, service)
        done()
    })
})

afterAll((done) => driver.destroy().finally(done))