import faker from "faker";
import Essay, { EssayInterface } from "../../../entities/Essay";
import EssayTheme, { Course } from "../../../entities/EssayTheme";
import { EssayRepositoryInterface, EssayInsertionData, EssayPagination, EssayChartFilter } from "../../Essay";
import { EssayThemeRepositoryInterface } from "../../EssayTheme";
import { Chart } from "../../interfaces";
import { ProductRepositoryInterface } from "../../Product";
import { SingleEssayRepositoryInterface } from "../../SingleEssay";
import { SubscriptionRepositoryInterface } from "../../Subscription";
import { UserRepositoryInterface } from "../../User";
import getDb from "./database";
import { EssayInvalidationTestRepository } from "./InvalidationTestRepository";
import { ProductTestRepository } from "./ProductTestRepository";
import { SingleEssayTestRepository } from "./SingleTestRepository";
import { SubscriptionTestRepository } from "./SubscriptionTestRepository";
import { EssayThemeTestRepository } from "./ThemeTestRepository";
import { UserTestRepository } from "./UserTestRepository";

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
