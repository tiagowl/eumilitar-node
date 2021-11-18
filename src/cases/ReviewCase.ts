import Review, { ReviewInterface } from "../entities/Review";
import CaseError, { Errors } from "./ErrorCase";
import { countMethod, createMethod, existsMethod, filterMethod, Operator } from "./interfaces";
import SettingsCase, { SettingsRepositoryInterface } from "./SettingsCase";

export interface ReviewCreation {
    grade: number;
    user: number;
    description?: string;
}

export interface ReviewInsertion extends ReviewCreation {
    registrationDate: Date;
}

export interface ReviewRepositoryInterface {
    readonly settings: SettingsRepositoryInterface;
    readonly create: createMethod<ReviewInsertion, Review>;
    readonly exists: existsMethod<ReviewInterface>;
    readonly filter: filterMethod<Review, ReviewInterface>;
    readonly count: countMethod<ReviewInterface>;
}

export interface ReviewSettings {
    readonly expiration: number;
}

export interface ReviewChartFilter extends Partial<ReviewInterface> {
    period?: {
        start?: Date;
        end?: Date;
    };
}

type FilterTypes = 'detractor' | 'neutral' | 'booster';

const typeFilters: { [s in FilterTypes]: ([keyof ReviewInterface, Operator, any])[] } = {
    detractor: [['grade', '>=', 1], ['grade', '<=', 6]],
    neutral: [['grade', '>=', 7], ['grade', '<=', 8]],
    booster: [['grade', '>=', 9], ['grade', '<=', 10]],
};

export type ReviewResultChart = {
    [s in FilterTypes]: number;
} & { key: string };

export default class ReviewCase {
    private readonly settings: SettingsCase;

    constructor(private readonly repository: ReviewRepositoryInterface) {
        this.settings = new SettingsCase(this.repository.settings);
    }

    public async canSend(user: number) {
        const settings = await this.settings.get();
        const expiration = Date.now() - settings.reviewExpiration * 24 * 60 * 60 * 1000;
        const sent = await this.repository.exists({
            user,
            operation: [
                ['registrationDate', '>', new Date(expiration)],
            ]
        });
        return !sent;
    }

    public async create(data: ReviewCreation) {
        const canSend = await this.canSend(data.user);
        if (!canSend) throw new CaseError('Já foi enviado uma avaliação', Errors.UNAUTHORIZED);
        return this.repository.create({
            ...data,
            registrationDate: new Date(),
        });
    }

    public async resultChart(filter: ReviewChartFilter): Promise<ReviewResultChart[]> {
        const { period = {}, ...params } = filter;
        const now = new Date();
        const defaultStart = new Date(now.getFullYear(), now.getMonth() - 12);
        const { start = defaultStart, end = now } = period;
        const months = Math.round((end.getTime() - start.getTime()) / (30 * 24 * 60 * 60 * 1000));
        return Promise.all(Array.from({ length: months }, async (_, index) => {
            const date = new Date(start.getFullYear(), start.getMonth() + index, 1);
            const month = date.getMonth();
            const year = date.getFullYear();
            const types = Object.entries(typeFilters) as [FilterTypes, [keyof ReviewInterface, Operator, any][]][];
            const { detractor = 0, booster = 0, neutral = 0 } = await types.reduce(async (objPromise, [type, typeFilter]) => {
                const obj = await objPromise;
                const value = await this.repository.count({
                    ...params,
                    operation: [
                        ['registrationDate', '>=', new Date(year, month, 1, 0, 0, 0)],
                        ['registrationDate', '<=', new Date(year, month + 1, 0, 23, 59, 59)],
                        ...typeFilter,
                    ],
                });
                return { ...obj, [type]: value };
            }, Promise.resolve({} as { [s in FilterTypes]: number }));
            const total = (detractor + booster + neutral) || 1;
            return {
                key: `${month + 1}-${year}`,
                detractor: detractor * 100 / total,
                neutral: neutral * 100 / total,
                booster: booster * 100 / total,
            } as ReviewResultChart;
        }));
    }
}