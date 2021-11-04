import { Knex } from "knex";
import { LogRepositoryInterface } from "../../cases/Log";
import Log, { EventType, LogInterface } from "../../entities/Log";
import Repository, { FieldsMap, prsr } from "./Repository";

export interface LogModel {
    readonly id: number;
    user?: number;
    registrationDate: Date;
    event: EventType;
    userAgent?: string;
    ip: string;
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
    protected readonly searchFields = [];
    protected readonly service = LogService;
}