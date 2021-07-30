import { Knex } from "knex";
import { ObjectSchema, ValidationError } from "yup";
import { Logger } from "winston";
import { Context } from "../interfaces";

export interface ResponseError {
    message?: string;
    errors?: [string, string][];
}

export default class Controller<Fields> {
    protected schema: ObjectSchema<any>;
    protected driver: Knex;
    protected logger: Logger;
    protected context: Context;

    constructor(context: Context, schema: ObjectSchema<any>) {
        const { driver, logger } = context;
        this.context = context;
        this.schema = schema;
        this.driver = driver;
        this.logger = logger;
    }

    public async isValid(data: Fields) {
        return this.schema.isValid(data);
    }

    public async validate<Data = any>(rawData: Data, schema?: ObjectSchema<any>): Promise<Data> {
        try {
            const validator = (!!schema ? schema : this.schema);
            const validated = await validator.validate(rawData, {
                strict: true,
                abortEarly: false,
                stripUnknown: true,
                recursive: true,
            });
            return validator.noUnknown().cast(validated, { stripUnknown: true });
        } catch (err) {
            if (err instanceof ValidationError) {
                const errors: ValidationError = err;
                throw {
                    message: errors.message,
                    errors: errors.inner.map(({ path, message }) => ([path, message])),
                    status: 400,
                };
            }
            throw { message: 'Erro ao validar dados', status: 500 };
        }
    }

}