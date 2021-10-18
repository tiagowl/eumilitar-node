import { Knex } from "knex";
import { EssayChartFilter, EssayFilter, EssayInsertionData, EssayPagination, EssayRepositoryInterface } from "../../cases/Essay";
import { EssayThemeRepositoryInterface } from "../../cases/EssayTheme";
import { UserRepositoryInterface } from "../../cases/User";
import Essay, { EssayInterface, Status } from "../../entities/Essay";
import { Course } from "../../entities/EssayTheme";
import EssayThemeRepository from "./EssayTheme";
import UserRepository, { UserService } from "./User";
import ProductRepository from "./Product";
import { SubscriptionRepositoryInterface } from "../../cases/Subscription";
import { ProductRepositoryInterface } from "../../cases/Product";
import SubscriptionRepository from "./Subscription";
import { Context } from "../interfaces";
import Repository, { FieldsMap } from "./Repository";
import { CorrectionService } from "./Correction";
import { EssayInvalidationService } from "./EssayInvalidation";
import { SingleEssayRepositoryInterface } from "../../cases/SingleEssay";
import SingleEssayRepository from "./SingleEssay";

export interface EssayModel extends EssayInsertion {
    essay_id: number;
    last_modified: Date;
    sent_date: Date;
    local: boolean;
    corrector?: number;
}

export interface EssayInsertion {
    file_name: string;
    file_url: string;
    file_path: string;
    user_id: number;
    course_tag: number;
    theme: number;
    status: Status;
}

export const EssayService = (db: Knex) => db<Partial<EssayModel>, EssayModel[]>('essays');

type Parser = (data: any) => any;

const courseMap: [number, Course][] = [
    [0, 'blank'],
    [2, 'esa'],
    [3, 'espcex'],
];

const courseParser: Parser = (data: Course) => {
    const field = courseMap.find(([_, slug]) => slug === data);
    if (!field) throw new Error('Curso inválido');
    return field[0];
};

const reverseCourseParser: Parser = (data: number) => {
    const field = courseMap.find(([key, _]) => key === data);
    if (!field) throw new Error('Curso inválido');
    return field[1];
};

const parseCorrector = (value: null | number) => value === null ? value : Number(value);

const fieldParserDB: FieldsMap<EssayModel, EssayInterface> = [
    [['essay_id', Number], ['id', Number],],
    [['file_url', String], ['file', String],],
    [['user_id', Number], ['student', Number],],
    [['course_tag', courseParser], ['course', reverseCourseParser],],
    [['theme', Number], ['theme', Number],],
    [['last_modified', value => new Date(value)], ['lastModified', value => new Date(value)],],
    [['status', String], ['status', String],],
    [['sent_date', value => new Date(value)], ['sendDate', value => new Date(value)],],
    [['corrector', parseCorrector], ['corrector', parseCorrector],],
];

export class EssayRepository extends Repository<EssayModel, EssayInterface> implements EssayRepositoryInterface {
    public readonly themes: EssayThemeRepositoryInterface;
    public readonly users: UserRepositoryInterface;
    public readonly products: ProductRepositoryInterface;
    public readonly subscriptions: SubscriptionRepositoryInterface;
    public readonly singles: SingleEssayRepositoryInterface;

    constructor(context: Context) {
        super(fieldParserDB, context, EssayService);
        this.themes = new EssayThemeRepository(context);
        this.users = new UserRepository(context);
        this.products = new ProductRepository(context);
        this.subscriptions = new SubscriptionRepository(context);
        this.singles = new SingleEssayRepository(context);
    }


    private search(service: Knex.QueryBuilder<Partial<EssayModel>, EssayModel[]>, search?: string) {
        if (!!search) {
            const userSubQuery = UserService(this.db)
                .orWhere('first_name', 'like', `%${search}%`)
                .orWhere('last_name', 'like', `%${search}%`)
                .orWhere('email', 'like', `%${search}%`)
                .select('user_id');
            const terms = search.split(' ');
            if (terms.length > 1) {
                userSubQuery.orWhere(function () {
                    terms.forEach(val => {
                        this.andWhere(function () {
                            this.orWhere('first_name', 'like', `%${val}%`)
                                .orWhere('last_name', 'like', `%${val}%`)
                                .orWhere('email', 'like', `%${val}%`);
                        });
                    });
                });
            }
            service.whereIn('user_id', userSubQuery);
        }
        return service;
    }

