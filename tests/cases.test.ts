import UserUseCase, { UserFilter, UserRepositoryInterface } from '../src/cases/UserUseCase';
import { hashPassword, userEntityFactory } from './shortcuts';
import EssayThemeCase, { EssayThemeCreation, EssayThemeData, EssayThemeFilter, EssayThemeRepositoryInterface } from '../src/cases/EssayThemeCase';
import EssayTheme, { Course } from '../src/entities/EssayTheme';
import faker from 'faker';
import EssayCase, { EssayCreationData, EssayInsertionData, EssayPagination, EssayRepositoryInterface } from '../src/cases/EssayCase';
import Essay, { EssayInterface } from '../src/entities/Essay';

const defaultPassword = 'pass1235'
const userDatabase = Promise.all(new Array(5).fill(0).map(async () => await userEntityFactory({ password: await hashPassword(defaultPassword) })));
const essayThemeDatabase = new Array(5).fill(0).map((_, index) => new EssayTheme({
    title: 'Título',
    endDate: new Date(Date.now() + 15 * 24 * 60 * 60),
    startDate: new Date(Date.now() - 15 * 24 * 60 * 60),
    helpText: faker.lorem.lines(3),
    file: '/usr/share/data/theme.pdf',
    courses: new Set(['esa', 'espcex'] as Course[]),
    lastModified: new Date(),
    id: index,
    deactivated: false,
}));
const essayDatabase = new Array(5).fill(0).map((_, index) => new Essay({
    file: '/usr/share/data/theme.pdf',
    course: 'esa',
    lastModified: new Date(),
    id: index,
    student: 6,
    theme: faker.datatype.number(),
    status: 'pending',
    sendDate: faker.date.past(),
}));

class UserTestRepository implements UserRepositoryInterface {
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
}

// tslint:disable-next-line
class EssayThemeTestRepository implements EssayThemeRepositoryInterface {
    database: any[]
    constructor(database: any[]) {
        this.database = [...database]
    }
    public async create(data: EssayThemeCreation) {
        const theme = {
            ...data,
            lastModified: new Date(),
        }
        this.database.push(theme);
        return new EssayTheme({
            ...theme,
            id: this.database.indexOf(theme),
        })
    }
    public async exists(filter: EssayThemeFilter) {
        const operations = {
            '=': (a: any, b: any) => a === b,
            '<=': (a: any, b: any) => (a <= b),
            '>=': (a: any, b: any) => (a >= b),
            '>': (a: any, b: any) => (a > b),
            '<': (a: any, b: any) => (a < b),
        }
        if ('reduce' in filter) {
            return filter.reduce((state, item) => {
                return !!this.database.find((data) => operations[item[1]](data[item[0]], item[2])) || state;
            }, false)
        }
        return !!this.database.find((data) => {
            const keys = Object.entries(filter);
            // @ts-ignore
            return keys.reduce((state, item) => {
                return (data[item[0]] === item[1]) && state
            }, true)
        })
    }

    public async hasActiveTheme(data: EssayThemeData, idToIgnore?: number) {
        const database = !!idToIgnore ? this.database.filter(item => item.id !== idToIgnore) : this.database
        return !!database.find((item: EssayTheme) => {
            return (
                (item.startDate <= data.startDate && item.endDate > data.endDate) ||
                (item.startDate > data.startDate && item.startDate < data.endDate)
            ) && !![...data.courses].find(dataTheme => dataTheme in [...item.courses])
        })
    }

    public async findAll(page?: number, pageSize?: number, ordering?: keyof EssayTheme) {
        const start = ((page || 1) - 1) * (pageSize || 10);
        const end = pageSize || 10;
        const order = ordering || 'id'
        return [...this.database].slice(start, end).sort((a, b) => a[order] > b[order] ? 1 : a[order] < b[order] ? -1 : 0)
    }

    public async count() {
        return this.database.length;
    }

    public async update(id: number, data: EssayThemeCreation) {
        // @ts-ignore
        let theme: EssayTheme;
        // @ts-ignore
        this.database = this.database.map(item => {
            if (item.id === id) {
                item.update(data);
                theme = item;
            }
            return item;
        })
        // @ts-ignore
        return theme;
    }

    public async get(filter: EssayThemeFilter) {
        return this.database.find(item => {
            return Object.entries(filter)
                .reduce((valid, field) => {
                    return valid && (item[field[0]] === field[1])
                }, true as boolean)
        })
    }
}

// tslint:disable-next-line
class EssayTestRepository implements EssayRepositoryInterface {
    database: any[]
    themes: EssayThemeRepositoryInterface;

    constructor(database: any[]) {
        this.database = [...database];
        this.themes = new EssayThemeTestRepository(essayThemeDatabase);
        const theme = new EssayTheme({
            title: 'Título',
            endDate: new Date(Date.now() + 15 * 24 * 60 * 60),
            startDate: new Date(Date.now() - 15 * 24 * 60 * 60),
            helpText: faker.lorem.lines(3),
            file: '/usr/share/data/theme.pdf',
            courses: new Set(['esa', 'espcex'] as Course[]),
            lastModified: new Date(),
            id: faker.datatype.number(),
            deactivated: false,
        })
        this.themes.get = async (_: EssayThemeFilter) => theme;
        expect(theme.active).toBeTruthy();
    }

