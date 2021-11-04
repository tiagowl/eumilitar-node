import faker from 'faker';
import { contextFactory } from '../../../tests/shortcuts';
import LogController from '../controllers/Log';
import UserRepository from '../models/User';

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
    })
})