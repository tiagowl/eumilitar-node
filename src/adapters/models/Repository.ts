import { Knex } from "knex";
import { Logger } from "winston";
import { Pagination } from "../../cases/interfaces";
import { Context } from "../interfaces";

export type FieldsMap<Model = any, Entity = any> = [[keyof Model, (val: any) => any], [keyof Entity, (val: any) => any]][];

export default class Repository<Model, Entity> {
    protected readonly fieldsMap: FieldsMap<Model, Entity>;
    protected readonly logger: Logger;
    protected readonly db: Knex;
    protected readonly context: Context;
    protected readonly service: (db: Knex) => Knex.QueryBuilder<Partial<Model>, Model[]>;

    constructor(fieldsMap: FieldsMap<Model, Entity>, context: Context, service: (db: Knex) => Knex.QueryBuilder<Partial<Model>, Model[]>) {
        const { logger, db } = context;
        this.context = context;
        this.fieldsMap = fieldsMap;
        this.logger = logger;
        this.db = db;
        this.service = service;
    }

    get query(): Knex.QueryBuilder<Partial<Model>, Model[]> {
        try {
            return this.service(this.db);
        } catch (error: any) {
            this.logger.error(error);
            throw { message: 'Erro ao conectar com o banco de dados', status: 500 };
        }
    }

    protected async processError(error: any) {
        this.logger.error(error);
        throw { message: 'Erro ao acessar banco de dados', status: 500 };
    }

    protected async authHotmart() {
        try {
            const url = 'https://api-sec-vlc.hotmart.com/security/oauth/token';
            const params = {
                grant_type: 'client_credentials',
                client_id: this.context.settings.hotmart.id,
                client_secret: this.context.settings.hotmart.secret,
            };
            const headers = {
                'Authorization': `Basic ${this.context.settings.hotmart.token}`,
                'Content-Type': 'application/json',
            };
            const response = await this.context.http({
                url,
                headers,
                params,
                method: 'POST',
                maxRedirects: 20
            });
            return response.data.access_token;
        } catch (error: any) {
            this.logger.error(error.response?.data);
            this.logger.error(error);
            throw { message: 'Erro ao consultar dados', status: 500 };
        }
    }

    protected async getDbField(field: keyof Entity): Promise<keyof Model> {
        const parsed = this.fieldsMap.find(([_, [key]]) => key === field);
        if (!parsed) throw { message: `Campo "${field}" não encontrado`, status: 400 };
        return parsed[0][0];
    }

    protected async paginate(service: Knex.QueryBuilder<Partial<Model>, Model[]>, pagination?: Pagination<Entity> | undefined) {
        if (!!pagination) {
            const { page = 1, pageSize = 10, ordering } = pagination;
            service.offset(((page - 1) * (pageSize)))
                .limit(pageSize);
            if (!!ordering) service.orderBy(await this.getDbField(ordering));
        }
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
        } catch (error: any) {
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
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: 'Erro ao processar dados', status: 500 };
        }
    }

}