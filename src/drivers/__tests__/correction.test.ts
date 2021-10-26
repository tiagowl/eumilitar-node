import faker from "faker";
import supertest from "supertest";
import { userFactory, db, saveUser, deleteUser, appFactory, createEssay, jp, contextFactory } from "../../../tests/shortcuts";
import EssayThemeRepository, { EssayThemeService } from "../../adapters/models/EssayTheme";
import { UserModel, UserService } from "../../adapters/models/User";
import { EssayThemeCreation } from "../../cases/EssayTheme";
import { Course } from "../../entities/EssayTheme";
import { authenticate } from "./tools";


const context = contextFactory();

describe('#5 Correção da redação', () => {
    const user: UserModel = userFactory();
    const student: UserModel = userFactory({ permission: 6 });
    beforeAll(async (done) => {
        const themeService = EssayThemeService(db);
        await themeService.delete().del()
        const repository = new EssayThemeRepository(context);
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
        const service = UserService(db)
            .onConflict('user_id').merge();
        await saveUser(user, service);
        await saveUser(student, service);
        done()
    }, 100000)
    afterAll(async (done) => {
        const service = UserService(db);
        await deleteUser(user, service);
        const themeService = EssayThemeService(db);
        await themeService.del().delete();
        done()
    })
    test('Criação', async done => {
        const app = await appFactory();
        const api = supertest(app.server);
        const token = await authenticate(user, api)
        const header = `Bearer ${token}`;
        const base = await createEssay(context, user.user_id);
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
        const base = await createEssay(context, user.user_id);
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
    }, 100000);
    test('Atualização', async done => {
        const app = await appFactory();
        const api = supertest(app.server);
        const token = await authenticate(user, api)
        const header = `Bearer ${token}`;
        const base = await createEssay(context, user.user_id);
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
        const updatingData = {
            'comment': faker.lorem.lines(5),
        }
        const updated = await api.patch(`/essays/${base.id}/correction/`)
            .send(updatingData)
            .set('Authorization', header);
        expect(updatingData.comment).toBe(updated.body.comment);
        expect(updated.body.id).toBe(created.body.id);
        expect(updated.body.comment).not.toEqual(created.body.comment);
        done();
    })
})
