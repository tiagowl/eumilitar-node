import faker from "faker";
import supertest from "supertest";
import { v4 } from "uuid";
import { userFactory, db, saveUser, deleteUser, appFactory, jp, generateConfirmationToken, saveConfirmationToken } from "../../../tests/shortcuts";
import { EssayThemeService } from "../../adapters/models/EssayTheme";
import { RecoveryService } from "../../adapters/models/Recovery";
import { UserService } from "../../adapters/models/User";
import { UserUpdate } from "../../cases/User";
import { authenticate } from "./tools";
import crypto from "crypto";

describe('#1 Teste na api do usuário', () => {
    const user = userFactory({ permission: 1 });
    beforeAll(async (done) => {
        const deleted = await UserService(db).where('user_id', user.user_id).delete();
        const [id] = await saveUser(user, UserService(db));
        await EssayThemeService(db).del().delete();
        done()
    })
    afterAll(async (done) => {
        await deleteUser(user, UserService(db));
        const themeService = EssayThemeService(db);
        await themeService.del().delete()
        done()
    })
    it('#11 Teste no login', async (done) => {
        const app = await appFactory();
        const api = supertest(app.server);
        const credentials = {
            email: user.email,
            password: user.passwd,
        }
        const response = await api.post('/tokens/')
            .send(credentials)
            .set('User-Agent', faker.internet.userAgent());
        expect(response.status, JSON.stringify(response.body)).toBe(201);
        expect(response.body.token).not.toBeNull()
        done()
    })
    it('#12 Teste login falho', async (done) => {
        const app = await appFactory();
        const api = supertest(app.server);
        const wrongCredentials = {
            email: 'lsjflas@faldfjl.comdd',
            password: user.passwd,
        }
        const response = await api.post('/tokens/')
            .send(wrongCredentials)
            .set('User-Agent', faker.internet.userAgent())
        expect(response.status, jp(response.body)).toBe(400)
        expect(response.body.token).toBeUndefined()
        expect(response.body.errors.length).toBe(1)
        expect(response.body.errors).toEqual([['email', 'Email inválido']])
        done()
    })
    it('#13 Senha errada', async done => {
        const app = await appFactory();
        const api = supertest(app.server);
        const wrongPassword = {
            email: user.email,
            password: '454',
        }
        const response = await api.post('/tokens/')
            .send(wrongPassword)
            .set('User-Agent', faker.internet.userAgent())
        expect(response.status, jp(response.body)).toBe(400)
        expect(response.body.errors.length).toBe(1)
        expect(response.body.token).toBeUndefined()
        expect(response.body.errors).toEqual([['password', 'Senha inválida']])
        done()
    })
    it('#14 Email errado', async (done) => {
        const app = await appFactory();
        const api = supertest(app.server);
        const wrongPassword = {
            email: 'fdd',
            password: '454',
        }
        const response = await api.post('/tokens/')
            .send(wrongPassword)
            .set('User-Agent', faker.internet.userAgent())
        expect(response.status, jp(response.body)).toBe(400)
        expect(response.body.errors.length).toBe(1)
        expect(response.body.token).toBeUndefined()
        expect(response.body.errors).toEqual([['email', 'Informe um email válido']])
        done()
    })
    it('#15 Recuperação de senha', async (done) => {
        const app = await appFactory();
        const api = supertest(app.server);
        const credentials = { email: user.email, type: 'email', session: v4() };
        const response = await api.post('/password-recoveries/')
            .send(credentials)
        expect(response.body).toEqual({ message: "Email enviado! Verifique sua caixa de entrada." });
        expect(response.status).toBe(201);
        done();
    });
    test('#16 Verificar token de mudança de senha', async (done) => {
        const app = await appFactory();
        const api = supertest(app.server);
        const token = await generateConfirmationToken();
        const service = UserService(db);
        const userData = await service.where('email', user.email).first();
        await saveConfirmationToken(token, userData?.user_id || 0, db);
        const response = await api.get(`/password-recoveries/${encodeURIComponent(token)}/`);
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ isValid: true });
        done();
    })
    test('#17 Recuperar senha', async done => {
        const app = await appFactory();
        const api = supertest(app.server);
        const token = await generateConfirmationToken();
        const service = UserService(db);
        const userData = await service.where('email', user.email).first();
        await saveConfirmationToken(token, userData?.user_id || 0, db);
        const credentials = {
            token,
            password: 'abda143501',
            confirmPassword: 'abda143501',
        }
        const response = await api.put('/users/profile/password/')
            .send(credentials);
        expect(response.status, jp(response.body)).toBe(200);
        expect(response.body).toEqual({ updated: true });
        const checkResponse = await api.get(`/password-recoveries/${encodeURIComponent(token)}/`);
        expect(checkResponse.status).toBe(200)
        expect(checkResponse.body).toEqual({ isValid: false });
        done();
    })
    test('#18 Recuperar senha com token inválido', async done => {
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
        expect(response.body).toEqual({ "message": "Token inválido", status: 400 });
        done();
    })
    test('#19 Recuperar senha com token expirado', async done => {
        const app = await appFactory();
        const api = supertest(app.server);
        const token = await generateConfirmationToken();
        const service = UserService(db);
        const userData = await service.where('email', user.email).first();
        await saveConfirmationToken(token, userData?.user_id || 0, db, new Date(Date.now() - 1000));
        const credentials = {
            token,
            password: 'abda143501',
            confirmPassword: 'abda143501',
        }
        const response = await api.put('/users/profile/password/')
            .send(credentials);
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ "message": "Token expirado", status: 400 });
        done();
    })
    test('#191 Verificação do perfil do usuário', async done => {
        const app = await appFactory();
        const api = supertest(app.server);
        const credentials = {
            email: user.email,
            password: user.passwd,
        }
        const auth = await api.post('/tokens/')
            .send(credentials)
            .set('User-Agent', faker.internet.userAgent());
        const { token } = auth.body;
        expect(token).toBeDefined();
        expect(token).not.toBeNull();
        const header = `Bearer ${token}`
        const response = await api.get('/users/profile/')
            .set('Authorization', header);
        expect(response.body.message, jp({ token, body: response.body })).toBeUndefined();
        expect(response.status).toBe(200);
        expect(response.body.email).toEqual(user.email)
        expect(response.body.password).toBeUndefined();
        done();
    })
    test('#192 Verificação do perfil do usuário não autenticado', async done => {
        const app = await appFactory();
        const api = supertest(app.server);
        const response = await api.get('/users/profile/')
        expect(response.body.message).toEqual('Não autenticado');
        expect(response.status).toBe(401);
        done();
    })
    test('#193 Verificação do perfil do usuário com token inválido', async done => {
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
    test('#194 Logout', async done => {
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
        const header = `Bearer ${token}`;
        const response = await api.delete('/tokens/')
            .set('Authorization', header);
        expect(response.status, jp(response.body)).toEqual(204);
        const notResponse = await api.delete('/tokens/')
            .set('Authorization', header);
        expect(notResponse.status).toEqual(401);
        done();
    })
    test('#195 Listar usuários', async (done) => {
        const app = await appFactory();
        const api = supertest(app.server);
        const token = await authenticate(user, api)
        const header = `Bearer ${token}`;
        const { body, status, error } = await api.get('/users/')
            .set('Authorization', header);
        expect(status, jp({ body, error, header })).toBe(200);
        expect(body, jp(body)).toBeInstanceOf(Array);
        expect(body.length, jp(body)).toBeGreaterThan(0);
        done();
    });
    test('#196 Criar usuários', async done => {
        const app = await appFactory();
        const api = supertest(app.server);
        const token = await authenticate(user, api)
        const header = `Bearer ${token}`;
        const { body, status, error } = await api.post('/users/')
            .set('Authorization', header)
            .send({
                email: faker.internet.email(),
                firstName: faker.name.firstName(),
                lastName: faker.name.lastName(),
                password: faker.internet.password(),
                permission: 'admin',
                status: 'active',
            });
        expect(status, jp({ body, error, header })).toBe(201);
        expect(body.email).toBeDefined();
        expect(body.id).toBeDefined();
        expect(body.password).toBeUndefined();
        done();
    });
    test('#197 Listar usuários com paginação', async (done) => {
        const app = await appFactory();
        const api = supertest(app.server);
        const token = await authenticate(user, api)
        const header = `Bearer ${token}`;
        const { body, status, error } = await api.get(`/users/`)
            .query({
                pagination: { pageSize: 5, ordering: 'id' }
            })
            .set('Authorization', header);
        expect(status, jp({ body, error, header })).toBe(200);
        expect(body.page, jp(body)).toBeInstanceOf(Array);
        expect(body.page.length, jp(body)).toBeGreaterThan(0);
        expect(body.page.length, jp(body)).toBe(5);
        done();
    });
    test('#198 Atualização', async done => {
        const app = await appFactory();
        const api = supertest(app.server);
        const token = await authenticate(user, api)
        const header = `Bearer ${token}`;
        const data: UserUpdate = {
            email: faker.internet.email(),
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            permission: 'admin',
            status: 'active',
        };
        const { body, status } = await api.put(`/users/${user.user_id}/`)
            .send(data)
            .set('Authorization', header);
        expect(body.message, jp({ token, body: body })).toBeUndefined();
        expect(status).toBe(200);
        expect(body.password).toBeUndefined();
        Object.entries(data).forEach(([key, val]) => {
            if (key === 'password') expect(body[key as keyof typeof body]).toBeUndefined();
            else expect(body[(key as keyof typeof body)]).toBe(val);
        });
        user.email = data.email;
        done();
    });
    test('#199 recuperação do usuário', async done => {
        const app = await appFactory();
        const api = supertest(app.server);
        const token = await authenticate(user, api)
        const header = `Bearer ${token}`;
        const { body, status } = await api.get(`/users/${user.user_id}/`)
            .set('Authorization', header);
        expect(body.message, jp({ token, body: body })).toBeUndefined();
        expect(status).toBe(200);
        expect(body.id).toBeDefined();
        expect(body.password).toBeUndefined();
        done();
    });
    it('#1991 Recuperação de senha com sms', async (done) => {
        const app = await appFactory();
        const api = supertest(app.server);
        const session = v4();
        const credentials = { email: user.email, type: 'sms', session };
        const response = await api.post('/password-recoveries/')
            .send(credentials)
        expect(response.body).toEqual({ message: "SMS enviado para +11 (22) 3 44xx-xx55, verifique sua caixa de mensagens" });
        expect(response.status).toBe(201);
        const token = await RecoveryService(db).where({ user_id: user.user_id, selector: session }).first();
        const smsToken = { token: token?.token, session };
        const validated = await api.post('/password-recoveries/checks/')
            .send(smsToken);
        expect(validated.status, JSON.stringify({ body: validated.body, sent: smsToken })).toBe(201);
        expect(typeof validated.body.token).toBe('string');
        expect(validated.body.token.length).toBe(64);
        done();
    });
})