import { Knex } from "knex";
import * as yup from "yup";
import { Logger } from "winston";
import { Context } from "../interfaces";
import _ from 'lodash';
import XLSX from 'xlsx';
import CaseError, { Errors } from "../../cases/ErrorCase";

export interface ResponseError {
    message?: string;
    errors?: [string, string][];
}

export const paginationSchema = yup.object().shape({
    page: yup.string(),
    pageSize: yup.string(),
    ordering: yup.string(),
    direction: yup.string().notRequired().is(['asc', 'desc']),
}).noUnknown();

const errorsStatus = {
    [Errors.EXPIRED]: 403,
    [Errors.INVALID]: 400,
    [Errors.NOT_FOUND]: 404,
    [Errors.UNAUTHORIZED]: 401,
    [Errors.WRONG_PASSWORD]: 400,
};

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
            this.logger.error(error);
            throw { message: 'Erro ao validar dados', status: 500 };
        }
    }

    protected async processError(error: any) {
        this.logger.error(error);
        if (error instanceof CaseError) {
            return { message: error.message, status: errorsStatus[error.code || Errors.INVALID] };
        }
        if (error.status) return error;
        return { message: error.message || 'Erro interno', status: 500 };
    }

    protected async generateSheet(data: any[], title: string) {
        const sheet = XLSX.utils.json_to_sheet(data, { cellDates: true });
        sheet['!autofilter'] = { ref: "A1:D1" };
        const book = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(book, sheet, title);
        const buffer: Buffer = XLSX.write(book, {
            'bookType': 'csv', 'type': 'buffer', 'compression': true,
        });
        return buffer;
    }

}