import faker from "faker";
import Session from "../../entities/Session";
import { SessionInterface } from "../../entities/Session";
import SessionCase, { SessionRepositoryInterface, SessionInsertionInterface } from "../Session";
import { UserRepositoryInterface } from "../User";
import getDb, { defaultPassword } from "./database";
import { UserTestRepository } from "./user.test";

const db = getDb()

export class SessionTestRepository implements SessionRepositoryInterface {
    public readonly users: UserRepositoryInterface;
    private database: Session[] = new Array(5).fill(0).map((_, id) => new Session({
        id,
        token: faker.random.alphaNumeric(),
        user: id,
        loginTime: new Date(),
        agent: faker.internet.userAgent(),
    }));

    constructor() {
        this.users = new UserTestRepository();
    }

    public async filter(filter: Partial<SessionInterface>) {
        const fields = Object.entries(filter) as [keyof SessionInterface, number | Date][];
        if (!fields.length) return this.database;
        return this.database.filter(item => (
            !!fields.filter(([key, value]) => item[key] === value).length
        ));
    }

    public async create(data: SessionInsertionInterface) {
        const session = new Session({
            ...data,
            id: this.database.length,
        });
        this.database.push(session);
        return session;
    }

    public async delete(filter: Partial<SessionInterface>) {
        const toRemove = await this.filter(filter);
        this.database = this.database.filter(item => toRemove.indexOf(item) >= 0);
        return toRemove.length;
    }

    public async get(filter: Partial<SessionInterface>) {
        const fields = Object.entries(filter) as [keyof SessionInterface, number | Date][];
        return this.database.find(item => (
            !!fields.filter(([key, value]) => item[key] === value).length
        ));
    }
}

describe('Sessões', () => {
    test('Autenticação', async done => {
        const user = db.users.find(item => item.checkPassword(defaultPassword));
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
        const user = db.users.find(item => item.checkPassword(defaultPassword));
        if (!user) throw new Error();
        const repository = new SessionTestRepository();
        const useCase = new SessionCase(repository);
        const auth = await useCase.auth({ email: user.email, password: defaultPassword });
        const checked = await useCase.checkToken(auth.token);
        expect(user.id).toBe(checked.id);
        done();
    });
});

