import faker from "faker";
import Session from "../../entities/Session";
import { SessionInterface } from "../../entities/Session";
import SessionCase, { SessionRepositoryInterface, SessionInsertionInterface } from "../Session";
import { UserRepositoryInterface } from "../User";
import getDb, { defaultPassword } from "./repositories/database";
import { SessionTestRepository } from "./repositories/SessionTestRepository";

const db = getDb()

describe('Sessões', () => {
    test('Autenticação', async done => {
        const userIndex = (await Promise.all(db.users.map(item => item.checkPassword(defaultPassword)))).findIndex(item => item);
        const user = db.users[userIndex];
        if (!user) throw new Error();
        const repository = new SessionTestRepository();
        const useCase = new SessionCase(repository);
        const auth = await useCase.auth({ email: user.email, password: defaultPassword });
        expect(auth).toBeInstanceOf(Session);
        done();
    });
    test('Senha errada', async done => {
        const [user] = db.users;
        const repository = new SessionTestRepository();
        const useCase = new SessionCase(repository);
        await expect(async () => {
            return useCase.auth({ email: user.email, password: faker.random.alpha() });
        }).rejects.toThrow('Senha inválida');
        done();
    });
    test('Email inválido', async done => {
        const repository = new SessionTestRepository();
        const useCase = new SessionCase(repository);
        await expect(async () => {
            await useCase.auth({ email: faker.internet.email(), password: defaultPassword });
        }).rejects.toThrow('Email inválido');
        done();
    });
    test('Logout', async done => {
        const repository = new SessionTestRepository();
        const [selected] = await repository.filter({});
        const useCase = new SessionCase(repository);
        await useCase.delete(selected.token);
        done();
    });
    test('Checar token', async done => {
        const userIndex = (await Promise.all(db.users.map(item => item.checkPassword(defaultPassword)))).findIndex(item => item);
        const user = db.users[userIndex];
        if (!user) throw new Error();
        const repository = new SessionTestRepository();
        const useCase = new SessionCase(repository);
        const auth = await useCase.auth({ email: user.email, password: defaultPassword });
        const checked = await useCase.checkToken(auth.token);
        expect(user.id).toBe(checked.id);
        done();
    });
});

