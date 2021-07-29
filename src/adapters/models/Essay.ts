import { Knex } from "knex";
import { EssayFilter, EssayInsertionData, EssayPagination, EssayRepositoryInterface } from "../../cases/EssayCase";
import { EssayThemeRepositoryInterface } from "../../cases/EssayThemeCase";
import { UserRepositoryInterface } from "../../cases/UserUseCase";
import Essay, { EssayInterface, Status } from "../../entities/Essay";
import { Course } from "../../entities/EssayTheme";
import EssayThemeRepository from "./EssayTheme";
import UserRepository, { UserService } from "./User";
import ProductRepository from "./Product";
import { SubscriptionRepositoryInterface } from "../../cases/Subscription";
import { ProductRepositoryInterface } from "../../cases/ProductCase";
import SubscriptionRepository from "./Subscription";
import { Context } from "../interfaces";
import Repository, { FieldsMap } from "./Repository";

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

export const EssayService = (driver: Knex) => driver<Partial<EssayModel>, EssayModel[]>('essays');

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

const fieldParserDB: FieldsMap<EssayModel, EssayInterface> = [
    [['essay_id', Number], ['id', Number],],
    [['file_url', String], ['file', String],],
    [['user_id', Number], ['student', Number],],
    [['course_tag', courseParser], ['course', reverseCourseParser],],
    [['theme', Number], ['theme', Number],],
    [['last_modified', value => new Date(value)], ['lastModified', value => new Date(value)],],
    [['status', String], ['status', String],],
    [['sent_date', value => new Date(value)], ['sendDate', value => new Date(value)],],
    [['corrector', (value: null | number) => !!value ? Number(value) : value], ['corrector', (value: null | number) => !!value ? Number(value) : value],],
];

export class EssayRepository extends Repository<EssayModel, EssayInterface> implements EssayRepositoryInterface {
    public themes: EssayThemeRepositoryInterface;
    public users: UserRepositoryInterface;
    public products: ProductRepositoryInterface;
    public subscriptions: SubscriptionRepositoryInterface;

    constructor(context: Context) {
        super(fieldParserDB, context, EssayService);
        this.themes = new EssayThemeRepository(context);
        this.users = new UserRepository(context);
        this.products = new ProductRepository(context);
        this.subscriptions = new SubscriptionRepository(context);
    }


    private search(service: Knex.QueryBuilder<Partial<EssayModel>, EssayModel[]>, search?: string) {
        if (!!search) service.whereIn('user_id', UserService(this.driver)
            .orWhere('first_name', 'like', `%${search}%`)
            .orWhere('last_name', 'like', `%${search}%`)
            .orWhere('email', 'like', `%${search}%`)
            .select('user_id')
        );
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
                throw new Error('Erro ao consultar banco de dados');
            });
        if (!essayData) return undefined;
        const parsedData = await this.toEntity(essayData);
        return new Essay(parsedData);
    }

    public async create(data: EssayInsertionData) {
        const service = this.query;
        const error = 'Falha ao gravar no banco de dados';
        const parsed = await this.toDb(data);
        const [id] = await service.insert({ ...parsed, local: false, status: 'pending' })
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
                throw new Error('Erro ao consultar banco de dados');
            });
    }

    public async filter(filterData: EssayFilter, pagination?: EssayPagination) {
        const { pageSize = 10, page = 1, ordering = 'sendDate' } = pagination || {};
        const { search, period, status, ...filter } = filterData;
        const service = this.query;
        if (!!pagination) service
            .offset(((page - 1) * (pageSize)))
            .limit(pageSize);
        this.period(service, period);
        this.byStatus(service, status);
        this.search(service, search);
        const orderingField = await this.getDbField(ordering);
        const parsedToDb = await this.toDb(filter);
        const essaysData = await service.where(parsedToDb)
            .orderBy(orderingField, 'asc')
            .catch((err) => {
                this.logger.error(err);
                throw new Error('Erro ao consultar banco de dados');
            });
        return Promise.all(essaysData?.map(async (data) => {
            const parsed = await this.toEntity(data);
            return new Essay(parsed);
        }));
    }

    public async count(filterData: EssayFilter) {
        const { search, period, status, ...filter } = filterData;
        const service = this.search(EssayService(this.driver), search);
        this.period(service, period);
        this.byStatus(service, status);
        this.search(service, search);
        const amount = await service.where(await this.toDb(filter))
            .count<Record<string, { count: number }>>('essay_id as count')
            .catch((err) => {
                this.logger.error(err);
                throw new Error('Erro ao consultar banco de dados');
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
        const error = { message: 'Erro ao consultar banco de dados' };
        const essay = await this.query.where('essay_id', id).first()
            .catch((err) => {
                this.logger.error(err);
                throw { ...error, status: 500 };
            });
        if (!essay) throw { ...error, status: 404 };
        const parsed = await this.toEntity(essay);
        return new Essay(parsed);
    }

}