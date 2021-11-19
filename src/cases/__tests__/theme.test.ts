import faker from "faker";
import EssayTheme, { Course } from "../../entities/EssayTheme";
import EssayThemeCase, { EssayThemeCreation, EssayThemeData, EssayThemeFilter, EssayThemeRepositoryInterface } from "../EssayThemeCase";
import getDb from "./repositories/database";
import EssayThemeTestRepository from "./repositories/ThemeTestRepository";

const db = getDb();

describe('#2 Testes nos temas da redação', () => {
    const repository = new EssayThemeTestRepository(db);
    const useCase = new EssayThemeCase(repository);
    test('Teste na criação de temas de redação', async done => {
        const data = {
            title: 'Título',
            endDate: new Date(Date.now() + 15 * 24 * 60 * 60),
            startDate: new Date(),
            helpText: faker.lorem.lines(3),
            file: '/usr/share/data/theme.pdf',
            courses: new Set(['esa'] as Course[])
        };
        const created = await useCase.create(data);
        expect(created.id).not.toBeUndefined();
        expect(created.id).not.toBeNull();
        expect(created).toEqual(expect.objectContaining(data));
        done();
    });
    test('Lista todos', async done => {
        const all = await useCase.findAll();
        expect(all).toMatchObject(repository.database);
        const count = await useCase.count();
        expect(count).toEqual(repository.database.length);
        done();
    });
    test('Atualiza o tema', async done => {
        const data = {
            title: faker.name.title(),
            endDate: new Date(Date.now() + 505 * 24 * 60 * 60),
            startDate: new Date(Date.now() + 500 * 24 * 60 * 60),
            helpText: faker.lorem.lines(3),
            file: '/usr/share/data/theme.pdf',
            courses: new Set(['esa'] as Course[]),
        };
        const updated = await useCase.update(0, data);
        expect(updated.id).toEqual(0);
        expect(updated.title).toEqual(data.title);
        expect(updated.endDate).toEqual(data.endDate);
        done();
    });
});
