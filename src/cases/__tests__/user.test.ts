import faker from "faker";
import { hashPassword, userEntityFactory } from "../../../tests/shortcuts";
import User from "../../entities/User";
import UserUseCase, { UserFilter, UserRepositoryInterface, UserSavingData } from "../User";
import getDb, { defaultPassword } from "./database";

const db = getDb();

export class UserTestRepository implements UserRepositoryInterface {
    database: User[];
    constructor() {
        this.database = db.users;
    }
    async get(filter: UserFilter) {
        const filtered = await this.filter(filter);
        return filtered[0];
    }
    async filter(filter: UserFilter) {
        const { pagination, search, ...params } = filter;
        // @ts-ignore
        const fields: [keyof typeof params, any][] = Object.entries(params);
        if (!fields.length) return this.database;
        return this.database.filter(item => (
            !!fields.filter(([key, value]) => item[key] === value).length
        ));
    }
    async update(id: number, data: UserFilter) {
        let updated = 0;
        this.database = this.database.map(item => {
            if (id === item.id) {
                item.update(data);
                updated++;
            }
            return item;
        });
        return updated;
    }

    async all() {
        return this.database;
    }

    async save(data: UserSavingData) {
        const user = new User({
            ...data,
            id: this.database.length,
        });
        this.database.push(user);
        return user;
    }
}

describe('#1 Testes nos casos de uso da entidade User', () => {
    it('Autenticação', async (done) => {
        const repository = new UserTestRepository();
        const user = await repository.get({ status: 'active' });
        const useCase = new UserUseCase(new UserTestRepository());
        const [auth, checkedUser] = await useCase.authenticate(user?.email || "", defaultPassword);
        expect(auth).toEqual({ email: true, password: true });
        if (!checkedUser) throw new Error();
        expect(user).toMatchObject(checkedUser);
        done();
    });
    it('Senha errada', async (done) => {
        const repository = new UserTestRepository();
        const user = await repository.get({ status: 'active' });
        const useCase = new UserUseCase(new UserTestRepository());
        const auth = await useCase.authenticate(user?.email || "", 'wrongPass');
        expect(auth).toEqual([{ "email": true, "password": false }, null]);
        done();
    });
    it('Email errado', async (done) => {
        const useCase = new UserUseCase(new UserTestRepository());
        const [auth, notUser] = await useCase.authenticate("wrong__5@mail.com", defaultPassword);
        expect(auth).toEqual({ email: false, password: false });
        expect(notUser).toBeNull();
        done();
    });
    test('Atualização da senha', async (done) => {
        const repository = new UserTestRepository();
        const user = await repository.get({ status: 'active' });
        const usedRepo = new UserTestRepository();
        const useCase = new UserUseCase(usedRepo);
        const changed = await useCase.updatePassword(user?.id || 0, 'newPass');
        expect(changed).toBeTruthy();
        const [auth] = await useCase.authenticate(user?.email || "", 'newPass');
        expect(auth).toEqual({ email: true, password: true });
        const [failAuth, notUser] = await useCase.authenticate(user?.email || "", defaultPassword);
        expect(notUser).toBeNull();
        expect(failAuth).toEqual({ email: true, password: false });
        done();
    });
    test('Listagem dos usuários', async done => {
        const usedRepo = new UserTestRepository();
        const useCase = new UserUseCase(usedRepo);
        const all = await useCase.listAll();
        expect(all).toMatchObject(db.users);
        done();
    });
    test('Criação', async done => {
        const userRepo = new UserTestRepository();
        const useCase = new UserUseCase(userRepo);
        const created = await useCase.create({
            email: faker.internet.email(),
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            password: faker.internet.password(),
            permission: 'admin',
            status: 'active',
        });
        expect(created).toBeInstanceOf(User);
        done();
    });
    test('Atualização', async done => {
        const repository = new UserTestRepository();
        const useCase = new UserUseCase(repository);
        const updated = await useCase.update(0, {
            email: faker.internet.email(),
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            password: faker.internet.password(),
            permission: 'admin',
            status: 'active',
        });
        expect(updated).toBeInstanceOf(User);
        const recovered = await useCase.get(0);
        expect(updated).toMatchObject(recovered);
        done();
    });
});