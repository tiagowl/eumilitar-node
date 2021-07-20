import { Knex } from "knex";
import { Logger } from "winston";

export type FieldsMap<Model = any, Entity = any> = [[keyof Model, (val: any) => any], [keyof Entity, (val: any) => any]][];

export default class Repository<Model, Entity> {
    protected fieldsMap: FieldsMap<Model, Entity>;
    protected logger: Logger;
    protected driver: Knex;

    constructor(fieldsMap: FieldsMap<Model, Entity>, logger: Logger, driver: Knex) {
        this.fieldsMap = fieldsMap;
        this.logger = logger;
        this.driver = driver;
    }

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
            throw { message: 'Erro ao processar dados', status: 500 };
        }
    }
}