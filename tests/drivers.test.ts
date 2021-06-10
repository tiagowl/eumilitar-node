import faker from 'faker';
import supertest from 'supertest';
import { UserModel, UserService } from '../src/adapters/models/User';
import { appFactory, createEssay, deleteUser, driverFactory, generateConfirmationToken, saveConfirmationToken, saveUser, smtpFactory, userFactory } from './shortcuts';
import crypto from 'crypto';
import EssayThemeRepository, { EssayThemeService } from '../src/adapters/models/EssayTheme';
import { Course } from '../src/entities/EssayTheme';
import { EssayThemeCreation } from '../src/cases/EssayThemeCase';

const driver = driverFactory();

beforeAll(async (done) => {
    await driver.migrate.latest().finally(done)
    done()
})

afterAll((done) => driver.destroy().finally(done) || done())

async function authenticate(user: UserModel, api: supertest.SuperTest<supertest.Test>) {
    const credentials = {
        email: user.email,
        password: user.passwd,
    }
    const auth = await api.post('/tokens/')
        .send(credentials)
        .set('User-Agent', faker.internet.userAgent());
    const { token } = auth.body;
    return token;
}

describe('#1 Teste na api do usuário', () => {
    const user = userFactory();
    beforeAll(async (done) => {
        const service = UserService(driver);
        await saveUser(user, service);
        const themeService = EssayThemeService(driver);
        await themeService.del().delete()
        done()
    })
    afterAll(async (done) => {
        const service = UserService(driver);
        await deleteUser(user, service);
        const themeService = EssayThemeService(driver);
        await themeService.del().delete()
        done()
    })
    it('Teste no login', async (done) => {
        const app = await appFactory(driver);
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
        const app = await appFactory(driver);
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
        const app = await appFactory(driver);
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
        const app = await appFactory(driver);
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
        const app = await appFactory(driver);
        const api = supertest(app.server);
        const credentials = { email: user.email };
        const response = await api.post('/password-recoveries/')
            .send(credentials)
        expect(response.body).toEqual({ message: "Email enviado! Verifique sua caixa de entrada." });
        expect(response.status).toBe(201);
        done();
    })
    test('Verificar token de mudança de senha', async (done) => {
        const app = await appFactory(driver);
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
        const app = await appFactory(driver);
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
        const app = await appFactory(driver);
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
        const app = await appFactory(driver);
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
        const app = await appFactory(driver);
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
        const app = await appFactory(driver);
        const api = supertest(app.server);
        const response = await api.get('/users/profile/')
        expect(response.body.message).toEqual('Não autenticado');
        expect(response.status).toBe(401);
        done();
    })
    test('Verificação do perfil do usuário com token inválido', async done => {
        const app = await appFactory(driver);
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
    test('Logout', async done => {
        const app = await appFactory(driver);
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
        expect(response.status).toEqual(204);
        const notResponse = await api.delete('/tokens/')
            .set('Authorization', header);
        expect(notResponse.status).toEqual(401);
        done();
    })
    test('Listar usuários', async (done) => {
        const app = await appFactory(driver);
        const api = supertest(app.server);
        const token = await authenticate(user, api)
        const header = `Bearer ${token}`;
        const { body, status, error} = await api.get('/users/')
            .set('Authorization', header);
        expect(status, JSON.stringify({ body, error })).toBe(200);
        expect(body, JSON.stringify(body)).toBeInstanceOf(Array);
        expect(body.length, JSON.stringify(body)).toBeGreaterThan(0);
        done();
    })
})

describe('#2 Testes nos temas', () => {
    const user: UserModel = userFactory();
    beforeAll(async (done) => {
        const service = UserService(driver);
        await saveUser(user, service);
        const themeService = EssayThemeService(driver);
        await themeService.del().delete()
        done()
    })
    afterAll(async (done) => {
        const service = UserService(driver);
        await deleteUser(user, service);
        const themeService = EssayThemeService(driver);
        await themeService.del().delete()
        done()
    })
    test('Testes na criação de temas', async done => {
        const app = await appFactory(driver);
        const api = supertest(app.server);
        const credentials = {
            email: user.email,
            password: user.passwd,
        }
        const auth = await api.post('/tokens/')
            .send(credentials)
            .set('User-Agent', faker.internet.userAgent());
        const { token } = auth.body;
        expect(token).not.toBeUndefined();
        expect(token).not.toBeNull();
        const header = `Bearer ${token}`;
        const buffer = Buffer.from(new ArrayBuffer(10), 0, 2);
        const theme = {
            title: 'Título',
            startDate: new Date(Date.now() - 15 * 25 * 60 * 60),
            endDate: new Date(Date.now() - 2 * 25 * 60 * 60),
            helpText: faker.lorem.paragraph(1),
            courses: ['espcex'],
            themeFile: buffer
        }
        const response = await api.post('/themes/')
            .set('Authorization', header)
            .field('data', JSON.stringify(theme))
            .attach('themeFile', buffer, { filename: 'field.pdf', contentType: 'application/pdf' })
        expect(response.status, JSON.stringify(response.body)).toEqual(201);
        expect(response.body.title).toEqual('Título')
        expect(response.body.id).not.toBeUndefined()
        expect(response.body.id).not.toBeNull()
        done();
    })
    test('Testes na listagem de temas', async done => {
        const app = await appFactory(driver);
        const api = supertest(app.server);
        const credentials = {
            email: user.email,
            password: user.passwd,
        }
        const auth = await api.post('/tokens/')
            .send(credentials)
            .set('User-Agent', faker.internet.userAgent());
        const { token } = auth.body;
        expect(token).not.toBeUndefined();
        expect(token).not.toBeNull();
        const header = `Bearer ${token}`;
        const response = await api.get('/themes/')
            .set('Authorization', header);
        expect(response.body?.page, response.error.toString()).not.toBeUndefined()
        expect(response.body?.count).not.toBeUndefined()
        expect(response.body?.count).toBe(response.body?.page?.length)
        done()
    })
    test('Atualização de temas', async done => {
        const app = await appFactory(driver);
        const api = supertest(app.server);
        const token = await authenticate(user, api)
        const header = `Bearer ${token}`;
        const buffer = Buffer.from(new ArrayBuffer(10), 0, 2);
        const themes = await api.get('/themes/')
            .set('Authorization', header)
        const selected = themes.body.page[0];
        const theme = {
            title: faker.name.title(),
            startDate: new Date(Date.now() - 1500 * 25 * 60 * 60),
            endDate: new Date(Date.now() - 1495 * 25 * 60 * 60),
            helpText: faker.lorem.paragraph(2),
            courses: ['espcex', 'esa'],
        }
        const response = await api.put(`/themes/${selected.id}/`)
            .set('Authorization', header)
            .field('data', JSON.stringify(theme))
            .attach('themeFile', buffer, { filename: 'field.pdf', contentType: 'application/pdf' })
        expect(response.status, JSON.stringify(response.body)).toEqual(200);
        expect(response.body.title).toEqual(theme.title)
        expect(response.body.title).not.toEqual(selected.title)
        expect(response.body.id).not.toBeUndefined()
        expect(response.body.id).not.toBeNull()
        expect(response.body.id).toEqual(selected.id)
        done();
    })
    test('Desativação do tema', async done => {
        const app = await appFactory(driver);
        const api = supertest(app.server);
        const token = await authenticate(user, api)
        const header = `Bearer ${token}`;
        const themes = await api.get('/themes/')
            .set('Authorization', header)
        const selected = themes.body.page[0];
        const response = await api.delete(`/themes/${selected.id}/`)
            .set('Authorization', header)
        expect(response.status, response.body?.message).toBe(200)
        expect(response.body.deactivated).toBeTruthy();
        done();
    })
    test('Listagem de temas ativos', async done => {
        const app = await appFactory(driver);
        const api = supertest(app.server);
        const token = await authenticate(user, api)
        const header = `Bearer ${token}`;
        const themes = await api.get('/themes/?active=1')
            .set('Authorization', header);
        expect(themes.body.page).toBeInstanceOf(Array);
        themes.body.page.forEach((theme: any) => {
            expect(theme.active, JSON.stringify(theme)).toBeTruthy();
        })
        done()
    })
})

describe('#3 Redações', () => {
    const user: UserModel = userFactory();
    const student: UserModel = userFactory({ permission: 2 });
    beforeAll(async (done) => {
        const themeService = EssayThemeService(driver);
        await themeService.delete().del()
        const repository = new EssayThemeRepository(driver);
        const themeData: EssayThemeCreation = {
            title: 'Título',
            endDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 60),
            startDate: new Date(Date.now() - 160 * 24 * 60 * 60 * 60),
            helpText: faker.lorem.lines(3),
            file: '/usr/share/data/theme.pdf',
            courses: new Set(['esa', 'espcex'] as Course[]),
            deactivated: false,
        }
        const theme = await repository.create(themeData);
        expect(theme.id).not.toBeUndefined();
        expect(theme.id).not.toBeNull();
        const service = UserService(driver);
        await saveUser(user, service);
        await saveUser(student, service);
        done()
    })
    afterAll(async (done) => {
        const service = UserService(driver);
        await deleteUser(user, service);
        const themeService = EssayThemeService(driver);
        await themeService.del().delete();
        done()
    })
    test('Criação', async done => {
        const app = await appFactory(driver);
        const api = supertest(app.server);
        const token = await authenticate(user, api)
        const header = `Bearer ${token}`;
        const buffer = Buffer.from(new ArrayBuffer(10), 0, 2);
        const { body, status, error } = await api.post('/essays/')
            .set('Authorization', header)
            .field('course', 'esa')
            .attach('file', buffer, { filename: 'file.png', contentType: 'image/png' })
        expect(body.id, JSON.stringify({ body, error })).not.toBeUndefined();
        expect(status, JSON.stringify({ body, error })).toBe(201);
        done();
    })
    test('Listagem', async done => {
        const app = await appFactory(driver);
        const api = supertest(app.server);
        const token = await authenticate(student, api)
        const header = `Bearer ${token}`;
        const { body, status, error } = await api.get('/essays/')
            .set('Authorization', header);
        expect(body.length, JSON.stringify({ body, error })).not.toBeUndefined();
        expect(status, JSON.stringify({ body, error })).toBe(200);
        body.forEach((essay: any) => {
            expect(essay.course).toBeDefined();
            expect(essay.id).toBeDefined();
            expect(essay.file).toBeDefined();
        })
        done();
    })
    test('Listagem de todos', async done => {
        const app = await appFactory(driver);
        const api = supertest(app.server);
        const token = await authenticate(user, api)
        const header = `Bearer ${token}`;
        const { body, status, error } = await api.get('/essays/')
            .set('Authorization', header);
        expect(body.page, JSON.stringify({ body, error })).not.toBeUndefined();
        expect(body.page, JSON.stringify({ body, error })).toBeInstanceOf(Array);
        expect(status, JSON.stringify({ body, error })).toBe(200);
        body.page.forEach((essay: any) => {
            expect(essay.course).toBeDefined();
            expect(essay.id).toBeDefined();
            expect(essay.file).toBeDefined();
        })
        done();
    })
    test('Recuperação de uma redação', async done => {
        const app = await appFactory(driver);
        const api = supertest(app.server);
        const token = await authenticate(user, api)
        const header = `Bearer ${token}`;
        const base = await createEssay(driver, user.user_id);
        const response = await api.get(`/essays/${base.id}/`)
            .set('Authorization', header);
        expect(response.status, JSON.stringify(response.body)).toBe(200);
        expect(response.body).toBeDefined();
        expect(response.body).toMatchObject(base);
        done();
    })
    test('Início da correção da redação', async done => {
        const app = await appFactory(driver);
        const api = supertest(app.server);
        const token = await authenticate(user, api)
        const header = `Bearer ${token}`;
        const base = await createEssay(driver, user.user_id);
        const response = await api.post(`/essays/${base.id}/corrector/`)
            .set('Authorization', header);
        expect(response.status, JSON.stringify(response.body)).toBe(201);
        expect(response.body).toBeDefined();
        expect(response.body).toMatchObject(base);
        expect(response.body.corrector.id).toEqual(user.user_id)
        done();
    })
    test('Cancelamento da correção', async done => {
        const app = await appFactory(driver);
        const api = supertest(app.server);
        const token = await authenticate(user, api)
        const header = `Bearer ${token}`;
        const base = await createEssay(driver, user.user_id);
        await api.post(`/essays/${base.id}/corrector/`)
            .set('Authorization', header);
        const response = await api.delete(`/essays/${base.id}/corrector/`)
            .set('Authorization', header);
        expect(response.status, JSON.stringify(response.body)).toBe(200);
        expect(response.body, JSON.stringify(response.body)).toBeDefined();
        expect(response.body, JSON.stringify(response.body)).toMatchObject(base);
        expect(response.body.corrector, JSON.stringify(response.body)).toBeNull();
        done();
    })
})

describe('#4 Invalidação da redação', () => {
    const user: UserModel = userFactory();
    const student: UserModel = userFactory({ permission: 2 });
    beforeAll(async (done) => {
        const themeService = EssayThemeService(driver);
        await themeService.delete().del()
        const repository = new EssayThemeRepository(driver);
        const themeData: EssayThemeCreation = {
            title: 'Título',
            endDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 60),
            startDate: new Date(Date.now() - 160 * 24 * 60 * 60 * 60),
            helpText: faker.lorem.lines(3),
            file: '/usr/share/data/theme.pdf',
            courses: new Set(['esa', 'espcex'] as Course[]),
            deactivated: false,
        }
        const theme = await repository.create(themeData);
        expect(theme.id).not.toBeUndefined();
        expect(theme.id).not.toBeNull();
        const service = UserService(driver);
        await saveUser(user, service);
        await saveUser(student, service);
        done()
    })
    afterAll(async (done) => {
        const service = UserService(driver);
        await deleteUser(user, service);
        const themeService = EssayThemeService(driver);
        await themeService.del().delete();
        done()
    })
    test('Invalidação', async done => {
        const app = await appFactory(driver);
        const api = supertest(app.server);
        const token = await authenticate(user, api)
        const header = `Bearer ${token}`;
        const base = await createEssay(driver, user.user_id);
        await api.post(`/essays/${base.id}/corrector/`)
            .set('Authorization', header);
        const response = await api.post(`/essays/${base.id}/invalidation/`)
            .send({ reason: 'invalid', comment: faker.lorem.lines(3) })
            .set('Authorization', header);
        expect(response.status, JSON.stringify(response.body)).toBe(201);
        expect(response.body, JSON.stringify(response.body)).toBeDefined();
        expect(response.body.essay).toBe(base.id);
        expect(response.body.corrector).toBe(user.user_id);
        done();
    })
})

