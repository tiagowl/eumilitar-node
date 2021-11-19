import faker from "faker";
import supertest from "supertest";
import { userFactory, saveUser, db, appFactory, jp, contextFactory } from "../../../tests/shortcuts";
import EssayThemeRepository from "../../adapters/models/EssayThemeRepository";
import { UserModel, UserService } from "../../adapters/models/UserRepository";
import { Course } from "../../entities/EssayTheme";
import { authenticate } from "./tools";

const context = contextFactory();

describe('#8 Redações avulsas', () => {
    const admin: UserModel = userFactory();
    const student: UserModel = userFactory({ permission: 6 });
    const app = appFactory();
    const api = supertest(app.server);
    beforeAll(async (done) => {
        await saveUser(admin, UserService(db)
            .onConflict('user_id').merge());
        await saveUser(student, UserService(db)
            .onConflict('user_id').merge());
        done();
    });
    test('Criação', async done => {
        const header = await authenticate(admin, api);
        const repository = new EssayThemeRepository(context);
        const theme = await repository.create({
            title: 'Título',
            endDate: new Date(Date.now() - 150 * 24 * 60 * 60),
            startDate: new Date(Date.now() - 160 * 24 * 60 * 60),
            helpText: faker.lorem.lines(3),
            file: '/usr/share/data/theme.pdf',
            courses: new Set(['esa', 'espcex'] as Course[]),
            deactivated: false,
        });
        if (!theme || !student) {
            console.log(theme, student);
            throw new Error();
        }
        const data = {
            student: student.user_id,
            theme: theme.id,
        };
        const response = await api.post('/single-essays/')
            .send(data).set('Authorization', header);
        expect(response.status, jp(response.body, header, admin)).toBe(201);
        const checkingHeader = await authenticate(student, api);
        const checked = await api.get(`/single-essays/${response.body.token}/`)
            .set('Authorization', checkingHeader);
        expect(checked.status, jp(checked.body)).toBe(200);
        expect(checked.body).toMatchObject(response.body);
        done();
    });
});