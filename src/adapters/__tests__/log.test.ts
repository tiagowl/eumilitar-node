import faker from 'faker';
import { contextFactory } from '../../../tests/shortcuts';
import LogController from '../controllers/LogController';
import UserRepository from '../models/UserRepository';

const context = contextFactory()

describe('logs', () => {
    const controller = new LogController(context);
    const users = new UserRepository(context);
    test('Criação', async done => {
        const user = await users.get({});
        if (!user) throw new Error();
        const created = await controller.create({
            user: user.id,
            ip: faker.internet.ip(),
            userAgent: faker.internet.userAgent(),
            event: 'sent-essay',
            error: faker.lorem.lines(1),
        });
        expect(typeof created.id).toBe('number');
        done();
    });
    test('listagem', async done => {
        const logs = await controller.filter({});
        expect(logs).toBeInstanceOf(Array);
        if (!(logs instanceof Array)) throw new Error();
        done();
    });
    test('Pagination', async done => {
        const logs = await controller.filter({ pagination: { page: 1 } });
        expect(logs).not.toBeInstanceOf(Array);
        if (logs instanceof Array) throw new Error();
        expect(logs.page).toBeInstanceOf(Array);
        expect(logs.page.length).toBeGreaterThanOrEqual(10);
        done();
    });
    test('filtro', async done => {
        const logs = await controller.filter({ event: 'login' });
        expect(logs).toBeInstanceOf(Array);
        if (!(logs instanceof Array)) throw new Error();
        logs.forEach(log => {
            expect(log.event).toBe('login');
        });
        done();
    })
})