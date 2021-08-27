import { Knex } from "knex";
import * as yup from "yup";
import { Logger } from "winston";
import { Context } from "../interfaces";
import _ from 'lodash';

export interface ResponseError {
    message?: string;
    errors?: [string, string][];
}

export const paginationSchema = yup.object().shape({
    page: yup.string(),
    pageSize: yup.string(),
    ordering: yup.string(),
}).noUnknown();

export default class Controller<Fields> {
    protected readonly schema: yup.ObjectSchema<any>;
    protected readonly driver: Knex;
    protected readonly logger: Logger;
    protected readonly context: Context;

    constructor(context: Context, schema: yup.ObjectSchema<any>) {
        const { driver, logger } = context;
        this.context = context;
        this.schema = schema;
        this.driver = driver;
        this.logger = logger;
    }

    protected async removeVoidValues<T>(obj: any) {
        return Object.entries(obj)
            .reduce(async (promiseResult, [key, val]) => {
                const result = await promiseResult;
                const value: any = typeof val === 'object' ? await this.removeVoidValues(val) : val;
                return (_.isEmpty(value) || !value) ? result : { ...result, [key]: value };
            }, Promise.resolve({}) as Promise<T>);
    }

    protected async castFilter<T = any>(filter: T, schema: yup.ObjectSchema<any>) {
        const parsedFilter = schema.cast(filter);
        // tslint:disable-next-line
        console.log(JSON.stringify(parsedFilter), JSON.stringify(filter))
        return this.removeVoidValues<T>(parsedFilter);
    }

    public async isValid(data: Fields) {
        return this.schema.isValid(data);
    }

    public async validate<Data = any>(rawData: Data, schema?: yup.ObjectSchema<any>): Promise<Data> {
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
            if (err instanceof yup.ValidationError) {
                const errors: yup.ValidationError = err;
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