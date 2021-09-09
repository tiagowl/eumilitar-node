import faker from 'faker';
import supertest from 'supertest';
import { UserModel, UserService } from '../src/adapters/models/User';
import { hottok, contextFactory, appFactory, createEssay, deleteUser, driver, generateConfirmationToken, saveConfirmationToken, saveUser, smtpFactory, userFactory, jp } from './shortcuts';
import crypto from 'crypto';
import EssayThemeRepository, { EssayThemeService } from '../src/adapters/models/EssayTheme';
import { Course } from '../src/entities/EssayTheme';
import { EssayThemeCreation } from '../src/cases/EssayThemeCase';
import SubscriptionRepository, { SubscriptionService } from '../src/adapters/models/Subscription';
import ProductRepository, { ProductService } from '../src/adapters/models/Product';
import qs from 'querystring';
import UserRepository from '../src/adapters/models/User';
import { UserCreation, UserUpdate } from '../src/cases/UserUseCase';

beforeAll(async (done) => {
    await driver.migrate.latest().finally(done)
    done()
});

afterAll((done) => driver.destroy().finally(done) || done())
const context = contextFactory();

async function authenticate(user: UserModel, api: supertest.SuperTest<supertest.Test>) {
    const credentials = {
        email: user.email,
        password: user.passwd,
    }
    const auth = await api.post('/tokens/')
        .send(credentials)
        .set('User-Agent', faker.internet.userAgent());
    const { token } = auth.body;
    expect(token, jp(auth.body)).toBeDefined();
    expect(typeof token).toBe('string');
    return token;
}

describe('#1 Teste na api do usuário', () => {
    const user = userFactory({ permission: 1 });
    beforeAll(async (done) => {
        const service = UserService(driver)
            .onConflict('user_id').merge();
        await saveUser(user, service);
        const themeService = EssayThemeService(driver);
        await themeService.del().delete();
        done()
    })
    afterAll(async (done) => {
        const service = UserService(driver);
        await deleteUser(user, service);
        const themeService = EssayThemeService(driver);
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
        const credentials = { email: user.email };
        const response = await api.post('/password-recoveries/')
            .send(credentials)
        expect(response.body).toEqual({ message: "Email enviado! Verifique sua caixa de entrada." });
        expect(response.status).toBe(201);
        done();
    })
    test('#16 Verificar token de mudança de senha', async (done) => {
        const app = await appFactory();
        const api = supertest(app.server);
        const token = await generateConfirmationToken();
        const service = UserService(driver);
        const userData = await service.where('email', user.email).first();
        await saveConfirmationToken(token, userData?.user_id || 0, driver);
        const response = await api.get(`/password-recoveries/${encodeURIComponent(token)}/`);
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ isValid: true });
        done();
    })
    test('#17 Recuperar senha', async done => {
        const app = await appFactory();
        const api = supertest(app.server);
        const token = await generateConfirmationToken();
        const service = UserService(driver);
        const userData = await service.where('email', user.email).first();
        await saveConfirmationToken(token, userData?.user_id || 0, driver);
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
        const service = UserService(driver);
        const userData = await service.where('email', user.email).first();
        await saveConfirmationToken(token, userData?.user_id || 0, driver, new Date(Date.now() - 1000));
        const credentials = {
            token,
            password: 'abda143501',
            confirmPassword: 'abda143501',
        }
        const response = await api.put('/users/profile/password/')
            .send(credentials);
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ "message": "Token inválido", status: 400 });
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
})

