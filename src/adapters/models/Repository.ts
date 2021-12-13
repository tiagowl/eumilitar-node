import { Knex } from "knex";
import { Logger } from "winston";
import { Filter, Paginated, Pagination } from "../../cases/interfaces";
import { Context } from "../interfaces";

export type FieldsMap<Model, Interface> = [[keyof Model | null, (val: any) => any], [keyof Interface | null, (val: any) => any]][];

export type Constructor<T> = new (...args: any[]) => T;

export const prsr = {
    number: (val: any) => !!val || val === 0 ? Number(val) : val,
    bool: (val: any) => !!val || val === 0 ? Boolean(val) : val,
    date: (val: any) => !!val || val === 0 ? new Date(val) : val,
    string: (val: any) => !!val || val === 0 || val === false ? String(val) : val,
    json: (val: any) => !!val ? typeof val === 'string' ? JSON.parse(val) : JSON.stringify(val) : val,
    set: (val: any) => !!val ? typeof val === 'string' ? new Set(JSON.parse(val)) : JSON.stringify([...val]) : val,
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

    protected getDbField = async (field: keyof Interface): Promise<keyof Model> => {
        return this.getDbFieldSync(field);
    }

    protected readonly getDbFieldSync = (field: keyof Interface): keyof Model => {
        const parsed = this.fieldsMap.find(([_, [key]]) => key === field);
        const error = { message: `Campo "${field}" não encontrado`, status: 400 };
        if (!parsed) throw error;
        const dbField = parsed[0][0];
        if (!dbField) throw error;
        return dbField;
    }

    protected async paginate(service: Knex.QueryBuilder<Partial<Model>, Model[]>, pagination?: Pagination<Interface> | undefined) {
        if (!!pagination) {
            const { page = 1, pageSize = 10, ordering, direction = 'asc' } = pagination;
            service.offset(((page - 1) * (pageSize)))
                .limit(pageSize);
            if (!!ordering) service.orderBy(await this.getDbField(ordering), direction);
        }
    }

    protected async search(service: Knex.QueryBuilder<Partial<Model>, Model[]>, search?: string, fields?: string[]) {
        if (!search) return;
        const searchFields = fields || this.searchFields;
        service.andWhere(async query => {
            await Promise.all(searchFields.map(async (field: string | keyof Model) => {
                query.orWhere(field as string, 'like', `%${search}%`);
            }));
            const terms = search.split(' ');
            if (terms.length > 1) {
                query.orWhere(function () {
                    terms.forEach(val => {
                        this.andWhere(async function () {
                            await Promise.all(searchFields.map(async (field: string | keyof Model) => {
                                this.orWhere(field as string, 'like', `%${val}%`);
                            }));
                        });
                    });
                });
            }
        });
    }

    protected async filtering(query: Knex.QueryBuilder<Partial<Model>, Model[]>, filter: Filter<Interface>) {
        const { pagination, search, operation = [], ...params } = filter;
        await this.search(query, search);
        query.andWhere((filtering) => {
            operation.forEach((field) => {
                if (field instanceof Array) {
                    const [key, operator, value] = field;
                    const model = this.toDbSync({ [key]: value } as Partial<Interface>);
                    const [[modelKey, val]] = Object.entries(model);
                    filtering.andWhere(modelKey as any, operator, val as any);
                } else {
                    const model = this.toDbSync(field);
                    filtering.orWhere(model);
                }
            });
        });
        const parsed = await this.toDb(params as Partial<Interface>);
        query.where(parsed);
    }

    public readonly toDb = async (entity: Partial<Interface>): Promise<Partial<Model>> => {
        try {
            const args = Object.entries(entity);
            return await args.reduce(async (modelPromise, [entityField, value]: [string, any]) => {
                const model = await modelPromise;
                await Promise.all(this.fieldsMap.map(async ([[fieldName, parser], [field]]) => {
                    if (field === entityField && fieldName) model[fieldName] = parser(value);
                }));
                return model;
            }, Promise.resolve({}) as Promise<Partial<Model>>);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: 'Erro ao processar dados', status: 500 };
        }
    }

    public readonly toEntity = async (model: Model): Promise<Entity> => {
        try {
            const fields: [keyof Model, any][] = Object.entries(model) as [keyof Model, any][];
            const entity = await fields.reduce(async (objPromise, [key, value]) => {
                const obj = await objPromise;
                this.fieldsMap.forEach(([[dbField], [name, parser]]) => {
                    if (dbField === key && name) {
                        obj[name] = parser(value) as never;
                    }
                });
                return obj;
            }, Promise.resolve({}) as Promise<Interface>);
            return new this.entity(entity);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: 'Erro ao processar dados', status: 500 };
        }
    }

    public readonly toDbSync = (entity: Partial<Interface>): Partial<Model> => {
        try {
            const args = Object.entries(entity);
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

    public readonly toEntitySync = (model: Model): Entity => {
        try {
            const fields: [keyof Model, any][] = Object.entries(model) as [keyof Model, any][];
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
            if (!recovered) throw new Error();
            return await this.toEntity(recovered);
        } catch (error: any) {
            this.logger.error(error);
            if (error.status) throw error;
            throw { message: 'Erro ao salvar no banco de dados', status: 500 };
        }
    }

    public async filter(filter: Filter<Interface>): Promise<Paginated<Entity> | Entity[]> {
        try {
            const { pagination } = filter;
            const service = this.query;
            await this.filtering(service, filter);
            await this.paginate(service, pagination as Pagination<Interface>);
            const filtered = await service as Model[];
            const users = await Promise.all(filtered.map(this.toEntity));
            if (!pagination) return users;
            const counted = await this.count(filter);
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

    public async exists(filter: Filter<Interface>) {
        try {
            const service = this.query;
            await this.filtering(service, filter);
            const filtered = await service.first();
            return !!filtered;
        } catch (error: any) {
            throw await this.processError(error);
        }
    }

    public async count(filter: Filter<Interface>) {
        try {
            const service = this.query;
            await this.filtering(service, filter);
            const { count } = await service.count('*', { as: 'count' }).first();
            return Number(count || 0);
        } catch (error: any) {
            throw await this.processError(error);
        }
    }

    public async notifyAdmin(message: { text: string, subject: string }) {
        try {
            const { messageConfig } = this.context.settings;
            return this.context.smtp.sendMail({
                from: messageConfig.sender,
                to: { email: messageConfig.adminMail, name: 'Admin' },
                ...message,
            });
        } catch (error: any) {
            throw await this.processError(error);
        }
    }

}