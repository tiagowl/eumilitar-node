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

    public async validate<Data = any>(rawData: Data): Promise<Data> {
        return this.schema.validate(rawData, {
            strict: true,
            abortEarly: false,
            stripUnknown: true,
            recursive: true,
        }).then(data => this.schema.noUnknown().cast(data, { stripUnknown: true }))
            .catch(async (errors: ValidationError) => {
                throw {
                    message: errors.message,
                    errors: errors.inner.map(error => ([error.path, error.message])),
                    status: 400,
                };
            });
    }

}