describe('#2 Testes nos temas', () => {
    const user: UserModel = userFactory();
    beforeAll(async (done) => {
        const service = UserService(driver)
            .onConflict('user_id').merge();
        await saveUser(user, service);
        await EssayThemeService(driver).del().delete()
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
        expect(token).not.toBeUndefined();
        expect(token).not.toBeNull();
        const header = `Bearer ${token}`;
        const buffer = Buffer.from(new ArrayBuffer(10), 0, 2);
        const theme = {
            title: 'Título',
            startDate: new Date(Date.now() - 15 * 25 * 60 * 60),
            endDate: new Date(Date.now() - 2 * 25 * 60 * 60),
            helpText: faker.lorem.paragraph(10),
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
        const app = await appFactory();
        const api = supertest(app.server);
        const token = await authenticate(user, api);
        expect(token).not.toBeUndefined();
        expect(token).not.toBeNull();
        const header = `Bearer ${token}`;
        const buffer = Buffer.from(new ArrayBuffer(10), 0, 2);
        const themes = await api.get('/themes/')
            .set('Authorization', header);
        expect(themes.status, jp(themes.body)).toBe(200);
        const [selected] = themes.body.page || [];
        expect(selected).toBeDefined();
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
        expect(response.status, jp(response.body)).toEqual(200);
        expect(response.body.title).toEqual(theme.title)
        expect(response.body.title).not.toEqual(selected.title)
        expect(response.body.id).not.toBeUndefined()
        expect(response.body.id).not.toBeNull()
        expect(response.body.id).toEqual(selected.id)
        done();
    })
    test('Desativação do tema', async done => {
        const app = await appFactory();
        const api = supertest(app.server);
        const token = await authenticate(user, api)
        const header = `Bearer ${token}`;
        const themes = await api.get('/themes/')
            .set('Authorization', header);
        expect(themes.status, jp(themes.body)).toBe(200);
        const [selected] = themes.body.page;
        const response = await api.delete(`/themes/${selected.id}/`)
            .set('Authorization', header)
        expect(response.status, response.body?.message).toBe(200)
        expect(response.body.deactivated).toBeTruthy();
        done();
    })
    test('Listagem de temas ativos', async done => {
        const app = await appFactory();
        const api = supertest(app.server);
        const token = await authenticate(user, api)
        const header = `Bearer ${token}`;
        const themes = await api.get('/themes/?active=1')
            .set('Authorization', header);
        expect(themes.body.page).toBeInstanceOf(Array);
        themes.body.page.forEach((theme: any) => {
            expect(theme.active, jp(theme)).toBeTruthy();
        })
        done()
    })
})

describe('#3 Redações', () => {
    const user: UserModel = userFactory();
    const student: UserModel = userFactory({ permission: 6 });
    beforeAll(async (done) => {
        const themeService = EssayThemeService(driver);
        await themeService.delete().del()
        const repository = new EssayThemeRepository(await context);
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
        const service = UserService(driver)
            .onConflict('user_id').merge();
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
        const app = await appFactory();
        const api = supertest(app.server);
        const subscriptionRepository = new SubscriptionRepository(await context);
        const productRepository = new ProductRepository(await context);
        const product = await productRepository.get({ course: 'esa' });
        await subscriptionRepository.create({
            expiration: faker.date.future(),
            product: product.id,
            registrationDate: new Date(),
            user: student.user_id,
            code: faker.datatype.number(),
            course: 'espcex',
            active: true,
        });
        const token = await authenticate(student, api)
        const header = `Bearer ${token}`;
        const buffer = Buffer.from(new ArrayBuffer(10), 0, 2);
        const { body, status, error } = await api.post('/essays/')
            .set('Authorization', header)
            .field('course', 'esa')
            .attach('file', buffer, { filename: 'file.png', contentType: 'image/png' })
        expect(body.id, jp({ body, error })).not.toBeUndefined();
        expect(status, jp({ body, error })).toBe(201);
        done();
    })
    test('Listagem', async done => {
        const app = await appFactory();
        const api = supertest(app.server);
        const token = await authenticate(student, api)
        const header = `Bearer ${token}`;
        const { body, status, error } = await api.get('/essays/')
            .set('Authorization', header);
        expect(body, jp({ body, error, header })).toBeInstanceOf(Array);
        expect(status, jp({ body, error })).toBe(200);
        body.forEach((essay: any) => {
            expect(essay.course).toBeDefined();
            expect(essay.id).toBeDefined();
            expect(essay.file).toBeDefined();
        })
        done();
    })
    test('Listagem de todos', async done => {
        const app = await appFactory();
        const api = supertest(app.server);
        const token = await authenticate(user, api)
        const header = `Bearer ${token}`;
        const { body, status, error } = await api.get('/essays/')
            .set('Authorization', header);
        expect(body.page, jp({ body, error })).not.toBeUndefined();
        expect(body.page, jp({ body, error })).toBeInstanceOf(Array);
        expect(status, jp({ body, error })).toBe(200);
        body.page.forEach((essay: any) => {
            expect(essay.course).toBeDefined();
            expect(essay.id).toBeDefined();
            expect(essay.file).toBeDefined();
        })
        done();
    })
    test('Recuperação de uma redação', async done => {
        const app = await appFactory();
        const api = supertest(app.server);
        const token = await authenticate(user, api)
        const header = `Bearer ${token}`;
        const base = await createEssay(await context, user.user_id);
        const response = await api.get(`/essays/${base.id}/`)
            .set('Authorization', header);
        expect(response.status, jp(response.body)).toBe(200);
        expect(response.body).toBeDefined();
        expect(response.body).toMatchObject(base);
        done();
    })
    test('Início da correção da redação', async done => {
        const app = await appFactory();
        const api = supertest(app.server);
        const token = await authenticate(user, api)
        const header = `Bearer ${token}`;
        const base = await createEssay(await context, user.user_id);
        const response = await api.post(`/essays/${base.id}/corrector/`)
            .set('Authorization', header);
        expect(response.status, jp(response.body)).toBe(201);
        expect(response.body).toBeDefined();
        expect(response.body).toMatchObject(base);
        expect(response.body.corrector.id).toEqual(user.user_id)
        done();
    })
    test('Cancelamento da correção', async done => {
        const app = await appFactory();
        const api = supertest(app.server);
        const token = await authenticate(user, api)
        const header = `Bearer ${token}`;
        const base = await createEssay(await context, user.user_id);
        await api.post(`/essays/${base.id}/corrector/`)
            .set('Authorization', header);
        const response = await api.delete(`/essays/${base.id}/corrector/`)
            .set('Authorization', header);
        expect(response.status, jp(response.body)).toBe(200);
        expect(response.body, jp(response.body)).toBeDefined();
        expect(response.body, jp(response.body)).toMatchObject(base);
        expect(response.body.corrector, jp(response.body)).toBeNull();
        done();
    })
})

describe('#4 Invalidação da redação', () => {
    const user: UserModel = userFactory();
    const student: UserModel = userFactory({ permission: 6 });
    beforeAll(async (done) => {
        const themeService = EssayThemeService(driver);
        await themeService.delete().del()
        const repository = new EssayThemeRepository(await context);
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
        const service = UserService(driver)
            .onConflict('user_id').merge();
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
        const app = await appFactory();
        const api = supertest(app.server);
        const token = await authenticate(user, api)
        const header = `Bearer ${token}`;
        const base = await createEssay(await context, user.user_id);
        await api.post(`/essays/${base.id}/corrector/`)
            .set('Authorization', header);
        const response = await api.post(`/essays/${base.id}/invalidation/`)
            .send({ reason: 'invalid', comment: faker.lorem.lines(3) })
            .set('Authorization', header);
        expect(response.status, jp(response.body)).toBe(201);
        expect(response.body, jp(response.body)).toBeDefined();
        expect(response.body.essay).toBe(base.id);
        expect(response.body.corrector).toBe(user.user_id);
        done();
    })
    test('Recuperação', async done => {
        const app = await appFactory();
        const api = supertest(app.server);
        const token = await authenticate(user, api)
        const header = `Bearer ${token}`;
        const base = await createEssay(await context, user.user_id);
        await api.post(`/essays/${base.id}/corrector/`)
            .set('Authorization', header);
        const invalidation = await api.post(`/essays/${base.id}/invalidation/`)
            .send({ reason: 'invalid', comment: faker.lorem.lines(3) })
            .set('Authorization', header);
        const { body, status, error } = await api.get(`/essays/${base.id}/invalidation/`)
            .set('Authorization', header);
        expect(status).toBe(200);
        expect(body).toMatchObject(invalidation.body);
        expect(body.essay).toBe(base.id);
        done();
    })
})

describe('#5 Correção da redação', () => {
    const user: UserModel = userFactory();
    const student: UserModel = userFactory({ permission: 6 });
    beforeAll(async (done) => {
        const themeService = EssayThemeService(driver);
        await themeService.delete().del()
        const repository = new EssayThemeRepository(await context);
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
        const service = UserService(driver)
            .onConflict('user_id').merge();
        await saveUser(user, service);
        await saveUser(student, service);
        done()
    }, 100000)
    afterAll(async (done) => {
        const service = UserService(driver);
        await deleteUser(user, service);
        const themeService = EssayThemeService(driver);
        await themeService.del().delete();
        done()
    })
    test('Criação', async done => {
        const app = await appFactory();
        const api = supertest(app.server);
        const token = await authenticate(user, api)
        const header = `Bearer ${token}`;
        const base = await createEssay(await context, user.user_id);
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
        expect(response.status, jp(response.body)).toBe(201);
        expect(response.body, jp(response.body)).toBeDefined();
        expect(response.body.essay).toBe(base.id);
        done();
    }, 100000)
    test('Recuperação', async done => {
        const app = await appFactory();
        const api = supertest(app.server);
        const token = await authenticate(user, api)
        const header = `Bearer ${token}`;
        const base = await createEssay(await context, user.user_id);
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
            'points': 7.5,
            'repeated': "Não",
            'understoodTheme': "Sim",
            'veryShortSentences': "Não",
        }
        await api.post(`/essays/${base.id}/corrector/`)
            .set('Authorization', header);
        const created = await api.post(`/essays/${base.id}/correction/`)
            .send(data)
            .set('Authorization', header);
        expect(created.status, jp(created.body)).toBe(201);
        expect(created.body, jp(created.body)).toBeDefined();
        const response = await api.get(`/essays/${base.id}/correction/`)
            .set('Authorization', header);
        expect(response.status, jp(response.body)).toBe(200);
        expect(response.body, jp(response.body)).toBeDefined();
        expect(response.body.essay).toBe(base.id);
        (Object.entries(data) as [keyof typeof data, any][])
            .forEach(([key, value]) => {
                expect(response.body[key]).toBeDefined();
                expect(response.body[key]).toBe(value);
            });
        done();
    }, 100000)
})


