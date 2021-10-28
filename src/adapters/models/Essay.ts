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
import EssayInvalidationRepository, { EssayInvalidationService } from "./EssayInvalidation";
import { SingleEssayRepositoryInterface } from "../../cases/SingleEssay";
import SingleEssayRepository from "./SingleEssay";
import { Filter } from "../../cases/interfaces";

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

const fieldsMap: FieldsMap<EssayModel, EssayInterface> = [
    [['essay_id', Number], ['id', Number],],
    [['file_url', String], ['file', String],],
    [['file_path', String], ['file', String],],
    [['user_id', Number], ['student', Number],],
    [['course_tag', courseParser], ['course', reverseCourseParser],],
    [['theme', Number], ['theme', Number],],
    [['last_modified', value => new Date(value)], ['lastModified', value => new Date(value)],],
    [['status', String], ['status', String],],
    [['sent_date', value => new Date(value)], ['sendDate', value => new Date(value)],],
    [['corrector', parseCorrector], ['corrector', parseCorrector],],
];

export class EssayRepository extends Repository<EssayModel, EssayInterface, Essay> implements EssayRepositoryInterface {
    public readonly themes: EssayThemeRepositoryInterface;
    public readonly users: UserRepositoryInterface;
    public readonly products: ProductRepositoryInterface;
    public readonly subscriptions: SubscriptionRepositoryInterface;
    public readonly singles: SingleEssayRepositoryInterface;
    protected readonly fieldsMap;
    protected readonly service;
    protected readonly entity;
    protected readonly searchFields = [];

    constructor(context: Context) {
        super(context);
        this.themes = new EssayThemeRepository(context);
        this.users = new UserRepository(context);
        this.products = new ProductRepository(context);
        this.subscriptions = new SubscriptionRepository(context);
        this.singles = new SingleEssayRepository(context);
        this.fieldsMap = fieldsMap;
        this.service = EssayService;
        this.entity = Essay;
    }

    protected async search(service: Knex.QueryBuilder<Partial<EssayModel>, EssayModel[]>, search?: string) {
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

    public async filter(filterData: Filter<EssayFilter>) {
        try {
            const { search, period, status, correctionPeriod, pagination, ...filter } = filterData;
            const service = this.query;
            this.paginate(service, pagination);
            this.period(service, period);
            this.filterCorrectionPeriod(service, correctionPeriod);
            this.byStatus(service, status);
            await this.search(service, search);
            const parsedFilter = await this.toDb(filter);
            const essaysData = await service.where(parsedFilter);
            const essays = await Promise.all(essaysData?.map(async (data) => await this.toEntity(data)) || []);
            if (!pagination) return essays;
            const counting = this.query;
            await this.search(counting, search);
            this.period(counting, period);
            this.filterCorrectionPeriod(counting, correctionPeriod);
            this.byStatus(counting, status);
            const [{ count }] = await counting.where(parsedFilter).count({ count: '*' });
            const counted = Number(count);
            return {
                page: essays,
                pages: Math.ceil(counted / (pagination.pageSize || 10)),
                count: counted
            };
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
        await this.search(service, search);
        const amount = await service.where(await this.toDb(filter))
            .count<Record<string, { count: number }>>('essay_id as count')
            .catch((err) => {
                this.logger.error(err);
                throw new Error('Erro ao consultar redaçoes no banco de dados');
            });
        return amount[0].count;
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

    public async invalidiationIsExpired(essay: number) {
        try {
            const invalidations = new EssayInvalidationRepository(this.context);
            const invalidation = await invalidations.get({ essay });
            if (!invalidation) return true;
            return invalidation.invalidationDate < new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: 'Erro ao consultar redação no banco de dados', status: 500 };
        }
    }

}