import { Knex } from "knex";
import { EssayFilter, EssayInsertionData, EssayPagination, EssayRepositoryInterface } from "../../cases/EssayCase";
import { EssayThemeRepositoryInterface } from "../../cases/EssayThemeCase";
import { UserRepositoryInterface } from "../../cases/UserUseCase";
import Essay, { EssayInterface, Status } from "../../entities/Essay";
import { Course } from "../../entities/EssayTheme";
import EssayThemeRepository from "./EssayTheme";
import UserRepository, { UserService } from "./User";

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

type Translator = [keyof EssayModel, Parser];

type FieldMapToDB = {
    [P in keyof EssayInterface]: Translator;
};

const courseMap: [number, Course][] = [
    [2, 'esa'],
    [3, 'espcex'],
];

const courseParser: Parser = data => {
    const field = courseMap.find(([index, slug]) => slug === data);
    if (!field) throw new Error('Curso inválido');
    return field[0];
};

const fieldParserDB: FieldMapToDB = {
    id: ['essay_id', Number],
    file: ['file_path', String],
    student: ['user_id', Number],
    course: ['course_tag', courseParser],
    theme: ['theme', String],
    lastModified: ['last_modified', value => new Date(value)],
    status: ['status', String],
    sendDate: ['sent_date', value => new Date(value)],
    corrector: ['corrector', (value: null | number) => !!value ? Number(value) : value],
};

export class EssayRepository implements EssayRepositoryInterface {
    private driver: Knex;
    themes: EssayThemeRepositoryInterface;
    users: UserRepositoryInterface;

    constructor(driver: Knex) {
        this.driver = driver;
        this.themes = new EssayThemeRepository(driver);
        this.users = new UserRepository(driver);
    }

    private async parseToDB(data: EssayFilter): Promise<EssayInsertion | Partial<EssayModel>> {
        const entries = Object.entries(data) as [keyof EssayInterface, any][];
        return entries.reduce((obj, [key, value]) => {
            const [name, parser] = fieldParserDB[key] as Translator;
            if (key === 'file') {
                const path = value.split('/');
                obj.file_url = parser(value);
                obj.file_name = path[path.lenth - 1];
            }
            obj[name] = parser(value);
            return obj;
        }, {} as Partial<EssayModel>);
    }

    private async parseFromDB(data: EssayModel) {
        const course = courseMap.find(item => item[0] === data.course_tag) as [number, Course];
        return new Essay({
            id: data.essay_id,
            file: data.file_url,
            student: data.user_id,
            course: course[1],
            theme: data.theme,
            status: data.status,
            lastModified: data.last_modified,
            sendDate: data.sent_date,
            corrector: data.corrector,
        });
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

    public async get(filterData: EssayFilter) {
        const service = EssayService(this.driver);
        const { search, period, ...filter } = filterData;
        this.period(service, period);
        this.search(service, search);
        const parsedFilter = await this.parseToDB(filter);
        const essayData = await service.where(parsedFilter).first()
            .catch(() => {
                throw new Error('Erro ao consultar banco de dados');
            });
        if (!essayData) return undefined;
        return this.parseFromDB(essayData);
    }

    public async create(data: EssayInsertionData) {
        const service = EssayService(this.driver);
        const error = new Error('Falha ao gravar no banco de dados');
        const parsed = await this.parseToDB(data);
        const created = await service.insert({ ...parsed, local: false, status: 'pending' })
            .catch(() => { throw error; });
        const id = created[0];
        const check = await this.get({ id });
        if (!check) throw error;
        return check;
    }

    public async exists(is: EssayFilter[]) {
        const service = EssayService(this.driver);
        await Promise.all(is.map(async (filterData) => {
            const { search, ...filter } = filterData;
            service.orWhere(await this.parseToDB(filter));
        }));
        return await service.first()
            .then(data => !!data)
            .catch(() => {
                throw new Error('Erro ao consultar banco de dados');
            });
    }

    public async filter(filterData: EssayFilter, pagination?: EssayPagination) {
        const { pageSize = 10, page = 1, ordering = 'sendDate' } = pagination || {};
        const { search, period, status, ...filter } = filterData;
        const service = EssayService(this.driver).debug(true);
        if (!!pagination) service
            .offset(((page - 1) * (pageSize)))
            .limit(pageSize);
        this.period(service, period);
        this.byStatus(service, status);
        this.search(service, search);
        const orderingField = (fieldParserDB[ordering] as Translator)[0];
        const essaysData = await service.where(await this.parseToDB(filter))
            .orderBy(orderingField, 'asc')
            .catch(() => {
                throw new Error('Erro ao consultar banco de dados');
            });
        return Promise.all(essaysData?.map(this.parseFromDB));
    }

    public async count(filterData: EssayFilter) {
        const { search, period, status, ...filter } = filterData;
        const service = this.search(EssayService(this.driver), search);
        this.period(service, period);
        this.byStatus(service, status);
        this.search(service, search);
        const amount = await service.where(await this.parseToDB(filter))
            .count<Record<string, { count: number }>>('essay_id as count')
            .catch(() => { throw new Error('Erro ao consultar banco de dados'); });
        return amount[0].count;
    }

    public async update(id: number, data: Partial<EssayInsertionData>) {
        const updated = await EssayService(this.driver).where('essay_id', id).update(await this.parseToDB(data))
            .catch(() => { throw { message: 'Erro ao atualizar redação', status: 500 }; });
        if (updated < 1) throw { message: 'Erro ao atualizar redação', status: 404 };
        if (updated > 1) throw { message: `${updated} redações afetadas!`, status: 500 };
        const error = new Error('Erro ao consultar banco de dados');
        const essay = await EssayService(this.driver).where('essay_id', id).first()
            .catch(() => { throw { ...error, status: 500 }; });
        if (!essay) throw { ...error, status: 404 };
        return this.parseFromDB(essay);
    }

}