import UserUseCase, { UserFilter, UserRepositoryInterface, UserSavingData } from '../src/cases/UserUseCase';
import { hashPassword, userEntityFactory } from './shortcuts';
import EssayThemeCase, { EssayThemeCreation, EssayThemeData, EssayThemeFilter, EssayThemeRepositoryInterface } from '../src/cases/EssayThemeCase';
import EssayTheme, { Course } from '../src/entities/EssayTheme';
import faker, { fake } from 'faker';
import EssayCase, { EssayChartFilter, EssayCreationData, EssayInsertionData, EssayInvalidationData, EssayPagination, EssayRepositoryInterface } from '../src/cases/EssayCase';
import Essay, { EssayInterface } from '../src/entities/Essay';
import User from '../src/entities/User';
import EssayInvalidation from '../src/entities/EssayInvalidation';
import EssayInvalidationCase, { EssayInvalidationRepositoryInterface } from '../src/cases/EssayInvalidation';
import Correction, { CorrectionInterface } from '../src/entities/Correction';
import CorrectionCase, { CorrectionInsertionData, CorrectionRepositoryInterface } from '../src/cases/Correction';
import ProductCase, { ProductCreation, ProductRepositoryInterface } from '../src/cases/ProductCase';
import Product, { ProductInterface } from '../src/entities/Product';
import SubscriptionCase, { ChartFilter, SubscriptionInsertionInterface, SubscriptionRepositoryInterface } from '../src/cases/Subscription';
import Subscription, { SubscriptionInterface } from '../src/entities/Subscription';
import SessionCase, { SessionInsertionInterface, SessionRepositoryInterface } from '../src/cases/Session';
import RecoveryCase, { RecoveryInsertionInterface, RecoveryRepositoryInterface } from '../src/cases/Recovery';
import Session, { SessionInterface } from '../src/entities/Session';
import Recovery, { RecoveryInterface } from '../src/entities/Recovery';
import { Chart } from '../src/cases/interfaces';

const defaultPassword = 'pass1235'
const userDatabase = new Array(5).fill(0).map((_, id) => userEntityFactory({ password: hashPassword(defaultPassword), id }));
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
const essayInvalidationDatabase = new Array(3).fill(0).map((_, id) => new EssayInvalidation({ id, corrector: 0, essay: id, reason: 'invalid', invalidationDate: new Date() }))
const productsDatabase = new Array(5).fill(0).map((_, id) => new Product({
    id,
    code: id * 10,
    course: 'esa',
    name: faker.lorem.sentence(),
    expirationTime: 360 * 24 * 60 * 60 * 1000,
}));