describe('#6 Inscrições', () => {
    const email = 'teste.sandbox@hotmart.com';
    const student: UserModel = userFactory({ permission: 6 });
    const admin: UserModel = userFactory({ permission: 1 });
    const user = userFactory({ email });
    const deleteAll = async (done: any) => {
        const repository = new UserRepository(await context);
        await repository.query.whereIn('email', [email]).del();
        done();
    };
    beforeAll(async (done) => {
        const service = () => UserService(driver)
            .onConflict('user_id').merge();
        await saveUser(student, service());
        await saveUser(admin, service());
        await SubscriptionService(driver).insert({
            user: student.user_id,
            hotmart_id: faker.datatype.number(),
            product: 2,
            expiration: faker.date.future(),
            registrationDate: new Date(),
            active: true,
            course_tag: 2,
        });
        await saveUser(user, UserService(driver).onConflict('user_id').merge());
        await SubscriptionService(driver).where('hotmart_id', 18).del();
        done()
    }, 100000)
    beforeAll(deleteAll);
    afterAll(deleteAll);
    test('#61 Criação', async done => {
        const app = await appFactory();
        const api = supertest(app.server);
        const productRepository = new ProductRepository(await context);
        const product = await productRepository.get({ course: 'espcex' });
        const response = await api.post('/subscriptions/')
            .type('application/x-www-form-urlencoded')
            .send(qs.stringify({
                email,
                hottok,
                prod: product.id,
                callback_type: 1,
                aff: '',
                aff_name: '',
                currency: 'BRL',
                transaction: 'HP1121336654889',
                xcod: '',
                payment_type: 'credit_card',
                payment_engine: 'hotmart',
                status: 'approved',
                prod_name: 'Produto test postback2',
                producer_name: 'Producer Test Name',
                producer_document: 12345678965,
                producer_legal_nature: 'Pessoa Física',
                transaction_ext: 'HP11315117833431',
                purchase_date: '2017 - 11 - 27T11: 49: 04Z',
                confirmation_purchase_date: '2017 - 11 - 27T11: 49: 06Z',
                currency_code_from: 'BRL',
                currency_code_from_: 'BRL',
                original_offer_price: 1500.00,
                productOfferPaymentMode: 'pagamento_unico',
                warranty_date: '2017 - 12 - 27T00: 00: 00Z',
                receiver_type: 'SELLER',
                installments_number: 12,
                funnel: false,
                order_bump: false,
                cms_marketplace: 149.50,
                cms_vendor: 1350.50,
                off: 'test',
                price: 1500.00,
                full_price: 1500.00,
                subscriber_code: 'I9OT62C3',
                signature_status: 'active',
                subscription_status: 'active',
                name_subscription_plan: 'plano de teste',
                has_co_production: false,
                name: 'Teste Comprador',
                first_name: 'Teste',
                last_name: 'Comprador',
                phone_checkout_local_code: 999999999,
                phone_checkout_number: '00',
                sck: ''
            }));
        expect(response.body, jp(response.body)).toBeInstanceOf(Array);
        expect(response.body.length).toBeGreaterThan(0);
        done();
    });
    test('#62 Cancelamento', async done => {
        await saveUser(user, UserService(driver).onConflict('user_id').merge());
        const app = await appFactory();
        const api = supertest(app.server);
        const productRepository = new ProductRepository(await context);
        const product = await productRepository.get({ course: 'espcex' });
        await SubscriptionService(driver).where('hotmart_id', 18).del();
        const [inserted] = await SubscriptionService(driver).insert({
            hotmart_id: 18,
            product: product.id,
            user: user.user_id,
            expiration: new Date(Date.now() + 10000),
            registrationDate: new Date(),
            active: true,
            course_tag: 2,
        });
        expect(inserted).toBeDefined();
        const selected = await SubscriptionService(driver)
            .where('hotmart_id', 18).first();
        expect(selected).toBeDefined();
        const response = await api.post('/subscriptions/cancelation/')
            .type('application/json')
            .send({
                hottok,
                email,
                first_name: 'Teste',
                last_name: 'Comprador',
                prod: 0,
                status: 'canceled',
            });
        expect(response.status, jp(response.body)).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBeGreaterThan(0);
        response.body.forEach((item: any) => {
            expect(item.active).toBeFalsy();
        })
        done();
    });
    test('Listagem ', async done => {
        const app = await appFactory();
        const api = supertest(app.server);
        if (!student) throw new Error('Sem usuário');
        const token = await authenticate(student, api)
        const header = `Bearer ${token}`;
        const response = await api.get('/users/profile/subscriptions/')
            .set('Authorization', header);
        expect(response.status, jp(response.body)).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        done();
    });
    test('Listagem ', async done => {
        const app = await appFactory();
        const api = supertest(app.server);
        if (!admin) throw new Error('Sem usuário');
        const token = await authenticate(admin, api)
        const header = `Bearer ${token}`;
        const response = await api.get('/subscriptions/')
            .query({ pagination: { page: 1, pageSize: 10, ordering: 'id' } })
            .set('Authorization', header);
        expect(response.status, jp(response.body)).toBe(200);
        expect(response.body.page).toBeInstanceOf(Array);
        expect(response.body.page.length).toBe(10);
        done();
    });
    test('Filtragem', async done => {
        const app = await appFactory();
        const api = supertest(app.server);
        if (!admin) throw new Error('Sem usuário');
        const token = await authenticate(admin, api)
        const header = `Bearer ${token}`;
        const response = await api.get('/subscriptions/')
            .query({ user: student.user_id })
            .set('Authorization', header);
        expect(response.status, jp(response.body)).toBe(200);
        expect(response.body, jp(response.body)).toBeInstanceOf(Array);
        expect(response.body.length, jp(response.body)).toBeGreaterThan(0);
        response.body.forEach((item: any) => {
            expect(item.user).toBe(student.user_id);
        })
        done();
    });
    test('Criação manual', async done => {
        const productRepository = new ProductRepository(await context);
        const product = await productRepository.get({ course: 'esa' });
        const app = await appFactory();
        const api = supertest(app.server);
        if (!admin) throw new Error('Sem usuário');
        const token = await authenticate(admin, api)
        const header = `Bearer ${token}`;
        const response = await api.get('/subscriptions/')
            .send({
                'expiration': new Date(Date.now() + 10000),
                'product': product.id,
                'user': user.user_id,
                'active': true,
            })
            .set('Authorization', header);
        expect(response.status, jp(response.body)).toBe(200);
        expect(response.body, jp(response.body)).toBeDefined();
        expect(response.body, jp(response.body)).not.toBeNull();
        done();
    });
    test('Atualização manual', async done => {
        const productRepository = new ProductRepository(await context);
        const product = await productRepository.get({ course: 'espcex' });
        const subscriptionRepository = new SubscriptionRepository(await context);
        const [selected] = await subscriptionRepository.filter({ course: 'esa' });
        const app = await appFactory();
        const api = supertest(app.server);
        if (!admin) throw new Error('Sem usuário');
        const token = await authenticate(admin, api)
        const header = `Bearer ${token}`;
        const response = await api.put(`/subscriptions/${selected.id}/`)
            .send({
                'expiration': new Date(Date.now() + 1000000),
                'product': product.id,
                'user': user.user_id,
                'active': true,
            })
            .set('Authorization', header);
        expect(response.status, jp(response.body)).toBe(200);
        expect(response.body, jp(response.body)).toBeDefined();
        expect(response.body.product, jp(response.body)).toBe(product.id);
        expect(response.body, jp(response.body)).not.toBeNull();
        done();
    })
});

