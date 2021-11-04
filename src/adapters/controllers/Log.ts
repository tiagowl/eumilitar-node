import LogCase, { LogCreation } from "../../cases/Log";
import { Context } from "../interfaces";
import LogRepository from "../models/Log";
import Controller from "./Controller";
import * as yup from "yup";
import Log, { eventTypes } from "../../entities/Log";

const schema = yup.object().shape({
    user: yup.number(),
    event: yup.string().required().is([...eventTypes]),
    userAgent: yup.string().required(),
    ip: yup.string().required(),
    error: yup.string(),
    details: yup.string(),
});

export default class LogController extends Controller {
    private readonly useCase: LogCase;
    private readonly repository: LogRepository;

    constructor(context: Context) {
        super(context);
        this.repository = new LogRepository(context);
        this.useCase = new LogCase(this.repository);
    }

    private async parseEntity(entity: Log) {
        return { ...entity };
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
}