import faker from "faker";
import Session from "../../entities/Session";
import { SessionInterface } from "../../entities/Session";
import User from "../../entities/User";
import SessionCase, { SessionRepositoryInterface, SessionInsertionInterface } from "../SessionCase";
import { UserRepositoryInterface } from "../UserCase";
import getDb, { defaultPassword } from "./repositories/database";
import SessionTestRepository from "./repositories/SessionTestRepository";

const db = getDb();

describe('Sessões', () => {
    const repository = new SessionTestRepository(db);
    const useCase = new SessionCase(repository);
    test('Autenticação', async done => {
        const userIndex = (await Promise.all(db.users.map(item => new User(item).checkPassword(defaultPassword)))).findIndex(item => item);
        const user = new User(db.users[userIndex]);
        if (!user) throw new Error();
        const auth = await useCase.auth({ email: user.email, password: defaultPassword });
        expect(auth).toBeInstanceOf(Session);
        done();
    });
    test('Senha errada', async done => {
        const [user] = db.users;
        await expect(async () => {
            return useCase.auth({ email: user.email, password: faker.random.alpha() });
        }).rejects.toThrow('Senha inválida');
        done();
    });
    test('Email inválido', async done => {
        await expect(async () => {
            await useCase.auth({ email: faker.internet.email(), password: defaultPassword });
        }).rejects.toThrow('Email inválido');
        done();
    });
    test('Logout', async done => {
        const [selected] = await repository.filter({});
        await useCase.delete(selected.token);
        done();
    });
    test('Checar token', async done => {
        const userIndex = (await Promise
            .all(db.users.map(item => new User(item).checkPassword(defaultPassword))))
            .findIndex(item => item);
        const user = new User(db.users[userIndex]);
        if (!user) throw new Error();
        const auth = await useCase.auth({ email: user.email, password: defaultPassword });
        const checked = await useCase.checkToken(auth.token);
        expect(user.id).toBe(checked.id);
        done();
    });
});

