import faker from "faker";
import Log from "../../entities/Log";
import LogCase from "../LogCase"
import getDb from "./repositories/database"
import LogTestRepository from "./repositories/LogTestRepository"

const db = getDb()

describe('logs', () => {
    const repository = new LogTestRepository(db);
    const useCase = new LogCase(repository);
    test('Criação', async done => {
        const created = await useCase.create({
            user: 0,
            ip: faker.internet.ip(),
            userAgent: faker.internet.userAgent(),
            event: 'sent-essay',
            error: faker.lorem.lines(1),
        });
        expect(created).toBeInstanceOf(Log);
        done();
    });
    test('listagem', async done => {
        const list = await useCase.filter({});
        expect(list).toBeInstanceOf(Array);
        done();
    });
});