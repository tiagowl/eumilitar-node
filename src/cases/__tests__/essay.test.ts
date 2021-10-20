import faker from "faker";
import Essay, { EssayInterface } from "../../entities/Essay";
import EssayTheme, { Course } from "../../entities/EssayTheme";
import EssayCase, { EssayChartFilter, EssayCreationData, EssayInsertionData, EssayPagination, EssayRepositoryInterface } from "../Essay";
import { EssayThemeRepositoryInterface } from "../EssayTheme";
import { Chart } from "../interfaces";
import { ProductRepositoryInterface } from "../Product";
import { SingleEssayRepositoryInterface } from "../SingleEssay";
import { SubscriptionRepositoryInterface } from "../Subscription";
import { UserRepositoryInterface } from "../User";
import getDb from "./database";
import { EssayInvalidationTestRepository } from "./invalidation.test";
import { ProductTestRepository } from "./product.test";
import { SingleEssayTestRepository } from "./single.test";
import { SubscriptionTestRepository } from "./subscription.test";
import { EssayThemeTestRepository } from "./theme.test";
import { UserTestRepository } from "./user.test";

const db = getDb();

export class EssayTestRepository implements EssayRepositoryInterface {
    database: any[];
    themes: EssayThemeRepositoryInterface;
    users: UserRepositoryInterface;
    products: ProductRepositoryInterface;
    subscriptions: SubscriptionRepositoryInterface;
    singles: SingleEssayRepositoryInterface;

    constructor() {
        this.database = db.essays;
        this.themes = new EssayThemeTestRepository();
        this.users = new UserTestRepository();
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
        this.singles = new SingleEssayTestRepository();
    }

    async create(data: EssayInsertionData) {
        const essay: EssayInterface = new Essay({
            ...data,
            lastModified: new Date(),
            id: this.database.length,
            status: 'pending',
        });
        this.database.push(essay);
        return new Essay(essay);
    }

    async exists(filters: Partial<EssayInterface>[]) {
        return !!this.database.find(item => filters.reduce((status, filter) => {
            return status || Object.entries(filter)
                .reduce((valid, field) => {
                    return valid && (item[field[0]] === field[1]);
                }, true as boolean);
        }, false as boolean));
    }

    async filter(filter: Partial<EssayInterface>, pagination?: EssayPagination) {
        const { pageSize = 10, page = 1, ordering = 'id' } = pagination || {};
        return this.database.filter(essay => Object.entries(filter)
            .reduce((valid, field) => valid && (essay[field[0]] === field[1]), true as boolean)
        )
            .sort((a, b) => a[ordering] - b[ordering])
            .slice((page - 1) * pageSize, ((page - 1) * pageSize) + pageSize,);
    }

    async count(filter: Partial<EssayInterface>) {
        return (await this.filter(filter)).length;
    }

    async get(filter: Partial<EssayInterface>) {
        return this.database.find(essay => Object.entries(filter)
            .reduce((valid, field) => valid && (essay[field[0]] === field[1]), true as boolean)
        );
    }

    async update(id: number, data: Partial<EssayInterface>) {
        return this.database.map(item => {
            if (item.id === id) {
                return Object.entries(data).reduce((previous, [key, value]) => {
                    try {
                        previous[key] = value;
                    } catch (error: any) {
                        return previous;
                    }
                    return previous;
                }, item);
            }
            return item;
        })[id];
    }

    async evaluatedChart(_filter: EssayChartFilter): Promise<Chart> {
        return [{ key: '1-12', value: 55 }];
    }

    async avgTimeCorrection(_filter: EssayChartFilter): Promise<Chart> {
        return [{ key: '1-12', value: 55 }];
    }

    async invalidiationIsExpired(essay: number) {
        const invalidations = new EssayInvalidationTestRepository();
        const invalidation = await invalidations.get(essay);
        return invalidation.invalidationDate < new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    }
}


describe('#3 Redações', () => {
    test('Criação', async done => {
        const data: EssayCreationData = {
            file: '/path/to/image.png',
            course: 'esa',
            student: 1,
        };
        const repository = new EssayTestRepository();
        const useCase = new EssayCase(repository);
        const created = await useCase.create(data);
        expect(created).not.toBeUndefined();
        expect(created).not.toBeNull();
        expect(created.id).not.toBeUndefined();
        expect(created.id).not.toBeNull();
        const singles = new SingleEssayTestRepository();
        const single = await singles.get({});
        if (!single) throw new Error();
        const dataToken: EssayCreationData = {
            file: '/path/to/image.png',
            student: single.student,
            token: single.token,
        };
        const createdWithToken = await useCase.create(dataToken);
        expect(createdWithToken).not.toBeUndefined();
        expect(createdWithToken).not.toBeNull();
        expect(typeof createdWithToken.id).toBe('number');
        done();
    });
    test('Listagem', async done => {
        const repository = new EssayTestRepository();
        const useCase = new EssayCase(repository);
        const essays = await useCase.myEssays(6);
        expect(essays.length).not.toBeLessThan(1);
        const essay = essays[0];
        expect(essay.id).not.toBeUndefined();
        done();
    });
    test('Listagem de todas', async done => {
        const repository = new EssayTestRepository();
        const useCase = new EssayCase(repository);
        const essays = await useCase.allEssays({});
        expect(essays.length).not.toBeLessThan(1);
        const essay = essays[0];
        expect(essay.id).not.toBeUndefined();
        done();
    });
    test('Recuperação de uma redação', async done => {
        const repository = new EssayTestRepository();
        const useCase = new EssayCase(repository);
        const essay = await useCase.get({ id: 2 });
        expect(essay).toBeDefined();
        expect(essay?.id).toBe(2);
        done();
    });
    test('Atualização da redação', async done => {
        const repository = new EssayTestRepository();
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
    });
    test('Gráfico de envios', async done => {
        const repository = new EssayTestRepository();
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
    });
});