    private period(service: Knex.QueryBuilder<Partial<EssayModel>, EssayModel[]>, period?: { start?: Date, end?: Date }) {
        const { start, end } = period || {};
        return !!period ? service.where(function () {
            if (!!end) this.where('sent_date', '<', end);
            if (!!start) this.where('sent_date', '>', start);
        }) : service;
    }

    private byStatus(service: Knex.QueryBuilder<Partial<EssayModel>, EssayModel[]>, status?: Status) {
        if (!status) return service;
        if (status === 'evaluated') {
            return service.where(function () {
                this.orWhere('status', '=', 'revised')
                    .orWhere('status', '=', 'invalid');
            });
        }
        return service.where('status', '=', status);
    }

    private filterCorrectionPeriod(service: Knex.QueryBuilder<Partial<EssayModel>, EssayModel[]>, period?: { start?: Date, end?: Date }) {
        const { start, end } = period || {};
        if (!!period) {
            const corrections = CorrectionService(this.db).where(function () {
                if (!!end) this.where('grading_date', '<', end);
                if (!!start) this.where('grading_date', '>', start);
            }).select('essay_id');
            const invalidations = EssayInvalidationService(this.db).where(function () {
                if (!!end) this.where('invalidationDate', '<', end);
                if (!!start) this.where('invalidationDate', '>', start);
            }).select('essay as essay_id');
            service.andWhere(function () {
                this.orWhere(function () {
                    this.whereIn('essay_id', corrections);
                }).orWhere(function () {
                    this.whereIn('essay_id', invalidations);
                });
            });
        }
        return service;
    }

    public async toDb(data: Partial<EssayInterface>) {
        const parsed = await super.toDb(data);
        if (parsed.file_url) return {
            ...parsed,
            file_path: parsed.file_url,
        };
        return parsed;
    }

    public async get(filterData: EssayFilter) {
        const service = this.query;
        const { search, period, ...filter } = filterData;
        this.period(service, period);
        this.search(service, search);
        const parsedFilter = await this.toDb(filter);
        const essayData = await service.where(parsedFilter).first()
            .catch((err) => {
                this.logger.error(err);
                throw new Error('Erro ao consultar redação no banco de dados');
            });
        if (!essayData) return undefined;
        const parsedData = await this.toEntity(essayData);
        return new Essay(parsedData);
    }

    public async create(data: EssayInsertionData) {
        const error = 'Falha ao gravar no banco de dados';
        const parsed = await this.toDb(data);
        const [id] = await this.query.insert({ ...parsed, local: false, status: 'pending' })
            .catch((err) => {
                this.logger.error(err);
                throw new Error(error);
            });
        const check = await this.get({ id });
        if (!check) throw new Error(error);
        return check;
    }

    public async exists(is: EssayFilter[]) {
        const service = this.query;
        await Promise.all(is.map(async (filterData) => {
            const { search, ...filter } = filterData;
            service.orWhere(await this.toDb(filter));
        }));
        return await service.first()
            .then(data => !!data)
            .catch((err) => {
                this.logger.error(err);
                throw new Error('Erro ao consultar redação no banco de dados');
            });
    }

    public async filter(filterData: EssayFilter, pagination?: EssayPagination) {
        try {
            const { search, period, status, correctionPeriod, ...filter } = filterData;
            const service = this.query;
            this.paginate(service, pagination);
            this.period(service, period);
            this.filterCorrectionPeriod(service, correctionPeriod);
            this.byStatus(service, status);
            this.search(service, search);
            const parsedToDb = await this.toDb(filter);
            const essaysData = await service.where(parsedToDb);
            return Promise.all(essaysData?.map(async (data) => {
                const parsed = await this.toEntity(data);
                return new Essay(parsed);
            }));
        } catch (error: any) {
            this.logger.error(error);
            throw new Error('Erro ao consultar redações no banco de dados');
        }
    }

    public async count(filterData: EssayFilter) {
        const { search, period, status, correctionPeriod, ...filter } = filterData;
        const service = this.query;
        this.filterCorrectionPeriod(service, correctionPeriod);
        this.period(service, period);
        this.byStatus(service, status);
        this.search(service, search);
        const amount = await service.where(await this.toDb(filter))
            .count<Record<string, { count: number }>>('essay_id as count')
            .catch((err) => {
                this.logger.error(err);
                throw new Error('Erro ao consultar redaçoes no banco de dados');
            });
        return amount[0].count;
    }

