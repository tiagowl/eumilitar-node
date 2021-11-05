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

export default abstract class Controller {
    protected readonly db: Knex;
    protected readonly logger: Logger;

    constructor(protected readonly context: Context) {
        const { db, logger } = context;
        this.db = db;
        this.logger = logger;
    }

    protected async removeVoidValues<T>(obj: T) {
        const entries = Object.entries(obj) as [keyof T, any][];
        const defaultValue = Promise.resolve({}) as Promise<T>;
        return entries.reduce(async (promiseResult, [key, val]) => {
            const result = await promiseResult;
            const isObject = _.isObject(val);
            const isDate = val instanceof Date;
            const value: any = (isObject && !isDate) ? await this.removeVoidValues<typeof val>(val) : val;
            return (isObject && _.isEmpty(value) && !isDate) || !value ? result : { ...result, [key]: value };
        }, defaultValue);
    }

    protected async castFilter<T = any>(filter: T, schema: yup.ObjectSchema<any>) {
        try {
            const parsedFilter = schema.cast(filter || {}, { stripUnknown: true });
            return this.removeVoidValues<T>(parsedFilter);
        } catch (error) {
            return {} as T;
        }
    }

    public async validate<Data = any>(rawData: Data, schema: yup.ObjectSchema<any>): Promise<Data> {
        try {
            const casted = schema.cast(rawData);
            const validated = await schema.validate(casted, {
                strict: true,
                abortEarly: false,
                stripUnknown: true,
                recursive: true,
            });
            return schema.noUnknown().cast(validated, { stripUnknown: true });
        } catch (error: any) {
            if (error instanceof yup.ValidationError) {
                const errors: yup.ValidationError = error;
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