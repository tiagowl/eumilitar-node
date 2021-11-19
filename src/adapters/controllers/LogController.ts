import LogCase, { LogCreation, LogFilter } from "../../cases/LogCase";
import { Context } from "../interfaces";
import LogRepository from "../models/LogRepository";
import Controller, { paginationSchema } from "./Controller";
import * as yup from "yup";
import Log, { eventTypes } from "../../entities/Log";
import { Filter } from "../../cases/interfaces";
import UserController from "./UserController";

const baseSchema = {
    user: yup.number(),
    event: yup.string().required().is([...eventTypes]),
    userAgent: yup.string(),
    ip: yup.string(),
    error: yup.string(),
    details: yup.string(),
};

const schema = yup.object().shape(baseSchema);

const filterSchema = yup.object().shape({
    ...baseSchema,
    event: yup.string().is([...eventTypes]),
    id: yup.number(),
    email: yup.string(),
    period: yup.object().shape({
        start: yup.date().nullable(true),
        end: yup.date().nullable(true),
    }).nullable(true),
    pagination: paginationSchema,
    search: yup.string(),
});

export default class LogController extends Controller {
    private readonly useCase: LogCase;
    private readonly repository: LogRepository;

    constructor(context: Context) {
        super(context);
        this.repository = new LogRepository(context);
        this.useCase = new LogCase(this.repository);
    }

    private parseEntity = async (entity: Log) => {
        const users = new UserController(this.context);
        return {
            ...entity,
            user: !!entity.user ? await users.get(entity.user) : undefined,
        };
    }

    public async create(data: LogCreation) {
        try {
            const validated = await this.validate(data, schema);
            const created = await this.useCase.create(validated);
            return await this.parseEntity(created);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: error.message, status: 500 };
        }
    }

    public async filter(filter: Filter<LogFilter>) {
        try {
            const validated = await this.castFilter(filter, filterSchema);
            const filtered = await this.useCase.filter(validated);
            if (filtered instanceof Array) return await Promise.all(filtered.map(this.parseEntity));
            return {
                ...filtered,
                page: await Promise.all(filtered.page.map(this.parseEntity)),
            };
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: error.message, status: 500 };
        }
    }
}