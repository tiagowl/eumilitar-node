import faker from "faker";
import User, { Permissions } from "../../entities/User";
import UserUseCase, { UserFilter, UserRepositoryInterface, UserSavingData } from "../UserCase";
import getDb, { defaultPassword } from "./repositories/database";
import UserTestRepository from "./repositories/UserTestRepository";

const db = getDb();

describe('#1 Testes nos casos de uso da entidade User', () => {
    const repository = new UserTestRepository(db);
    const useCase = new UserUseCase(repository);
    it('Autenticação', async (done) => {
        const user = await repository.get({ status: 'active' });
        const [auth, checkedUser] = await useCase.authenticate(user?.email || "", defaultPassword);
        expect(auth).toEqual({ email: true, password: true });
        if (!checkedUser) throw new Error();
        expect(user).toMatchObject(checkedUser);
        done();
    });
    it('Senha errada', async (done) => {
        const user = await repository.get({ status: 'active' });
        const auth = await useCase.authenticate(user?.email || "", 'wrongPass');
        expect(auth).toEqual([{ "email": true, "password": false }, null]);
        done();
    });
    it('Email errado', async (done) => {
        const [auth, notUser] = await useCase.authenticate("wrong__5@mail.com", defaultPassword);
        expect(auth).toEqual({ email: false, password: false });
        expect(notUser).toBeNull();
        done();
    });
    test('Atualização da senha', async (done) => {
        const user = await repository.get({ status: 'active' });
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
        const all = await useCase.filter() as User[];
        expect(all.map(user => user.data)).toEqual(repository.database);
        done();
    });
    test('Criação', async done => {
        const created = await useCase.create({
            email: faker.internet.email(),
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            password: faker.internet.password(),
            permission: 'admin',
            status: 'active',
            permissions: new Set([Permissions.SEE_DASHBOARD, Permissions.MANAGE_PRODUCTS]),
        });
        expect(created.permissions.has(Permissions.SEE_DASHBOARD)).toBeTruthy();
        expect(created.permissions.has(Permissions.UPDATE_USER_PASSWORD)).toBeFalsy();
        expect(created).toBeInstanceOf(User);
        done();
    });
    test('Atualização', async done => {
        const updated = await useCase.update(0, {
            email: faker.internet.email(),
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            password: faker.internet.password(),
            permission: 'admin',
            status: 'active',
            permissions: new Set([Permissions.CORRECT_ESSAYS, Permissions.MANAGE_PRODUCTS]),
        });
        expect(updated).toBeInstanceOf(User);
        expect(updated.permissions.has(Permissions.CORRECT_ESSAYS)).toBeTruthy();
        expect(updated.permissions.has(Permissions.UPDATE_USER_PASSWORD)).toBeFalsy();
        const recovered = await useCase.get(0);
        expect(updated).toMatchObject(recovered);
        done();
    });
    test('Gráfico de redações enviadas', async done => {
        const chart = await useCase.sentEssaysChart({});
        expect(chart).toBeInstanceOf(Array);
        expect(chart.length).toBe(12);
        chart.forEach(val => {
            expect(typeof val.key).toBe('string');
            expect(typeof val.value).toBe('number');
        })
        done();
    })
});