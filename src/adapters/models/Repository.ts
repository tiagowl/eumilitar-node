import { Knex } from "knex";
import { Logger } from "winston";
import { Context } from "../interfaces";

export type FieldsMap<Model = any, Entity = any> = [[keyof Model, (val: any) => any], [keyof Entity, (val: any) => any]][];

export default class Repository<Model, Entity> {
    protected fieldsMap: FieldsMap<Model, Entity>;
    protected logger: Logger;
    protected driver: Knex;
    protected context: Context;
    protected service: (driver: Knex) => Knex.QueryBuilder<Partial<Model>, Model[]>;

    constructor(fieldsMap: FieldsMap<Model, Entity>, context: Context, service: (driver: Knex) => Knex.QueryBuilder<Partial<Model>, Model[]>) {
        const { logger, driver } = context;
        this.fieldsMap = fieldsMap;
        this.logger = logger;
        this.driver = driver;
        this.context = context;
        this.service = service;
    }

    get query() { return this.service(this.driver); }

    public async toDb(filter: Partial<Entity>): Promise<Partial<Model>> {
        try {
            const args = Object.entries(filter);
            const parsedParams: Partial<Model> = {};
            return args.reduce((params, param: [string, any]) => {
                const [entityField, value] = param;
                const [db] = this.fieldsMap.find(([_, [field]]) => field === entityField) || [];
                if (db) {
                    const [fieldName, parser] = db;
                    params[fieldName] = parser(value);
                    return params;
                }
                return params;
            }, parsedParams);
        } catch (error) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: 'Erro ao processar dados', status: 500 };
        }
    }

    public async toEntity(user: Model): Promise<Entity> {
        try {
            const fields: [keyof Model, any][] = Object.entries(user) as [keyof Model, any][];
            return fields.reduce((previous, field) => {
                const [_db, entity] = this.fieldsMap.find(([db]) => db[0] === field[0]) || [];
                if (entity) {
                    const [name, parser] = entity;
                    previous[name] = parser(field[1]) as never;
                }
                return previous;
            }, {} as Entity);
        } catch (error) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: 'Erro ao processar dados', status: 500 };
        }
    }

    protected async getDbField(field: keyof Entity): Promise<keyof Model> {
        const parsed = this.fieldsMap.find(([_, [key]]) => key === field);
        if (!parsed) throw { message: `Campo "${field}" não encontrado`, status: 400 };
        return parsed[0][0];
    }
}