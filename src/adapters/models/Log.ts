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

    protected async filtering(query: Knex.QueryBuilder<Partial<LogModel>, LogModel[]>, filter: Filter<LogInterface>) {
        const { pagination, search, ...params } = filter;
        query.leftJoin('users', function () {
            this.on('users.user_id', '=', 'logs.user');
        });
        await this.search(query, search, ['email', 'first_name', 'last_name']);
        const parsed = await this.toDb(params);
        query.where(parsed);
    }

}