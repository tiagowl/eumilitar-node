import UserUseCase, { UserFilter, UserRepositoryInterface } from '../src/cases/UserUseCase';
import { hashPassword, userEntityFactory } from './shortcuts';
import EssayThemeCase, { EssayThemeCreation, EssayThemeRepositoryInterface } from '../src/cases/EssayThemeCase';
import EssayTheme, { Course, EssayThemeInterface } from '../src/entities/EssayTheme';
import faker from 'faker';

const defaultPassword = 'pass1235'
const userDatabase = Promise.all(new Array(5).fill(0).map(async () => await userEntityFactory({ password: await hashPassword(defaultPassword) })));
const essayThemeDatabase = new Array();

class TestRepository implements EssayThemeRepositoryInterface, UserRepositoryInterface {
    database: any[]
    constructor(database: any[]) {
        this.database = [...database]
    }
    async get(filter: UserFilter) {
        await this.filter(filter);
        if (this.database.length > 0) return this.database[0]
    }
    async filter(filter: UserFilter) {
        // @ts-ignore
        const fields: [keyof UserFilter, any][] = Object.entries(filter);
        this.database = this.database.filter(item => (
            !!fields.filter(field => !!item[field[0]] && item[field[0]] === field[1]).length
        ))
        return this;
    }
    async update(data: UserFilter) {
        this.database = this.database.map(item => {
            item.update(data);
            return item;
        })
        return this.database.length;
    }
    public async create(data: EssayThemeCreation) {
        const theme: EssayThemeInterface = {
            ...data,
            lastModified: new Date(),
        }
        essayThemeDatabase.push(theme);
        return new EssayTheme({
            ...theme,
            id: essayThemeDatabase.indexOf(theme),
        })
    }
}

describe('Testes nos casos de uso da entidade User', () => {
    it('Autenticação', async (done) => {
        const repository = new TestRepository(await userDatabase);
        const user = await repository.get({ status: 'active' })
        const useCase = new UserUseCase(new TestRepository(await userDatabase));
        const auth = await useCase.authenticate(user?.email || "", defaultPassword)
        expect(auth).toEqual({ email: true, password: true })
        done()
    })
    it('Senha errada', async (done) => {
        const repository = new TestRepository(await userDatabase);
        const user = await repository.get({ status: 'active' })
        const useCase = new UserUseCase(new TestRepository(await userDatabase));
        const auth = await useCase.authenticate(user?.email || "", 'wrongPass')
        expect(auth).toEqual({ email: true, password: false })
        done()
    })
    it('Email errado', async (done) => {
        const useCase = new UserUseCase(new TestRepository(await userDatabase));
        const auth = await useCase.authenticate("wrong__@mail.com", defaultPassword)
        expect(auth).toEqual({ email: false, password: false })
        done()
    })
    test('Atualização da senha', async (done) => {
        const repository = new TestRepository(await userDatabase);
        const user = await repository.get({ status: 'active' });
        const usedRepo = new TestRepository(await userDatabase);
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

describe('Testes nos temas da redação', () => {
    test('Teste na criação de temas de redação', async done => {
        const repository = new TestRepository(essayThemeDatabase);
        const useCase = new EssayThemeCase(repository);
        const data = {
            title: 'Título',
            endDate: new Date(Date.now() + 15 * 24 * 60 * 60),
            startDate: new Date(),
            helpText: faker.lorem.lines(3),
            file: '/usr/share/data/theme.pdf',
            courses: new Set(['esa'] as Course[])
        }
        const created = await useCase.create(data);
        expect(created.id).not.toBeUndefined();
        expect(created.id).not.toBeNull();
        expect(created).toEqual(expect.objectContaining(data))
        done()
    })
})