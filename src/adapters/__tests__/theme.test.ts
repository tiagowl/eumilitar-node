import faker from "faker";
import { Readable } from "stream";
import { contextFactory, db } from "../../../tests/shortcuts";
import { EssayThemeCreation } from "../../cases/EssayTheme";
import { Course } from "../../entities/EssayTheme";
import EssayThemeController, { EssayThemeInput, EssayThemePagination } from "../controllers/EssayTheme";
import EssayThemeRepository, { EssayThemeService } from "../models/EssayTheme";

const context = contextFactory();

describe('#2 Testes nos temas de redação', () => {
    afterAll(async (done) => {
        const themeService = EssayThemeService(db);
        await themeService.delete().del();
        done();
    });
    test('#21 Teste no modelo', async done => {
        const repository = new EssayThemeRepository(context);
        const data: EssayThemeCreation = {
            title: 'Título',
            endDate: new Date(Date.now() - 150 * 24 * 60 * 60),
            startDate: new Date(Date.now() - 160 * 24 * 60 * 60),
            helpText: faker.lorem.lines(3),
            file: '/usr/share/data/theme.pdf',
            courses: new Set(['esa', 'espcex'] as Course[]),
            deactivated: false,
        };
        const created = await repository.create(data);
        expect(created.id).not.toBeUndefined();
        expect(created.id).not.toBeNull();
        done();
    });
    test('#22 Teste na criação pelo controller', async done => {
        const data: EssayThemeInput = {
            title: 'Título',
            endDate: new Date(Date.now() - 50 * 24 * 60 * 60),
            startDate: new Date(Date.now() - 70 * 24 * 60 * 60),
            helpText: faker.lorem.lines(3),
            deactivated: false,
            // @ts-ignore
            file: {
                path: '/usr/share/data/theme.pdf',
                buffer: Buffer.from(new ArrayBuffer(10), 0, 2),
                size: 1,
                bucket: faker.internet.userName(),
                fieldname: 'themeFile',
                filename: faker.name.title(),
                destination: '/usr/share/data/',
                mimetype: 'application/pdf',
                encoding: 'utf-8',
                originalname: faker.name.title(),
                stream: new Readable(),
                location: faker.internet.url(),
            },
            courses: ['esa', 'espcex'] as Course[]
        };
        const controller = new EssayThemeController(context);
        const created = await controller.create(data);
        expect(created.id).not.toBeNull();
        expect(created.id, JSON.stringify(created)).toBeDefined();
        expect(created.title).toEqual(data.title);
        done();
    });
    test('#23 Lista todos os temas', async done => {
        const pagination: EssayThemePagination = {
            page: '1',
            size: '2',
            order: 'id',
        };
        const data: EssayThemeInput = {
            title: faker.name.title(),
            endDate: new Date(Date.now() + 370 * 24 * 60 * 60),
            startDate: new Date(Date.now() + 350 * 24 * 60 * 60),
            helpText: faker.lorem.lines(3),
            deactivated: false,
            // @ts-ignore
            file: {
                path: '/usr/share/data/theme.pdf',
                buffer: Buffer.from(new ArrayBuffer(10), 0, 2),
                size: 1,
                fieldname: 'themeFile',
                filename: faker.name.title(),
                destination: '/usr/share/data/',
                mimetype: 'application/pdf',
                encoding: 'utf-8',
                originalname: faker.name.title(),
                stream: new Readable(),
                location: faker.internet.url(),
            },
            courses: ['esa', 'espcex'] as Course[],
        };
        const controller = new EssayThemeController(context);
        await controller.create(data);
        await controller.create({ ...data, startDate: new Date(Date.now() + 790 * 24 * 60 * 60), endDate: new Date(Date.now() + 800 * 24 * 60 * 60) });
        const themes = await controller.listAll(pagination);
        expect(themes.count).toBe(themes.page.length);
        expect(themes.count).toBe(2);
        expect(themes.page).toBeInstanceOf(Array);
        await Promise.all(themes.page.map(async theme => {
            expect(theme.id, JSON.stringify(theme)).not.toBeUndefined();
            expect(theme.active, JSON.stringify(theme)).not.toBeUndefined();
        }));
        done();
    });
    test('#24 Atualização dos temas', async done => {
        const data: EssayThemeInput = {
            title: faker.name.title(),
            endDate: new Date(Date.now() + 3700 * 24 * 60 * 60),
            startDate: new Date(Date.now() + 3500 * 24 * 60 * 60),
            helpText: faker.lorem.lines(3),
            deactivated: false,
            // @ts-ignore
            file: {
                path: '/usr/share/data/theme.pdf',
                buffer: Buffer.from(new ArrayBuffer(10), 0, 2),
                size: 1,
                fieldname: 'themeFile',
                filename: faker.name.title(),
                destination: '/usr/share/data/',
                mimetype: 'application/pdf',
                encoding: 'utf-8',
                originalname: faker.name.title(),
                stream: new Readable(),
                location: faker.internet.url(),
            },
            courses: ['esa'] as Course[],
        };
        const controller = new EssayThemeController(context);
        const all = await controller.listAll();
        expect(all.pages).not.toBeLessThan(1);
        expect(all.page).toBeInstanceOf(Array);
        expect(all.page.length).not.toBeLessThan(1);
        const selected = all.page[0];
        expect(selected.id).not.toBeUndefined();
        const updated = await controller.update(selected.id || 0, data);
        expect(data.title).toEqual(updated.title);
        expect(data.courses).toEqual(updated.courses);
        done();
    });
});

