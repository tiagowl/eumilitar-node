import faker from "faker";
import { contextFactory, db } from "../../../tests/shortcuts";
import { EssayThemeCreation } from "../../cases/EssayTheme";
import { Course } from "../../entities/EssayTheme";
import SingleEssayController from "../controllers/SingleEssay";
import EssayThemeRepository, { EssayThemeService } from "../models/EssayTheme";
import { UserService } from "../models/User";

const context = contextFactory();

describe('#10 Redação avulsa', () => {
    beforeAll(async (done) => {
        await EssayThemeService(db).delete().del();
        done();
    });
    test('Criação', async done => {
        const repository = new EssayThemeRepository(context);
        const data: EssayThemeCreation = {
            title: 'Título',
            endDate: new Date(Date.now() - 150 * 24 * 60 * 60),
            startDate: new Date(Date.now() - 160 * 24 * 60 * 60),
            helpText: faker.lorem.lines(3),
            file: '/usr/share/data/theme.pdf',
            courses: new Set(['esa', 'espcex'] as Course[]),
            deactivated: false,
        }
        const theme = await repository.create(data);
        const controller = new SingleEssayController(context);
        const student = await UserService(db).where('permission', 6).first();
        if (!theme || !student) {
            console.log(theme, student);
            throw new Error();
        }
        const created = await controller.create({ theme: theme.id, student: student.user_id });
        expect(created.token).toBeDefined();
        expect(created.token.length).toBe(64);
        const checked = await controller.check({ token: created.token, student: student.user_id });
        expect(checked).toMatchObject(created);
        expect(checked.token).toBe(created.token);
        done();
    });
});