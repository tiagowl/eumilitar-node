import { Knex } from "knex";
import { Logger } from "winston";
import { Filter, Paginated, Pagination } from "../../cases/interfaces";
import { Context } from "../interfaces";

export type FieldsMap<Model, Interface> = [[keyof Model | null, (val: any) => any], [keyof Interface | null, (val: any) => any]][];

export type Constructor<T> = new (...args: any[]) => T;

export const prsr = {
    nb: (val: any) => !!val || val === 0 ? Number(val) : val,
    dt: (val: any) => !!val || val === 0 ? new Date(val) : val,
    st: (val: any) => !!val || val === 0 || val === false ? String(val) : val,
};

export default abstract class Repository<Model, Interface, Entity> {
    #selector?: string;
    protected readonly logger: Logger;
    protected readonly db: Knex;
    protected readonly context: Context;
    protected abstract readonly entity: Constructor<Entity>;
    protected abstract readonly fieldsMap: FieldsMap<Model, Interface>;
    protected abstract readonly searchFields: (keyof Model)[];
    protected abstract readonly service: (db: Knex) => Knex.QueryBuilder<Partial<Model>, Model[]>;

    constructor(context: Context) {
        const { logger, db } = context;
        this.context = context;
        this.logger = logger;
        this.db = db;
    }

    get query(): Knex.QueryBuilder<Partial<Model>, Model[]> {
        try {
            return this.service(this.db);
        } catch (error: any) {
            this.logger.error(error);
            throw { message: 'Erro ao conectar com o banco de dados', status: 500 };
        }
    }

    protected get selector() {
        try {
            if (!this.#selector) {
                this.#selector = this.getDbFieldSync('id' as keyof Interface) as string;
            }
            return this.#selector as string;
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: 'Erro ao conectar com o banco de dados', status: 500 };
        }
    }

    protected async processError(error: any) {
        this.logger.error(error);
        return { message: 'Erro ao acessar banco de dados', status: 500 };
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
        return this.getDbFieldSync(field);
    }

    protected getDbFieldSync(field: keyof Interface): keyof Model {
        const parsed = this.fieldsMap.find(([_, [key]]) => key === field);
        const error = { message: `Campo "${field}" não encontrado`, status: 400 };
        if (!parsed) throw error;
        const dbField = parsed[0][0];
        if (!dbField) throw error;
        return dbField;
    }

    protected async paginate(service: Knex.QueryBuilder<Partial<Model>, Model[]>, pagination?: Pagination<Interface> | undefined) {
        if (!!pagination) {
            const { page = 1, pageSize = 10, ordering } = pagination;
            service.offset(((page - 1) * (pageSize)))
                .limit(pageSize);
            if (!!ordering) service.orderBy(await this.getDbField(ordering));
        }
    }

    protected async search(service: Knex.QueryBuilder<Partial<Model>, Model[]>, search?: string, fields?: string[]) {
        if (!search) return;
        const searchFields = fields || this.searchFields;
        await Promise.all(searchFields.map(async (field: string | keyof Model) => {
            service.orWhere(field as string, 'like', `%${search}%`);
        }));
        const terms = search.split(' ');
        if (terms.length > 1) {
            service.orWhere(function () {
                terms.forEach(val => {
                    this.andWhere(async function () {
                        await Promise.all(searchFields.map(async (field: string | keyof Model) => {
                            this.orWhere(field as string, 'like', `%${val}%`);
                        }));
                    });
                });
            });
        }
    }

    public async toDb(filter: Partial<Interface>): Promise<Partial<Model>> {
        try {
            const args = Object.entries(filter);
            return args.reduce((model, [entityField, value]: [string, any]) => {
                this.fieldsMap.forEach(([[fieldName, parser], [field]]) => {
                    if (field === entityField && fieldName) model[fieldName] = parser(value);
                });
                return model;
            }, {} as Partial<Model>);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: 'Erro ao processar dados', status: 500 };
        }
    }

    public async toEntity(user: Model): Promise<Entity> {
        try {
            const fields: [keyof Model, any][] = Object.entries(user) as [keyof Model, any][];
            const entity = fields.reduce((obj, [key, value]) => {
                this.fieldsMap.forEach(([db, [name, parser]]) => {
                    if (db[0] === key && name) {
                        obj[name] = parser(value) as never;
                    }
                });
                return obj;
            }, {} as Interface);
            return new this.entity(entity);
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
            return await this.toEntity(data);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: 'Erro ao consultar banco de dados', status: 500 };
        }
    }

    public async update(id: number, data: Partial<Interface>) {
        try {
            const parsedData = await this.toDb(data);
            const updated = await this.query.where(this.selector, id).update(parsedData as any)
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
            const recovered = await this.query.where(this.selector, id).first();
            if (!recovered) throw new Error('Erro ao salvar no banco de dados');
            return await this.toEntity(recovered);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: 'Erro ao salvar no banco de dados', status: 500 };
        }
    }

    public async filter(filter: Filter<Interface>): Promise<Paginated<Entity> | Entity[]> {
        try {
            const { pagination, search, ...params } = filter;
            const parsedFilter = await this.toDb(params as Partial<Interface>);
            const service = this.query;
            await this.paginate(service, pagination as Pagination<Interface>);
            await this.search(service, search);
            const filtered = await service.where(parsedFilter) as Model[];
            const users = await Promise.all(filtered.map(async (data: Model) => {
                return this.toEntity(data as Model);
            }));
            if (!pagination) return users;
            const counting = this.query;
            await this.search(counting, search);
            const { count } = await counting.where(parsedFilter).count('*', { as: 'count' }).first();
            const counted = Number(count);
            return {
                page: users,
                pages: Math.ceil(counted / (pagination.pageSize || 10)),
                count: counted
            };
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: 'Erro ao constultar banco de dados', status: 500 };
        }
    }
}