describe('#5 Correção da redação', () => {
    const user: UserModel = userFactory();
    const student: UserModel = userFactory({ permission: 2 });
    beforeAll(async (done) => {
        const themeService = EssayThemeService(driver);
        await themeService.delete().del()
        const repository = new EssayThemeRepository(driver);
        const themeData: EssayThemeCreation = {
            title: 'Título',
            endDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 60),
            startDate: new Date(Date.now() - 160 * 24 * 60 * 60 * 60),
            helpText: faker.lorem.lines(3),
            file: '/usr/share/data/theme.pdf',
            courses: new Set(['esa', 'espcex'] as Course[]),
            deactivated: false,
        }
        const theme = await repository.create(themeData);
        expect(theme.id).not.toBeUndefined();
        expect(theme.id).not.toBeNull();
        const service = UserService(driver);
        await saveUser(user, service);
        await saveUser(student, service);
        done()
    })
    afterAll(async (done) => {
        const service = UserService(driver);
        await deleteUser(user, service);
        const themeService = EssayThemeService(driver);
        await themeService.del().delete();
        done()
    })
    test('Criação', async done => {
        const app = await appFactory(driver);
        const api = supertest(app.server);
        const token = await authenticate(user, api)
        const header = `Bearer ${token}`;
        const base = await createEssay(driver, user.user_id);
        await api.post(`/essays/${base.id}/corrector/`)
            .set('Authorization', header);
        const response = await api.post(`/essays/${base.id}/correction/`)
            .send({
                'accentuation': "Sim",
                'agreement': "Sim",
                'cohesion': "Sim",
                'comment': faker.lorem.lines(5),
                'conclusion': "Sim",
                'erased': "Não",
                'followedGenre': "Sim",
                'hasMarginSpacing': "Sim",
                'isReadable': "Sim",
                'obeyedMargins': "Sim",
                'organized': "Sim",
                'orthography': "Sim",
                'points': 8.55,
                'repeated': "Não",
                'understoodTheme': "Sim",
                'veryShortSentences': "Não",
            })
            .set('Authorization', header);
        expect(response.status, JSON.stringify(response.body)).toBe(201);
        expect(response.body, JSON.stringify(response.body)).toBeDefined();
        expect(response.body.essay).toBe(base.id);
        done();
    })
    test('Recuperação', async done => {
        const app = await appFactory(driver);
        const api = supertest(app.server);
        const token = await authenticate(user, api)
        const header = `Bearer ${token}`;
        const base = await createEssay(driver, user.user_id);
        const data = {
            'accentuation': "Sim",
            'agreement': "Sim",
            'cohesion': "Sim",
            'comment': faker.lorem.lines(5),
            'conclusion': "Sim",
            'erased': "Não",
            'followedGenre': "Sim",
            'hasMarginSpacing': "Sim",
            'isReadable': "Sim",
            'obeyedMargins': "Sim",
            'organized': "Sim",
            'orthography': "Sim",
            'points': 7.55,
            'repeated': "Não",
            'understoodTheme': "Sim",
            'veryShortSentences': "Não",
        }
        await api.post(`/essays/${base.id}/corrector/`)
            .set('Authorization', header);
        const created = await api.post(`/essays/${base.id}/correction/`)
            .send(data)
            .set('Authorization', header);
        expect(created.status, JSON.stringify(created.body)).toBe(201);
        expect(created.body, JSON.stringify(created.body)).toBeDefined();
        const response = await api.get(`/essays/${base.id}/correction/`)
            .set('Authorization', header);
        expect(response.status, JSON.stringify(response.body)).toBe(200);
        expect(response.body, JSON.stringify(response.body)).toBeDefined();
        expect(response.body.essay).toBe(base.id);
        (Object.entries(data) as [keyof typeof data, any][])
            .forEach(([key, value]) => {
                expect(response.body[key]).toBeDefined();
                expect(response.body[key]).toBe(value);
            });
        done();
    })
})
