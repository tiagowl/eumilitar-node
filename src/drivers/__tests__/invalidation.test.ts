import faker from "faker";
import supertest from "supertest";
import { userFactory, db, saveUser, deleteUser, appFactory, createEssay, jp, contextFactory } from "../../../tests/shortcuts";
import EssayThemeRepository, { EssayThemeService } from "../../adapters/models/EssayTheme";
import { UserModel, UserService } from "../../adapters/models/User";
import { EssayThemeCreation } from "../../cases/EssayTheme";
import { Course } from "../../entities/EssayTheme";
import { authenticate } from "./tools";

const context = contextFactory();

describe('#4 Invalidação da redação', () => {
    const user: UserModel = userFactory();
    const admin: UserModel = userFactory({ permission: 1 });
    const student: UserModel = userFactory({ permission: 6 });
    const app = appFactory();
    const api = supertest(app.server);
    beforeAll(async (done) => {
        const service = () => UserService(db)
            .onConflict('user_id').merge();
        await saveUser(admin, service());
        await saveUser(student, service());
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
        await saveUser(user, service());
        done()
    })
    afterAll(async (done) => {
        const service = UserService(db);
        await deleteUser(user, service);
        const themeService = EssayThemeService(db);
        await themeService.del().delete();
        done()
    })
    test('Invalidação', async done => {
        const header = await authenticate(user, api)
        const base = await createEssay(context, user.user_id);
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
        const header = await authenticate(user, api)
        const base = await createEssay(context, user.user_id);
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