    async create(data: EssayInsertionData) {
        const essay: EssayInterface = new Essay({
            ...data,
            lastModified: new Date(),
            id: this.database.length,
            status: 'pending',
        })
        this.database.push(essay);
        return essay;
    }

    async exists(filters: Partial<EssayInterface>[]) {
        return !!this.database.find(item => filters.reduce((status, filter) => {
            return status || Object.entries(filter)
                .reduce((valid, field) => {
                    return valid && (item[field[0]] === field[1])
                }, true as boolean)
        }, false as boolean))
    }

    async filter(filter: Partial<EssayInterface>, pagination?: EssayPagination) {
        const { pageSize = 10, page = 1, ordering = 'id' } = pagination || {};
        return this.database.filter(essay => Object.entries(filter)
            .reduce((valid, field) => valid && (essay[field[0]] === field[1]), true as boolean)
        )
            .sort((a, b) => a[ordering] - b[ordering])
            .slice((page - 1) * pageSize, ((page - 1) * pageSize) + pageSize,)
    }

    async count(filter: Partial<EssayInterface>) {
        return (await this.filter(filter)).length
    }
}

describe('Testes nos casos de uso da entidade User', () => {
    it('Autenticação', async (done) => {
        const repository = new UserTestRepository(await userDatabase);
        const user = await repository.get({ status: 'active' })
        const useCase = new UserUseCase(new UserTestRepository(await userDatabase));
        const auth = await useCase.authenticate(user?.email || "", defaultPassword)
        expect(auth).toEqual({ email: true, password: true })
        done()
    })
    it('Senha errada', async (done) => {
        const repository = new UserTestRepository(await userDatabase);
        const user = await repository.get({ status: 'active' })
        const useCase = new UserUseCase(new UserTestRepository(await userDatabase));
        const auth = await useCase.authenticate(user?.email || "", 'wrongPass')
        expect(auth).toEqual({ email: true, password: false })
        done()
    })
    it('Email errado', async (done) => {
        const useCase = new UserUseCase(new UserTestRepository(await userDatabase));
        const auth = await useCase.authenticate("wrong__@mail.com", defaultPassword)
        expect(auth).toEqual({ email: false, password: false })
        done()
    })
    test('Atualização da senha', async (done) => {
        const repository = new UserTestRepository(await userDatabase);
        const user = await repository.get({ status: 'active' });
        const usedRepo = new UserTestRepository(await userDatabase);
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
        const repository = new EssayThemeTestRepository(essayThemeDatabase);
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
    test('Lista todos', async done => {
        const repository = new EssayThemeTestRepository(essayThemeDatabase);
        const useCase = new EssayThemeCase(repository);
        const all = await useCase.findAll();
        expect(all).toEqual(essayThemeDatabase);
        const count = await useCase.count();
        expect(count).toEqual(essayThemeDatabase.length);
        done();
    })
    test('Atualiza o tema', async done => {
        const data = {
            title: faker.name.title(),
            endDate: new Date(Date.now() + 505 * 24 * 60 * 60),
            startDate: new Date(Date.now() + 500 * 24 * 60 * 60),
            helpText: faker.lorem.lines(3),
            file: '/usr/share/data/theme.pdf',
            courses: new Set(['esa'] as Course[]),
        }
        const repository = new EssayThemeTestRepository(essayThemeDatabase);
        const useCase = new EssayThemeCase(repository);
        const updated = await useCase.update(0, data);
        expect(updated.id).toEqual(0);
        expect(updated.title).toEqual(data.title);
        expect(updated.endDate).toEqual(data.endDate);
        done();
    })
})

describe('Redações', () => {
    test('Criação', async done => {
        const data: EssayCreationData = {
            file: '/path/to/image.png',
            course: 'esa',
            student: 1,
        }
        const repository = new EssayTestRepository(essayDatabase);
        const useCase = new EssayCase(repository);
        const created = await useCase.create(data);
        expect(created).not.toBeUndefined();
        expect(created).not.toBeNull();
        expect(created.id).not.toBeUndefined();
        expect(created.id).not.toBeNull();
        done();
    })
    test('Listagem', async done => {
        const repository = new EssayTestRepository(essayDatabase);
        const useCase = new EssayCase(repository);
        const essays = await useCase.myEssays(6);
        expect(essays.length).not.toBeLessThan(1);
        const essay = essays[0];
        expect(essay.id).not.toBeUndefined();
        done();
    })
    test('Listagem de todas', async done => {
        const repository = new EssayTestRepository(essayDatabase);
        const useCase = new EssayCase(repository);
        const essays = await useCase.allEssays({});
        expect(essays.length).not.toBeLessThan(1);
        const essay = essays[0];
        expect(essay.id).not.toBeUndefined();
        done();
    })
})