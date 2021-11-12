import faker from "faker";
import supertest from "supertest";
import { appFactory, contextFactory, jp, saveUser, userFactory } from "../../../tests/shortcuts";
import { UserService } from "../../adapters/models/UserRepository";
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
        const header = await authenticate(student, api);
        const data = {
            grade: 5,
            description: faker.lorem.paragraph(2),
        };
        const response = await api.post('/reviews/')
            .set('Authorization', header)
            .send(data);
        expect(response.status, jp(response.body)).toBe(201);
        expect(typeof response.body.id, jp(response.body)).toBe('number');
        expect(typeof response.body.user, jp(response.body)).toBe('number');
        expect(typeof response.body.registrationDate).toBe('string');
        done();
    })
    test('Verificação', async done => {
        const header = await authenticate(admin, api);
        const response = await api.get('/can-review/')
            .set('Authorization', header);
        expect(response.body.can).toBeTruthy();
        done();
    })
});