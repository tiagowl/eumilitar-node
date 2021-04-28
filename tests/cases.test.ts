import UserUseCase, { UserFilter } from '../src/cases/UserUseCase';
import { RepositoryInterface } from '../src/cases/interfaces';
import User, { UserData } from '../src/entities/User';
import { hashPasswordSync, userEntityFactory } from './shortcuts';

const defaultPassword = 'pass1235'
const userDatabase = new Array(5).fill(0).map(() => userEntityFactory({ password: hashPasswordSync(defaultPassword) }));

class UserRepository implements RepositoryInterface<User, UserFilter> {
    usersList = [...userDatabase];
    async get(filter: UserFilter) {
        await this.filter(filter);
        if (this.usersList.length > 0) return this.usersList[0]
    }
    async filter(filter: UserFilter) {
        // @ts-ignore
        const fields: [keyof UserFilter, any][] = Object.entries(filter);
        this.usersList = this.usersList.filter(item => (
            !!fields.filter(field => !!item[field[0]] && item[field[0]] === field[1]).length
        ))
        return this;
    }
    async update(data: UserFilter) {
        this.usersList = this.usersList.map(item => {
            Object.assign(item, data);
            return item;
        })
        return this.usersList.length;
    }
}

describe('Testes nos casos de uso da entidade User', () => {
    it('Autenticação', async (done) => {
        const repository = new UserRepository();
        const user = await repository.get({ status: 'active' })
        const useCase = new UserUseCase(new UserRepository());
        const auth = await useCase.authenticate(user?.email || "", defaultPassword)
        expect(auth).toEqual({ email: true, password: true })
        done()
    })
    it('Senha errada', async (done) => {
        const repository = new UserRepository();
        const user = await repository.get({ status: 'active' })
        const useCase = new UserUseCase(new UserRepository());
        const auth = await useCase.authenticate(user?.email || "", 'wrongPass')
        expect(auth).toEqual({ email: true, password: false })
        done()
    })
    it('Email errado', async (done) => {
        const useCase = new UserUseCase(new UserRepository());
        const auth = await useCase.authenticate("wrong__@mail.com", defaultPassword)
        expect(auth).toEqual({ email: false, password: false })
        done()
    })
    test('Atualização da senha', async (done) => {
        const repository = new UserRepository();
        const user = await repository.get({ status: 'active' });
        const usedRepo = new UserRepository();
        const useCase = new UserUseCase(usedRepo);
        const changed = await useCase.updatePassword(user?.id || 0, 'newPass');
        expect(changed).toBeTruthy();
        const auth = await useCase.authenticate(user?.email || "", 'newPass')
        expect(auth).toEqual({ email: true, password: true })
        const failAuth = await useCase.authenticate(user?.email || "", defaultPassword)
        expect(failAuth).toEqual({ email: true, password: false })
        done()
    })
})