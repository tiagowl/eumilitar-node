import { Knex } from "knex";
import { Logger } from "winston";
import { Filter, Paginated, Pagination } from "../../cases/interfaces";
import { Context } from "../interfaces";

export type FieldsMap<Model, Interface> = [[keyof Model, (val: any) => any], [keyof Interface, (val: any) => any]][];

export type Constructor<T> = new (...args: any[]) => T;

export const prsr = {
    nb: (val: any) => !!val ? Number(val) : val,
    dt: (val: any) => !!val ? new Date(val) : val,
    st: (val: any) => !!val ? String(val) : val,
};

export default class Repository<Model, Interface, Entity> {
    protected readonly fieldsMap: FieldsMap<Model, Interface>;
    protected readonly logger: Logger;
    protected readonly db: Knex;
    protected readonly context: Context;
    protected readonly service: (db: Knex) => Knex.QueryBuilder<Partial<Model>, Model[]>;
    protected readonly entity: Constructor<Entity>;

    constructor(fieldsMap: FieldsMap<Model, Interface>, context: Context, service: (db: Knex) => Knex.QueryBuilder<Partial<Model>, Model[]>, entity: Constructor<Entity>) {
        const { logger, db } = context;
        this.context = context;
        this.fieldsMap = fieldsMap;
        this.logger = logger;
        this.db = db;
        this.service = service;
        this.entity = entity;
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

    protected async getDbField(field: keyof Interface): Promise<keyof Model> {
        const parsed = this.fieldsMap.find(([_, [key]]) => key === field);
        if (!parsed) throw { message: `Campo "${field}" não encontrado`, status: 400 };
        return parsed[0][0];
    }

    protected async paginate(service: Knex.QueryBuilder<Partial<Model>, Model[]>, pagination?: Pagination<Interface> | undefined) {
        if (!!pagination) {
            const { page = 1, pageSize = 10, ordering } = pagination;
            service.offset(((page - 1) * (pageSize)))
                .limit(pageSize);
            if (!!ordering) service.orderBy(await this.getDbField(ordering));
        }
    }

    public async toDb(filter: Partial<Interface>): Promise<Partial<Model>> {
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

    public async toEntity(user: Model): Promise<Interface> {
        try {
            const fields: [keyof Model, any][] = Object.entries(user) as [keyof Model, any][];
            return fields.reduce((previous, field) => {
                const [_db, entity] = this.fieldsMap.find(([db]) => db[0] === field[0]) || [];
                if (entity) {
                    const [name, parser] = entity;
                    previous[name] = parser(field[1]) as never;
                }
                return previous;
            }, {} as Interface);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: 'Erro ao processar dados', status: 500 };
        }
    }

    public async delete(filter: Partial<Interface>) {
        try {
            const parsed = await this.toDb(filter);
            const deleted = await this.query.where(parsed).del();
            return deleted;
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: 'Erro ao consultar token', status: 500 };
        }
    }

    public async get(filter: Partial<Interface>) {
        try {
            const parsed = await this.toDb(filter);
            const data = await this.query.where(parsed).first();
            if (!data) return;
            const toEntity = await this.toEntity(data);
            return new this.entity(toEntity);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: 'Erro ao consultar token no banco de dados', status: 500 };
        }
    }

    public async update(id: number, data: Partial<Interface>) {
        try {
            const parsedData = await this.toDb(data);
            const selector = await this.getDbField('id' as keyof Interface);
            const updated = await this.query.where(selector as string, id).update(parsedData as any)
                .catch(error => {
                    this.logger.error(error);
                    throw { message: 'Erro ao gravar no banco de dados', status: 500 };
                });
            if (updated === 0) throw { message: 'Nenhum usuário atualizado', status: 500 };
            if (updated > 1) throw { message: 'Mais de um registro afetado', status: 500 };
            const recovered = await this.get({ id } as unknown as Partial<Interface>);
            if (!recovered) throw new Error('Erro ao salvar no banco de dados');
            return recovered;
        } catch (error: any) {
            this.logger.error(error);
            throw { message: 'Falha ao gravar no banco de dados', status: 500 };
        }
    }

    public async create(data: Partial<Interface>) {
        try {
            const parsed = await this.toDb(data);
            const [id] = await this.query.insert(parsed as any);
            const recovered = await this.query.where('id', id).first();
            if (!recovered) throw new Error('Erro ao salvar no banco de dados');
            const recoveredParsed = await this.toEntity(recovered);
            return new this.entity(recoveredParsed);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: 'Erro ao salvar no banco de dados', status: 500 };
        }
    }

    public async filter(filter: Filter<Interface>): Promise<Paginated<Entity> | Entity[]> {
        try {
            const parsed = await this.toDb(filter);
            const filtered = await this.query.where(parsed) as Model[];
            return Promise.all(filtered.map(async item => {
                const data = await this.toEntity(item);
                return new this.entity(data);
            }));
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: 'Erro ao constultar banco de dados', status: 500 };
        }
    }
}