class UserTestRepository implements UserRepositoryInterface {
    database: User[]
    constructor(database: User[]) {
        this.database = [...database]
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
        ))
    }
    async update(id: number, data: UserFilter) {
        let updated = 0;
        this.database = this.database.map(item => {
            if (id === item.id) {
                item.update(data);
                updated++;
            }
            return item;
        })
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

// tslint:disable-next-line
class EssayThemeTestRepository implements EssayThemeRepositoryInterface {
    database: any[]
    constructor(database: any[]) {
        this.database = [...database];
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
class EssayInvalidationTestRepository implements EssayInvalidationRepositoryInterface {
    private database: EssayInvalidation[];
    public essays: EssayRepositoryInterface;

    constructor(database: EssayInvalidation[], users: User[]) {
        this.database = [...database];
        this.essays = new EssayTestRepository(essayDatabase.map(item => new Essay({
            ...item.data, status: 'correcting', corrector: 0
        })), users)
    }

    public async create(data: EssayInvalidationData) {
        const invalidation = new EssayInvalidation({
            ...data,
            id: this.database.length,
            invalidationDate: new Date(),
        })
        this.database.push(invalidation);
        return invalidation;
    }

    public async get(essayId: number) {
        const invalidation = this.database.find(({ id }) => id === essayId);
        if (!invalidation) throw new Error('Não encontrado');
        return invalidation;
    }
}

// tslint:disable-next-line
class EssayTestRepository implements EssayRepositoryInterface {
    database: any[]
    themes: EssayThemeRepositoryInterface;
    users: UserTestRepository;
    products: ProductTestRepository;
    subscriptions: SubscriptionTestRepository;

    constructor(database: any[], users: User[]) {
        this.database = [...database];
        this.themes = new EssayThemeTestRepository(essayThemeDatabase);
        this.users = new UserTestRepository(users);
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
        });
        // @ts-ignore
        this.themes.get = async (_: EssayThemeFilter) => theme;
        expect(theme.active).toBeTruthy();
        this.products = new ProductTestRepository();
        this.subscriptions = new SubscriptionTestRepository();
    }

    async create(data: EssayInsertionData) {
        const essay: EssayInterface = new Essay({
            ...data,
            lastModified: new Date(),
            id: this.database.length,
            status: 'pending',
        })
        this.database.push(essay);
        return new Essay(essay);
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

    async get(filter: Partial<EssayInterface>) {
        return this.database.find(essay => Object.entries(filter)
            .reduce((valid, field) => valid && (essay[field[0]] === field[1]), true as boolean)
        )
    }

    async update(id: number, data: Partial<EssayInterface>) {
        return this.database.map(item => {
            if (item.id === id) {
                return Object.entries(data).reduce((previous, [key, value]) => {
                    try {
                        previous[key] = value;
                    } catch (error: any) {
                        return previous
                    }
                    return previous
                }, item)
            }
            return item
        })[id]
    }

    async evaluatedChart(_filter: EssayChartFilter): Promise<Chart> {
        return [{ key: '1-12', value: 55 }];
    }

    async avgTimeCorrection(_filter: EssayChartFilter): Promise<Chart> {
        return [{ key: '1-12', value: 55 }];
    }
}

// tslint:disable-next-line
class CorrectionTestRepository implements CorrectionRepositoryInterface {
    database: Correction[];
    users: UserRepositoryInterface;
    essays: EssayRepositoryInterface;

    constructor(database: Correction[], users: User[]) {
        this.database = [...database];
        this.users = new UserTestRepository(users);
        this.essays = new EssayTestRepository(essayDatabase.map(item => new Essay({
            ...item.data, status: 'correcting', corrector: 0
        })), users);
    }

    public async create(data: CorrectionInsertionData) {
        const correction = new Correction({
            ...data,
            id: this.database.length,
        })
        this.database.push(correction);
        return correction;
    }

    public async get(filter: Partial<CorrectionInterface>) {
        return this.database.find((correction => (Object.entries(filter) as [keyof CorrectionInterface, any][])
            .reduce((valid, [key, value]) => valid && (correction[key] === value), true as boolean))
        ) as Correction;
    }
}

// tslint:disable-next-line
class ProductTestRepository implements ProductRepositoryInterface {
    private database = productsDatabase;

    public async get(filter: Partial<ProductInterface>) {
        return this.database.find((correction => (Object.entries(filter) as [keyof ProductInterface, any][])
            .reduce((valid, [key, value]) => valid && (correction[key] === value), true as boolean))
        ) as Product;
    }

    public async create(data: ProductCreation) {
        const product = new Product({
            id: this.database.length,
            ...data,
        });
        this.database.push(product);
        return product;
    }

    public async filter(filter: Partial<ProductInterface>) {
        const fields = Object.entries(filter) as [keyof ProductInterface, any][];
        if (!fields.length) return this.database;
        return this.database.filter(item => (
            !!fields.filter(([key, value]) => item[key] === value).length
        ))
    }

    public async update(id: number, data: Partial<ProductInterface>) {
        let product: Product;
        this.database = this.database.map((item) => {
            if (item.id === id) {
                Object.assign(item, data);
                product = item;
            }
            return item;
        });
        // @ts-ignore
        return product;
    }
}

// tslint:disable-next-line
class SubscriptionTestRepository implements SubscriptionRepositoryInterface {
    private database: Subscription[];
    public users: UserTestRepository;
    public products: ProductTestRepository;

    constructor() {
        this.database = userDatabase.reverse().map((user, id) => new Subscription({
            id,
            expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            registrationDate: new Date(),
            user: user.id,
            product: id,
            code: id,
            active: true,
            course: 'esa'
        }));
        this.users = new UserTestRepository(userDatabase);
        this.products = new ProductTestRepository();
    }

    public async create(data: SubscriptionInsertionInterface) {
        const subscription = new Subscription({
            id: this.database.length,
            ...data,
        });
        this.database.push(subscription);
        return subscription;
    }

    public async filter(filter: Partial<SubscriptionInsertionInterface>) {
        const fields = Object.entries(filter) as [keyof SubscriptionInsertionInterface, number | Date][];
        if (!fields.length) return this.database;
        return this.database.filter(item => (
            !!fields.filter(([key, value]) => item[key] === value).length
        ))
    }

    public async update(id: number, data: Partial<SubscriptionInterface>) {
        let subscription: Subscription;
        this.database = this.database.map((item) => {
            if (item.id === id) {
                Object.assign(item, data);
                subscription = item;
            }
            return item;
        });
        // @ts-ignore
        return subscription;
    }

    public async count(filter: Partial<SubscriptionInsertionInterface>) {
        const data = await this.filter(filter);
        return data.length;
    }
}

// tslint:disable-next-line
class SessionTestRepository implements SessionRepositoryInterface {
    public readonly users: UserRepositoryInterface;
    private database: Session[] = new Array(5).fill(0).map((_, id) => new Session({
        id,
        token: faker.random.alphaNumeric(),
        user: id,
        loginTime: new Date(),
        agent: faker.internet.userAgent(),
    }));

    constructor() {
        this.users = new UserTestRepository(userDatabase);
    }

    public async filter(filter: Partial<SessionInterface>) {
        const fields = Object.entries(filter) as [keyof SessionInterface, number | Date][];
        if (!fields.length) return this.database;
        return this.database.filter(item => (
            !!fields.filter(([key, value]) => item[key] === value).length
        ))
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

// tslint:disable-next-line
class RecoveryTestRespository implements RecoveryRepositoryInterface {
    public readonly users: UserRepositoryInterface;
    private database: Recovery[] = new Array(10).fill(0).map((_, id) => new Recovery({
        id,
        expires: new Date(Date.now() + 60 * 60 * 1000),
        selector: faker.datatype.string(),
        token: faker.datatype.string(),
        user: id,
    }));

    constructor() {
        this.users = new UserTestRepository(userDatabase);
    }

    public async filter(filter: Partial<RecoveryInterface>) {
        const fields = Object.entries(filter) as [keyof RecoveryInterface, number | Date][];
        if (!fields.length) return this.database;
        return this.database.filter(item => (
            !!fields.filter(([key, value]) => item[key] === value).length
        ))
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

describe('#1 Testes nos casos de uso da entidade User', () => {
    it('Autenticação', async (done) => {
        const repository = new UserTestRepository(userDatabase);
        const user = await repository.get({ status: 'active' })
        const useCase = new UserUseCase(new UserTestRepository(userDatabase));
        const [auth, checkedUser] = await useCase.authenticate(user?.email || "", defaultPassword)
        expect(auth).toEqual({ email: true, password: true });
        if (!checkedUser) throw new Error();
        expect(user).toMatchObject(checkedUser);
        done()
    })
    it('Senha errada', async (done) => {
        const repository = new UserTestRepository(userDatabase);
        const user = await repository.get({ status: 'active' })
        const useCase = new UserUseCase(new UserTestRepository(userDatabase));
        const auth = await useCase.authenticate(user?.email || "", 'wrongPass')
        expect(auth).toEqual([{ "email": true, "password": false }, null])
        done()
    })
    it('Email errado', async (done) => {
        const useCase = new UserUseCase(new UserTestRepository(userDatabase));
        const [auth, notUser] = await useCase.authenticate("wrong__5@mail.com", defaultPassword)
        expect(auth).toEqual({ email: false, password: false });
        expect(notUser).toBeNull();
        done()
    })
    test('Atualização da senha', async (done) => {
        const repository = new UserTestRepository(userDatabase);
        const user = await repository.get({ status: 'active' });
        const usedRepo = new UserTestRepository(userDatabase);
        const useCase = new UserUseCase(usedRepo);
        const changed = await useCase.updatePassword(user?.id || 0, 'newPass');
        expect(changed).toBeTruthy();
        const [auth] = await useCase.authenticate(user?.email || "", 'newPass')
        expect(auth).toEqual({ email: true, password: true })
        const [failAuth, notUser] = await useCase.authenticate(user?.email || "", defaultPassword)
        expect(notUser).toBeNull();
        expect(failAuth).toEqual({ email: true, password: false })
        done()
    })
    test('Listagem dos usuários', async done => {
        const usedRepo = new UserTestRepository(userDatabase);
        const useCase = new UserUseCase(usedRepo);
        const all = await useCase.listAll();
        expect(all).toMatchObject(userDatabase);
        done();
    });
    test('Criação', async done => {
        const userRepo = new UserTestRepository(userDatabase);
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
        const repository = new UserTestRepository(userDatabase);
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

describe('#2 Testes nos temas da redação', () => {
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

describe('#3 Redações', () => {
    test('Criação', async done => {
        const data: EssayCreationData = {
            file: '/path/to/image.png',
            course: 'esa',
            student: 1,
        }
        const repository = new EssayTestRepository(essayDatabase, (userDatabase).map(user => {
            user.permission = 'student';
            return user;
        }));
        const useCase = new EssayCase(repository);
        const created = await useCase.create(data);
        expect(created).not.toBeUndefined();
        expect(created).not.toBeNull();
        expect(created.id).not.toBeUndefined();
        expect(created.id).not.toBeNull();
        done();
    })
    test('Listagem', async done => {
        const repository = new EssayTestRepository(essayDatabase, userDatabase);
        const useCase = new EssayCase(repository);
        const essays = await useCase.myEssays(6);
        expect(essays.length).not.toBeLessThan(1);
        const essay = essays[0];
        expect(essay.id).not.toBeUndefined();
        done();
    })
    test('Listagem de todas', async done => {
        const repository = new EssayTestRepository(essayDatabase, userDatabase);
        const useCase = new EssayCase(repository);
        const essays = await useCase.allEssays({});
        expect(essays.length).not.toBeLessThan(1);
        const essay = essays[0];
        expect(essay.id).not.toBeUndefined();
        done();
    })
    test('Recuperação de uma redação', async done => {
        const repository = new EssayTestRepository(essayDatabase, userDatabase);
        const useCase = new EssayCase(repository);
        const essay = await useCase.get({ id: 2 });
        expect(essay).toBeDefined();
        expect(essay?.id).toBe(2);
        done();
    })
    test('Atualização da redação', async done => {
        const repository = new EssayTestRepository(essayDatabase, (userDatabase).map(user => {
            user.permission = 'admin';
            return user;
        }));
        const useCase = new EssayCase(repository);
        const updated = await useCase.partialUpdate(1, { corrector: 0 });
        const essay = await useCase.get({ id: 1 });
        expect(updated).toBeDefined();
        expect(updated.corrector).toBe(0);
        // @ts-ignore
        expect(updated).toMatchObject(essay);
        expect(updated?.id).toEqual(essay?.id);
        expect(updated?.corrector).toEqual(essay?.corrector);
        expect(updated?.status).toEqual(essay?.status);
        done();
    })
    test('Gráfico de envios', async done => {
        const repository = new EssayTestRepository(essayDatabase, userDatabase);
        const useCase = new EssayCase(repository);
        const chart = await useCase.sentChart({
            period: {
                start: new Date(Date.now() - 2 * 360 * 24 * 60 * 60 * 1000),
                end: new Date()
            }
        });
        expect(chart).toBeInstanceOf(Array);
        expect(chart.length).toBe(24);
        chart.forEach(item => {
            expect(item, JSON.stringify(chart)).toBeDefined();
            expect(typeof item.key).toBe('string');
            expect(typeof item.value).toBe('number');
        });
        done();
    })
})

describe('#4 Invalidação', () => {
    test('Criação', async done => {
        const repository = new EssayInvalidationTestRepository(essayInvalidationDatabase, userDatabase);
        const useCase = new EssayInvalidationCase(repository);
        const essays = new EssayCase(repository.essays);
        const invalidation = await useCase.create({ reason: 'invalid', corrector: 0, 'essay': 2, 'comment': faker.lorem.lines(5) });
        const essay = await essays.get({ id: 2 });
        expect(invalidation).toBeDefined();
        expect(invalidation.essay).toBe(essay.id);
        done();
    })
    test('Recuperação', async done => {
        const repository = new EssayInvalidationTestRepository(essayInvalidationDatabase, userDatabase);
        const useCase = new EssayInvalidationCase(repository);
        const invalidation = await useCase.get(0);
        expect(invalidation).toBeDefined();
        expect(invalidation.essay).toBe(0);
        done();
    })
})

describe('#5 Correção', () => {
    test('Criação', async done => {
        const repository = new CorrectionTestRepository([], userDatabase);
        const useCase = new CorrectionCase(repository);
        const essays = new EssayCase(repository.essays);
        const correction = await useCase.create({
            'essay': 1,
            'corrector': 0,
            'accentuation': "Sim",
            'agreement': "Sim",
            'cohesion': "Sim",
            'comment': faker.lorem.lines(5),
            'conclusion': "Sim",
            'erased': "Não",
            'followedGenre': "Sim",
            'hasMarginSpacing': "Sim",
            'isReadable': "Sim",
            'obeyedMargins': "Sim",
            'organized': "Sim",
            'orthography': "Sim",
            'points': 10,
            'repeated': "Não",
            'understoodTheme': "Sim",
            'veryShortSentences': "Não",
        })
        const essay = await essays.get({ id: 1 });
        expect(correction).toBeDefined();
        expect(correction).toBeInstanceOf(Correction);
        expect(correction.essay).toBe(essay.id);
        done();
    })
    test('Recuperação', async done => {
        const correction = new Correction({
            'id': 0,
            'essay': 1,
            'accentuation': "Sim",
            'agreement': "Sim",
            'cohesion': "Sim",
            'comment': faker.lorem.lines(5),
            'conclusion': "Sim",
            'erased': "Não",
            'followedGenre': "Sim",
            'hasMarginSpacing': "Sim",
            'isReadable': "Sim",
            'obeyedMargins': "Sim",
            'organized': "Sim",
            'orthography': "Sim",
            'points': 10,
            'repeated': "Não",
            'understoodTheme': "Sim",
            'veryShortSentences': "Não",
            'correctionDate': new Date(),
        })
        const repository = new CorrectionTestRepository([correction], userDatabase);
        const useCase = new CorrectionCase(repository);
        const retrieved = await useCase.get({ essay: correction.essay });
        expect(correction).toMatchObject(correction);
        expect(retrieved).toBeInstanceOf(Correction);
        done();
    })
})

describe('#6 Produtos', () => {
    test('Recuperação', async done => {
        const repository = new ProductTestRepository();
        const useCase = new ProductCase(repository);
        const product = await useCase.get({ code: 10 });
        expect(product).toBeInstanceOf(Product);
        expect(product.id).toBe(1);
        done();
    });
})

describe('#7 Assinaturas', () => {
    test('Criação automática', async done => {
        const repository = new SubscriptionTestRepository();
        const useCase = new SubscriptionCase(repository);
        const subscription = await useCase.autoCreate({
            email: faker.internet.email(),
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            product: 10,
            code: faker.datatype.number(),
        });
        expect(subscription).toBeInstanceOf(Subscription);
        done();
    });
    test('Cancelamento', async done => {
        const repository = new SubscriptionTestRepository();
        const useCase = new SubscriptionCase(repository);
        const canceled = await useCase.cancel(1);
        expect(canceled).toBeInstanceOf(Subscription);
        expect(canceled.active).toBeFalsy();
        done();
    });
    test('Listagem', async done => {
        const repository = new SubscriptionTestRepository();
        const useCase = new SubscriptionCase(repository);
        const subscriptions = await useCase.filter({ 'active': true });
        expect(subscriptions).toBeInstanceOf(Array);
        if (!(subscriptions instanceof Array)) throw new Error();
        subscriptions.forEach(subscription => {
            expect(subscription).toBeInstanceOf(Subscription);
        });
        done();
    })
    test('Criação manual', async done => {
        const repository = new SubscriptionTestRepository();
        const useCase = new SubscriptionCase(repository);
        const subscription = await useCase.create({
            product: 1,
            code: faker.datatype.number(),
            user: 0,
            expiration: new Date(Date.now() + 1000),
            active: true,
        });
        expect(subscription).toBeInstanceOf(Subscription);
        done();
    });
    test('Atualização manual', async done => {
        const repository = new SubscriptionTestRepository();
        const useCase = new SubscriptionCase(repository);
        const subscription = await useCase.update(0, {
            product: 1,
            code: faker.datatype.number(),
            user: 0,
            expiration: new Date(Date.now() + 1000),
            active: true,
        });
        expect(subscription).toBeInstanceOf(Subscription);
        done();
    });
    test('Gráfico ativos', async done => {
        const repository = new SubscriptionTestRepository();
        const useCase = new SubscriptionCase(repository);
        const chart = await useCase.activeChart({});
        expect(chart).toBeInstanceOf(Array);
        chart.forEach(item => {
            expect(item, JSON.stringify(chart)).toBeDefined();
            expect(typeof item.key).toBe('string');
            expect(typeof item.value).toBe('number');
        });
        done();
    });
});

describe('#8 Produtos', () => {
    test('Criação', async done => {
        const repository = new ProductTestRepository();
        const useCase = new ProductCase(repository);
        const product = await useCase.create({
            code: faker.datatype.number(),
            course: 'esa',
            expirationTime: 30 * 24 * 60 * 60 * 1000,
            name: faker.company.companyName(),
        });
        expect(product).toBeInstanceOf(Product);
        expect(product.id).toBeDefined();
        done();
    });
    test('Listagem', async done => {
        const repository = new ProductTestRepository();
        const useCase = new ProductCase(repository);
        const products = await useCase.list({ 'course': 'esa' });
        expect(products).toBeInstanceOf(Array);
        products.forEach(product => {
            expect(product).toBeInstanceOf(Product);
            expect(product.course).toBe('esa');
        });
        done();
    });
    test('Atualização', async done => {
        const repository = new ProductTestRepository();
        const useCase = new ProductCase(repository);
        const [product] = productsDatabase;
        expect(product).toBeDefined();
        const updated = await useCase.update(product.id, { expirationTime: 55 });
        expect(product.id).toBe(updated.id);
        expect(updated.expirationTime).toBe(55);
        done();
    })
});

describe('Sessões', () => {
    test('Autenticação', async done => {
        const [user] = userDatabase.reverse();
        const repository = new SessionTestRepository();
        const useCase = new SessionCase(repository);
        const auth = await useCase.auth({ email: user.email, password: defaultPassword });
        expect(auth).toBeInstanceOf(Session);
        done();
    });
    test('Senha errada', async done => {
        const [user] = userDatabase;
        const repository = new SessionTestRepository();
        const useCase = new SessionCase(repository);
        await expect(async () => {
            return useCase.auth({ email: user.email, password: faker.random.alpha() });
        }).rejects.toThrow('Senha inválida')
        done();
    });
    test('Email inválido', async done => {
        const repository = new SessionTestRepository();
        const useCase = new SessionCase(repository);
        await expect(async () => {
            await useCase.auth({ email: faker.internet.email(), password: defaultPassword });
        }).rejects.toThrow('Email inválido')
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
        const user = userDatabase.find(item => item.checkPassword(defaultPassword));
        if (!user) throw new Error();
        const repository = new SessionTestRepository();
        const useCase = new SessionCase(repository);
        const auth = await useCase.auth({ email: user.email, password: defaultPassword });
        const checked = await useCase.checkToken(auth.token);
        expect(user.id).toBe(checked.id);
        done();
    })
});


describe('Recuperação de senha', () => {
    test('Criação', async done => {
        const repository = new RecoveryTestRespository();
        const useCase = new RecoveryCase(repository, 40 * 60 * 60 * 1000);
        const [selected] = userDatabase;
        const { recovery, user } = await useCase.create(selected.email);
        expect(recovery).toBeInstanceOf(Recovery);
        expect(user).toBeInstanceOf(User);
        done();
    });
    test('Verificação', async done => {
        const repository = new RecoveryTestRespository();
        const [selected] = await repository.filter({});
        const useCase = new RecoveryCase(repository, 40 * 60 * 60 * 1000);
        const isValid = await useCase.check(selected.token);
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
        const [selected] = userDatabase;
        const { recovery, user } = await useCase.create(selected.email, false);
        expect(recovery).toBeInstanceOf(Recovery);
        expect(recovery.token.length).toBe(6);
        expect(user).toBeInstanceOf(User);
        done();
    });
})