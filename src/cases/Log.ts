import Log, { EventType } from "../entities/Log";
import { createMethod } from "./interfaces";

export interface LogRepositoryInterface {
    readonly create: createMethod<LogInsertion, Log>;
}

export interface LogCreation {
    user?: number;
    event: EventType;
    userAgent: string;
    ip: string;
    error?: string;
    details?: string;
}

export interface LogInsertion extends LogCreation {
    registrationDate: Date;
}

export default class LogCase {

    constructor(private readonly repository: LogRepositoryInterface) { }

    public async create(data: LogCreation) {
        return this.repository.create({
            ...data,
            registrationDate: new Date(),
        });
    }
}