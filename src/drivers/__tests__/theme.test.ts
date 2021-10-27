import faker from "faker";
import supertest from "supertest";
import { userFactory, db, saveUser, deleteUser, appFactory, jp } from "../../../tests/shortcuts";
import { EssayThemeService } from "../../adapters/models/EssayTheme";
import { UserModel, UserService } from "../../adapters/models/User";
import { authenticate } from "./tools";


describe('#2 Testes nos temas', () => {
    const user: UserModel = userFactory();
    const app = appFactory();
    const api = supertest(app.server);
    beforeAll(async (done) => {
        const service = UserService(db)
            .onConflict('user_id').merge();
        await saveUser(user, service);
        await EssayThemeService(db).del().delete();
        done();
    });
    afterAll(async (done) => {
        const service = UserService(db);
        await deleteUser(user, service);
        const themeService = EssayThemeService(db);
        await themeService.del().delete();
        done();
    });
    test('Testes na criação de temas', async done => {
        const credentials = {
            email: user.email,
            password: user.passwd,
        };
        const auth = await api.post('/tokens/')
            .send(credentials)
            .set('User-Agent', faker.internet.userAgent());
        const { token } = auth.body;
        expect(token).not.toBeUndefined();
        expect(token).not.toBeNull();
        const header = await authenticate(user, api);
        const buffer = Buffer.from(new ArrayBuffer(10), 0, 2);
        const theme = {
            title: 'Título',
            startDate: new Date(Date.now() - 15 * 25 * 60 * 60),
            endDate: new Date(Date.now() - 2 * 25 * 60 * 60),
            helpText: faker.lorem.paragraph(10),
            courses: ['espcex'],
            themeFile: buffer
        };
        const response = await api.post('/themes/')
            .set('Authorization', header)
            .field('data', JSON.stringify(theme))
            .attach('themeFile', buffer, { filename: 'field.pdf', contentType: 'application/pdf' });
        expect(response.status, JSON.stringify(response.body)).toEqual(201);
        expect(response.body.title).toEqual('Título');
        expect(response.body.id).not.toBeUndefined();
        expect(response.body.id).not.toBeNull();
        const recovered = await api.get(`/themes/${response.body.id}/`)
            .set('Authorization', header);
        expect(recovered.body).toMatchObject(response.body);
        expect(recovered.status).toBe(200);
        done();
    });
    test('Testes na listagem de temas', async done => {
        const credentials = {
            email: user.email,
            password: user.passwd,
        };
        const auth = await api.post('/tokens/')
            .send(credentials)
            .set('User-Agent', faker.internet.userAgent());
        const { token } = auth.body;
        expect(token).not.toBeUndefined();
        expect(token).not.toBeNull();
        const header = await authenticate(user, api);
        const response = await api.get('/themes/')
            .set('Authorization', header);
        expect(response.body?.page, response.error.toString()).not.toBeUndefined();
        expect(response.body?.count).not.toBeUndefined();
        expect(response.body?.count).toBe(response.body?.page?.length);
        done();
    });
    test('Atualização de temas', async done => {
        const header = await authenticate(user, api);
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
        };
        const response = await api.put(`/themes/${selected.id}/`)
            .set('Authorization', header)
            .field('data', JSON.stringify(theme))
            .attach('themeFile', buffer, { filename: 'field.pdf', contentType: 'application/pdf' });
        expect(response.status, jp(response.body)).toEqual(200);
        expect(response.body.title).toEqual(theme.title);
        expect(response.body.title).not.toEqual(selected.title);
        expect(response.body.id).not.toBeUndefined();
        expect(response.body.id).not.toBeNull();
        expect(response.body.id).toEqual(selected.id);
        done();
    });
    test('Desativação do tema', async done => {
        const header = await authenticate(user, api);
        const themes = await api.get('/themes/')
            .set('Authorization', header);
        expect(themes.status, jp(themes.body)).toBe(200);
        const [selected] = themes.body.page;
        const response = await api.delete(`/themes/${selected.id}/`)
            .set('Authorization', header);
        expect(response.status, response.body?.message).toBe(200);
        expect(response.body.deactivated).toBeTruthy();
        done();
    });
    test('Listagem de temas ativos', async done => {
        const header = await authenticate(user, api);
        const themes = await api.get('/themes/?active=1')
            .set('Authorization', header);
        expect(themes.body.page).toBeInstanceOf(Array);
        themes.body.page.forEach((theme: any) => {
            expect(theme.active, jp(theme)).toBeTruthy();
        });
        done();
    });
});
