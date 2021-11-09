import { Knex } from "knex";
import { Filter } from "../../cases/interfaces";
import { LogFilter, LogRepositoryInterface } from "../../cases/Log";
import Log, { EventType, LogInterface } from "../../entities/Log";
import Repository, { FieldsMap, prsr } from "./Repository";
import { UserService } from "./User";

export interface LogModel {
    readonly id: number;
    user?: number;
    registrationDate: Date;
    event: EventType;
    userAgent?: string;
    ip?: string;
    error?: string;
    details?: string;
}

export const LogService = (db: Knex) => db<Partial<LogModel>, LogModel[]>('logs');

const fieldsMap: FieldsMap<LogModel, LogInterface> = [
    [['id', prsr.nb], ['id', prsr.nb]],
    [['user', prsr.nb], ['user', prsr.nb]],
    [['registrationDate', prsr.dt], ['registrationDate', prsr.dt]],
    [['event', prsr.st], ['event', prsr.st]],
    [['userAgent', prsr.st], ['userAgent', prsr.st]],
    [['ip', prsr.st], ['ip', prsr.st]],
    [['error', prsr.st], ['error', prsr.st]],
    [['details', prsr.st], ['details', prsr.st]],
];

export default class LogRepository extends Repository<LogModel, LogInterface, Log> implements LogRepositoryInterface {
    protected readonly entity = Log;
    protected readonly fieldsMap = fieldsMap;
    protected readonly searchFields: (keyof LogModel)[] = ['details', 'error', 'ip', 'userAgent', 'event', 'id'];
    protected readonly service = LogService;

    private async filtering(query: Knex.QueryBuilder<Partial<LogModel>, LogModel[]>, filter: Filter<LogFilter>) {
        const { pagination, search, email, period, ...params } = filter;
        await this.search(query, search);
        await this.paginate(query, pagination);
        const { start, end } = period || {};
        if (!!period) query.where(function () {
            if (!!end) this.where('registrationDate', '<', end);
            if (!!start) this.where('registrationDate', '>', start);
        });
        if (email) query.whereIn('user', UserService(this.db).where('email', 'like', email).select('user_id as user'));
        const parsed = await this.toDb(params);
        query.where(parsed);
    }

    public async filter(filter: Filter<LogFilter>) {
        try {
            const { pagination } = filter;
            const query = this.query;
            await this.filtering(query, filter);
            const filtered = await query;
            const data = await Promise.all(filtered.map(async item => new this.entity(item)));
            if (!pagination) return data;
            const counting = this.query;
            await this.filtering(counting, filter);
            const [{ count }] = await counting.count({ count: '*' });
            const counted = Number(count);
            return {
                page: data,
                pages: Math.ceil(counted / (pagination.pageSize || 10)),
                count: counted
            };
        } catch (error: any) {
            throw await this.processError(error);
        }
    }
}