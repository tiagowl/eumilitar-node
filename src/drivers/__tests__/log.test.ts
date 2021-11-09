import faker from "faker";
import supertest from "supertest";
import { appFactory, contextFactory, jp, saveUser, userFactory } from "../../../tests/shortcuts";
import { UserService } from "../../adapters/models/User";
import { authenticate } from "./tools";

const context = contextFactory();
const { db } = context;

describe('Alertas', () => {
    const user = userFactory({ permission: 1 });
    const admin = userFactory({ permission: 1 });
    const student = userFactory({ permission: 6 });
    const corrector = userFactory({ permission: 5 });
    const app = appFactory();
    const api = supertest(app.server);
    beforeAll(async (done) => {
        await UserService(db).where('user_id', user.user_id).delete();
        await UserService(db).where('user_id', admin.user_id).delete();
        await UserService(db).where('user_id', student.user_id).delete();
        await UserService(db).where('user_id', corrector.user_id).delete();
        await saveUser(user, UserService(db));
        await saveUser(student, UserService(db));
        await saveUser(admin, UserService(db));
        done();
    });
    test('Criação', async done => {
        const header = await authenticate(admin, api);
        const data = {
            event: 'sent-essay',
            error: faker.lorem.lines(1),
            details: faker.lorem.lines(1),
        };
        const response = await api.post('/logs/')
            .set('Authorization', header)
            .send(data);
        expect(response.status, jp(response.body)).toBe(201);
        expect(typeof response.body.id, jp(response.body)).toBe('number');
        expect(typeof response.body.user.id, jp(response.body)).toBe('number');
        expect(typeof response.body.registrationDate).toBe('string');
        expect(response.body.event).toBe(data.event);
        expect(response.body.error).toBe(data.error);
        expect(response.body.details).toBe(data.details);
        done();
    })
    test('listagem', async done => {
        const header = await authenticate(admin, api);
        const response = await api.get('/logs/')
            .set('Authorization', header)
            .query({
                pagination: {
                    page: 2
                }
            });
        expect(response.body).not.toBeInstanceOf(Array);
        expect(response.body.page).toBeInstanceOf(Array);
        expect(response.body.page.length).toBeGreaterThanOrEqual(10);
        done();
    })
});