import faker from "faker";
import { v4 } from "uuid";
import Recovery, { RecoveryInterface } from "../../entities/Recovery";
import User from "../../entities/User";
import RecoveryCase, { RecoveryRepositoryInterface, RecoveryInsertionInterface } from "../Recovery";
import { UserRepositoryInterface } from "../User";
import getDb from "./database";
import { UserTestRepository } from "./user.test";

const db = getDb();

export class RecoveryTestRespository implements RecoveryRepositoryInterface {
    public readonly users: UserRepositoryInterface;
    private database: Recovery[] = new Array(10).fill(0).map((_, id) => new Recovery({
        id,
        expires: new Date(Date.now() + 60 * 60 * 1000),
        selector: faker.datatype.string(),
        token: faker.datatype.string(),
        user: id,
    }));

    constructor() {
        this.users = new UserTestRepository();
    }

    public async filter(filter: Partial<RecoveryInterface>) {
        const fields = Object.entries(filter) as [keyof RecoveryInterface, number | Date][];
        if (!fields.length) return this.database;
        return this.database.filter(item => (
            !!fields.filter(([key, value]) => item[key] === value).length
        ));
    }

    public async create(data: RecoveryInsertionInterface) {
        const recovery = new Recovery({
            ...data,
            id: this.database.length,
        });
        this.database.push(recovery);
        return recovery;
    }

    public async get(filter: Partial<RecoveryInterface>) {
        const fields = Object.entries(filter) as [keyof RecoveryInterface, number | Date][];
        return this.database.find(item => (
            !!fields.filter(([key, value]) => item[key] === value).length
        ));
    }

    public async delete(filter: Partial<RecoveryInterface>) {
        const toRemove = await this.filter(filter);
        this.database = this.database.filter(item => toRemove.indexOf(item) >= 0);
        return toRemove.length;
    }
}

describe('Recuperação de senha', () => {
    test('Criação', async done => {
        const repository = new RecoveryTestRespository();
        const useCase = new RecoveryCase(repository, 40 * 60 * 60 * 1000);
        const [selected] = db.users;
        const { recovery, user } = await useCase.create({ email: selected.email, session: v4() });
        expect(recovery).toBeInstanceOf(Recovery);
        expect(user).toBeInstanceOf(User);
        done();
    });
    test('Verificação', async done => {
        const repository = new RecoveryTestRespository();
        const [selected] = await repository.filter({});
        const useCase = new RecoveryCase(repository, 40 * 60 * 60 * 1000);
        const isValid = await useCase.checkLongToken(selected.token);
        expect(selected.id).toEqual(isValid.id);
        done();
    });
    test('Atualização da senha', async done => {
        const repository = new RecoveryTestRespository();
        const [selected] = await repository.filter({});
        const useCase = new RecoveryCase(repository, 40 * 60 * 60 * 1000);
        const updated = await useCase.updatePassword({ token: selected.token, password: faker.internet.password() });
        expect(updated).toBeTruthy();
        done();
    });
    test('Criação com token curto', async done => {
        const repository = new RecoveryTestRespository();
        const useCase = new RecoveryCase(repository, 40 * 60 * 60 * 1000);
        const [selected] = db.users;
        const { recovery, user } = await useCase.create({ email: selected.email, session: v4(), long: false });
        expect(recovery).toBeInstanceOf(Recovery);
        expect(recovery.token.length).toBe(6);
        expect(user).toBeInstanceOf(User);
        done();
    });
    test('Verifiação de token curto', async done => {
        const repository = new RecoveryTestRespository();
        const useCase = new RecoveryCase(repository, 40 * 60 * 60 * 1000);
        const [selected] = db.users;
        const session = v4();
        const { recovery, user } = await useCase.create({ email: selected.email, session, long: false });
        expect(recovery.token.length).toBe(6);
        const long = await useCase.checkShortToken({ token: recovery.token, session });
        expect(long.user).toBe(user.id);
        expect(long.token.length).toBe(64);
        done();
    });
});