    public async update(id: number, data: Partial<EssayInsertionData>) {
        const updated = await this.query.where('essay_id', id).update(await this.toDb(data))
            .catch((err) => {
                this.logger.error(err);
                throw { message: 'Erro ao atualizar redação', status: 500 };
            });
        if (updated < 1) throw { message: 'Erro ao atualizar redação', status: 404 };
        if (updated > 1) throw { message: `${updated} redações afetadas!`, status: 500 };
        const error = { message: 'Erro ao consultar redação no banco de dados' };
        const essay = await this.query.where('essay_id', id).first()
            .catch((err) => {
                this.logger.error(err);
                throw { ...error, status: 500 };
            });
        if (!essay) throw { ...error, status: 404 };
        const parsed = await this.toEntity(essay);
        return new Essay(parsed);
    }

    public async evaluatedChart(filter: EssayChartFilter) {
        try {
            const { period, ...filterData } = filter;
            const start = period?.start || new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000);
            const end = period?.end || new Date();
            const months = Math.round((end.getTime() - start.getTime()) / (30 * 24 * 60 * 60 * 1000));
            const parsed = await this.toDb(filterData);
            const chart = new Array(months).fill(0)
                .map(async (_, index) => {
                    const current = start.getMonth() + index;
                    const date = new Date(start.getFullYear(), current, 1);
                    const month = date.getMonth() + 1;
                    const year = date.getFullYear();
                    const revised = CorrectionService(this.db)
                        .whereRaw('year(`grading_date`) = ?', year)
                        .whereRaw('month(`grading_date`) = ?', month)
                        .select('essay_id');
                    const invalid = EssayInvalidationService(this.db)
                        .whereRaw('year(`invalidationDate`) = ?', year)
                        .whereRaw('month(`invalidationDate`) = ?', month)
                        .select('essay as essay_id');
                    const [{ value }] = await this.query.where(parsed)
                        .where(function () {
                            this.orWhereIn('essay_id', revised);
                            this.orWhereIn('essay_id', invalid);
                        }).count({ value: '*' });
                    return {
                        key: `${month}-${year}`,
                        value: Number(value),
                    };
                });
            return Promise.all(chart);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: 'Erro ao consultar redações no banco de dados', status: 500 };
        }
    }

    public async avgTimeCorrection(filter: EssayChartFilter) {
        try {
            const { period, ...filterData } = filter;
            const start = period?.start || new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000);
            const end = period?.end || new Date();
            const months = Math.round((end.getTime() - start.getTime()) / (30 * 24 * 60 * 60 * 1000));
            const parsed = await this.toDb(filterData);
            const chart = new Array(months).fill(undefined)
                .map(async (_, index) => {
                    const current = start.getMonth() + index;
                    const date = new Date(start.getFullYear(), current, 1);
                    const month = date.getMonth() + 1;
                    const year = date.getFullYear();
                    const [corrections] = await this.db.avg('diff as avg')
                        .from(CorrectionService(this.db)
                            .where(this.db.raw('MONTH(`essay_grading`.`grading_date`) = ?', month))
                            .where(this.db.raw('YEAR(`essay_grading`.`grading_date`) = ?', year))
                            .whereIn('essay_grading.essay_id', this.query.where(parsed).select('essay_id'))
                            .innerJoin('essays', 'essays.essay_id', 'essay_grading.essay_id')
                            .select(this.db.raw('DISTINCT TIME_TO_SEC(TIMEDIFF(`essay_grading`.`grading_date`, `essays`.`sent_date`)) as `diff`'))
                            .as('join')
                        ) as any[];
                    const [invalidations] = await this.db.avg('diff as avg')
                        .from(EssayInvalidationService(this.db)
                            .where(this.db.raw('MONTH(`essay_invalidations`.`invalidationDate`) = ?', month))
                            .where(this.db.raw('YEAR(`essay_invalidations`.`invalidationDate`) = ?', year))
                            .whereIn('essay_invalidations.essay', this.query.where(parsed).select('essay_id as essay'))
                            .innerJoin('essays', 'essays.essay_id', 'essay_invalidations.essay')
                            .select(this.db.raw('DISTINCT TIME_TO_SEC(TIMEDIFF(`essay_invalidations`.`invalidationDate`, `essays`.`sent_date`)) as `diff`'))
                            .as('join')
                        ) as any[];
                    const value = Math.round(((Number(corrections.avg) + Number(invalidations.avg)) / 2) * 1000);
                    return {
                        key: `${month}-${year}`,
                        value,
                    };
                });
            return Promise.all(chart);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: 'Erro ao consultar redações no banco de dados', status: 500 };
        }
    }

}