import faker from "faker";
import supertest from "supertest";
import { appFactory, contextFactory, saveUser, userFactory } from "../../../tests/shortcuts";
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
            title: 'Título de teste',
            message: faker.lorem.paragraph(4),
        };
        const response = await api.post('/warning/')
            .set('Authorization', header)
            .send(data);
        expect(typeof response.body.id).toBe('number');
        expect(typeof response.body.lastModified).toBe('string');
        expect(response.body.title).toBe(data.title);
        expect(response.body.message).toBe(data.message);
        done();
    })
})