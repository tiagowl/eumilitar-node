import { Knex } from "knex";
import { Filter } from "../../cases/interfaces";
import { LogFilter, LogRepositoryInterface } from "../../cases/LogCase";
import Log, { EventType, LogInterface } from "../../entities/Log";
import Repository, { FieldsMap, prsr } from "./Repository";
import { UserService } from "./UserRepository";

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
    [['id', prsr.number], ['id', prsr.number]],
    [['user', prsr.number], ['user', prsr.number]],
    [['registrationDate', prsr.date], ['registrationDate', prsr.date]],
    [['event', prsr.string], ['event', prsr.string]],
    [['userAgent', prsr.string], ['userAgent', prsr.string]],
    [['ip', prsr.string], ['ip', prsr.string]],
    [['error', prsr.string], ['error', prsr.string]],
    [['details', prsr.string], ['details', prsr.string]],
];

export default class LogRepository extends Repository<LogModel, LogInterface, Log> implements LogRepositoryInterface {
    protected readonly entity = Log;
    protected readonly fieldsMap = fieldsMap;
    protected readonly searchFields: (keyof LogModel)[] = [];
    protected readonly service = LogService;

    protected async filtering(query: Knex.QueryBuilder<Partial<LogModel>, LogModel[]>, filter: Filter<LogInterface>) {
        const { search } = filter;
        query.leftJoin('users', function () {
            this.on('users.user_id', '=', 'logs.user');
        });
        await this.search(query, search, ['email', 'first_name', 'last_name']);
        return super.filtering(query, filter);
    }

}