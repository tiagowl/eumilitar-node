import Log, { EventType, LogInterface } from "../entities/Log";
import { createMethod, Filter, filterMethod, PeriodFilter } from "./interfaces";

export interface LogRepositoryInterface {
    readonly create: createMethod<LogInsertion, Log>;
    readonly filter: filterMethod<Log, LogFilter>;
}

export interface LogCreation {
    user?: number;
    event: EventType;
    userAgent?: string;
    ip?: string;
    error?: string;
    details?: string;
}

export interface LogInsertion extends LogCreation {
    registrationDate: Date;
}

export interface LogFilter extends LogInterface, PeriodFilter {}

export default class LogCase {

    constructor(private readonly repository: LogRepositoryInterface) { }

    public async create(data: LogCreation) {
        return this.repository.create({
            ...data,
            registrationDate: new Date(),
        });
    }

    public async filter(filter: Filter<LogFilter>) {
        return this.repository.filter(filter);
    }
}