import faker from 'faker';
import supertest from 'supertest';
import { UserService } from '../src/adapters/models/User';
import Application from '../src/drivers/api';
import { appFactory, deleteUser, driverFactory, generateConfirmationToken, saveConfirmationToken, saveUser, smtpFactory, userFactory } from './shortcuts';
import crypto from 'crypto';

const driver = driverFactory();

beforeAll(async (done) => {
    await driver.migrate.latest()
    done()
})

afterAll((done) => driver.destroy().finally(done))

describe('Teste na api', () => {
    const user = userFactory();
    beforeAll(async (done) => {
        const service = UserService(driver);
        saveUser(user, service).finally(done)
    })
    afterAll(async (done) => {
        const service = UserService(driver);
        await deleteUser(user, service)
        done()
    })
    it('Teste no login', async (done) => {
        const app = await appFactory();
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
        const app = await appFactory();
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
        const app = await appFactory();
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
        const app = await appFactory();
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
        const app = await appFactory();
        const api = supertest(app.server);
        const credentials = { email: user.email };
        const response = await api.post('/password-recoveries/')
            .send(credentials)
        expect(response.body).toEqual({ message: "Email enviado! Verifique sua caixa de entrada." });
        expect(response.status).toBe(201);
        done();
    })
    test('Verificar token de mudança de senha', async (done) => {
        const app = await appFactory();
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
    test('Recuperar senha', async done => {
        const app = await appFactory();
        const api = supertest(app.server);
        const token = await generateConfirmationToken();
        const service = UserService(driver);
        const userData = await service.where('email', user.email).first();
        saveConfirmationToken(token, userData?.user_id || 0, driver);
        const credentials = {
            token,
            password: 'abda143501',
            confirmPassword: 'abda143501',
        }
        const response = await api.put('/users/profile/password/')
            .send(credentials);
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ updated: true });
        const checkResponse = await api.get(`/password-recoveries/${encodeURIComponent(token)}/`);
        expect(checkResponse.status).toBe(200)
        expect(checkResponse.body).toEqual({ isValid: false });
        done();
    })
    test('Recuperar senha com token inválido', async done => {
        const app = await appFactory();
        const api = supertest(app.server);
        const invalidToken = await generateConfirmationToken();
        const credentials = {
            token: invalidToken,
            password: 'abda143501',
            confirmPassword: 'abda143501',
        }
        const response = await api.put('/users/profile/password/')
            .send(credentials);
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ "message": "Token inválido" });
        done();
    })
    test('Recuperar senha com token expirado', async done => {
        const app = await appFactory();
        const api = supertest(app.server);
        const token = await generateConfirmationToken();
        const service = UserService(driver);
        const userData = await service.where('email', user.email).first();
        saveConfirmationToken(token, userData?.user_id || 0, driver, new Date());
        const credentials = {
            token,
            password: 'abda143501',
            confirmPassword: 'abda143501',
        }
        const response = await api.put('/users/profile/password/')
            .send(credentials);
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ "message": "Token inválido" });
        done();
    })
    test('Verificação do perfil do usuário', async done => {
        const app = await appFactory();
        const api = supertest(app.server);
        const credentials = {
            email: user.email,
            password: 'abda143501',
        }
        const auth = await api.post('/tokens/')
            .send(credentials)
            .set('User-Agent', faker.internet.userAgent());
        const { token } = auth.body;
        expect(token).not.toBeUndefined();
        expect(token).not.toBeNull();
        const header = `Bearer ${token}`
        const response = await api.get('/users/profile/')
            .set('Authorization', header);
        expect(response.body.message).toBeUndefined();
        expect(response.status).toBe(200);
        expect(response.body.email).toEqual(user.email)
        expect(response.body.password).toBeUndefined();
        done();
    })
    test('Verificação do perfil do usuário não autenticado', async done => {
        const app = await appFactory();
        const api = supertest(app.server);
        const response = await api.get('/users/profile/')
        expect(response.body.message).toEqual('Token não fornecido');
        expect(response.status).toBe(401);
        done();
    })
    test('Verificação do perfil do usuário com token inválido', async done => {
        const app = await appFactory();
        const api = supertest(app.server);
        const token = crypto.randomBytes(32).toString('base64');
        expect(token).not.toBeUndefined();
        expect(token).not.toBeNull();
        const header = `Bearer ${token}`
        const response = await api.get('/users/profile/')
            .set('Authorization', header);
        expect(response.body.message).toEqual('Não autorizado');
        expect(response.status).toBe(401);
        expect(response.body.email).toBeUndefined();
        expect(response.body.password).toBeUndefined();
        done();
    })
})
