import faker from "faker";
import Essay, { EssayInterface } from "../../../entities/Essay";
import EssayTheme, { Course } from "../../../entities/EssayTheme";
import { EssayRepositoryInterface, EssayInsertionData, EssayPagination, EssayChartFilter } from "../../Essay";
import { EssayThemeRepositoryInterface } from "../../EssayTheme";
import { Chart, Filter } from "../../interfaces";
import { ProductRepositoryInterface } from "../../Product";
import { SingleEssayRepositoryInterface } from "../../SingleEssay";
import { SubscriptionRepositoryInterface } from "../../Subscription";
import { UserRepositoryInterface } from "../../User";
import { FakeDB } from "./database";
import EssayInvalidationTestRepository from "./InvalidationTestRepository";
import ProductTestRepository from "./ProductTestRepository";
import SingleEssayTestRepository from "./SingleTestRepository";
import SubscriptionTestRepository from "./SubscriptionTestRepository";
import TestRepository from "./TestRepository";
import EssayThemeTestRepository from "./ThemeTestRepository";
import UserTestRepository from "./UserTestRepository";

export default class EssayTestRepository extends TestRepository<Essay, EssayInterface> implements EssayRepositoryInterface {
    themes: EssayThemeRepositoryInterface;
    users: UserRepositoryInterface;
    products: ProductRepositoryInterface;
    subscriptions: SubscriptionRepositoryInterface;
    singles: SingleEssayRepositoryInterface;

    constructor(db: FakeDB) {
        super(db, Essay, 'essays');
        this.themes = new EssayThemeTestRepository(db);
        this.users = new UserTestRepository(db);
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
        this.products = new ProductTestRepository(db);
        this.subscriptions = new SubscriptionTestRepository(db);
        this.singles = new SingleEssayTestRepository(db);
    }

    // @ts-ignore
    public async exists(filters: Partial<EssayInterface>[]) {
        return !!this.database.find(item => filters.reduce((status, filter) => {
            return status || Object.entries(filter)
                .reduce((valid, field) => {
                    // @ts-ignore
                    return valid && (item[field[0]] === field[1]);
                }, true as boolean);
        }, false as boolean));
    }

    async evaluatedChart(_filter: EssayChartFilter): Promise<Chart> {
        return [{ key: '1-12', value: 55 }];
    }

    async avgTimeCorrection(_filter: EssayChartFilter): Promise<Chart> {
        return [{ key: '1-12', value: 55 }];
    }

    async invalidiationIsExpired(essay: number) {
        const invalidations = new EssayInvalidationTestRepository(this.db);
        const invalidation = await invalidations.get({ essay });
        // @ts-ignore
        return invalidation?.invalidationDate < new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    }
}