describe('#7 Produtos', () => {
    const user: UserModel = userFactory();
    const toDelete: number[] = []
    beforeAll(async (done) => {
        const service = UserService(driver)
            .onConflict('user_id').merge();
        await saveUser(user, service);
        done()
    });
    afterAll(async (done) => {
        const service = UserService(driver);
        await deleteUser(user, service);
        await ProductService(driver).whereIn('product_id', toDelete).del();
        done();
    });
    test('Criação', async done => {
        const app = await appFactory();
        const api = supertest(app.server);
        const data = {
            code: faker.datatype.number(),
            course: 'esa',
            expirationTime: 30 * 24 * 60 * 60 * 1000,
            name: faker.company.companyName(),
        }
        const token = await authenticate(user, api);
        const header = `Bearer ${token}`;
        const response = await api.post('/products/')
            .set('Authorization', header)
            .send(data);
        const msg = jp(response.body);
        expect(response.status, msg).toBe(201);
        expect(response.body.id, msg).toBeDefined();
        toDelete.push(response.body.id);
        done();
    });
    test('Listagem', async done => {
        const app = await appFactory();
        const api = supertest(app.server);
        const token = await authenticate(user, api);
        const header = `Bearer ${token}`;
        const response = await api.get('/products/')
            .set('Authorization', header);
        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBeGreaterThan(0);
        done();
    });
    test('Atualização', async done => {
        const app = await appFactory();
        const api = supertest(app.server);
        const token = await authenticate(user, api);
        const header = `Bearer ${token}`;
        const [id] = toDelete;
        const data = {
            code: faker.datatype.number(),
            course: 'espcex',
            expirationTime: 8 * 24 * 60 * 60 * 1000,
            name: faker.company.companyName(),
        }
        const response = await api.put(`/products/${id}/`)
            .send(data)
            .set('Authorization', header);
        expect(response.status, jp(response.body)).toBe(200);
        expect({ ...data, id }).toMatchObject(response.body);
        done();
    });
});