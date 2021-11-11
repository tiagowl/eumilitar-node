import Log, { EventType, LogInterface } from "../entities/Log";
import { createMethod, Filter, filterMethod, Operator, PeriodFilter } from "./interfaces";

export interface LogRepositoryInterface {
    readonly create: createMethod<LogInsertion, Log>;
    readonly filter: filterMethod<Log, LogInterface>;
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

export interface LogFilter extends LogInterface, PeriodFilter { }

export default class LogCase {

    constructor(private readonly repository: LogRepositoryInterface) { }

    public async create(data: LogCreation) {
        return this.repository.create({
            ...data,
            registrationDate: new Date(),
        });
    }

    public async filter(filter: Filter<LogFilter>) {
        const { period, ...params } = filter;
        const operation: [keyof LogInterface, Operator, any][] = [];
        if (period?.start) operation.push(['registrationDate', '>=', period.start]);
        if (period?.end) operation.push(['registrationDate', '<=', period.end]);
        return this.repository.filter({
            ...params,
            operation,
        });
    }
}