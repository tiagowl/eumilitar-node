import { Filter, Operator } from "../../interfaces";
import { FakeDB } from "./database";

type Constructor<T> = new (...args: any[]) => T;

type Calculator = {
    [s in Operator]: (a: any, b: any) => boolean;
};

export const operators: Calculator = {
    '=': (a, b) => a === b,
    '<=': (a, b) => a <= b,
    '>=': (a, b) => a >= b,
    '>': (a, b) => a > b,
    '<': (a, b) => a < b,
}

export default class TestRepository<Entity, Interface>  {
    protected readonly entity: Constructor<Entity>;
    protected db: FakeDB;
    private readonly table: keyof FakeDB;
    public readonly smtp: { text: string, subject: string }[] = [];

    constructor(db: FakeDB, entity: Constructor<Entity>, table: keyof FakeDB) {
        this.db = db;
        this.entity = entity;
        this.table = table;
    }

    get database() {
        return this.db[this.table] as unknown as Interface[];
    }
    set database(value: Interface[]) {
        // @ts-ignore
        this.db[this.table] = value;
    }

    public async filter(filter: Filter<Interface>) {
        const { pagination, search, operation = [], ...params } = filter;
        const { pageSize = 10, page = 1, ordering = 'id', direction } = pagination || {};
        const fields = Object.entries(params) as [keyof Entity, number | Date][];
        const filtered = !!fields.length ? this.database.filter(item => {
            const first = !Object.entries(params)
                .find(([key, val]) => !(item[key as keyof typeof params] === (val as any)));
            const second = !operation.find((filtering) => {
                if (filtering instanceof Array) {
                    const [key, operator, value] = filtering;
                    return !operators[operator](item[key], value)
                }
                return !!Object.entries(filtering)
                    // @ts-ignore
                    .find(([field, value]) => !(item[field] === value));
            })
            return first && second;
        })
            // @ts-ignore
            .sort((a, b) => direction === 'asc' ? a[ordering] as any - (b[ordering] as any) : b[ordering] as any - (a[ordering] as any))
            .slice((page - 1) * pageSize, ((page - 1) * pageSize) + pageSize,) : this.database;
        return filtered.map(data => new this.entity(data)) as Entity[];
    }

    public async create(data: Partial<Interface>) {
        const recovery = {
            ...data,
            id: this.database.length,
        } as unknown as Interface;
        this.database.push(recovery);
        return new this.entity(recovery);
    }

    public async get(filter: Partial<Entity>) {
        const fields = Object.entries(filter) as [keyof Entity, number | Date][];
        const data = this.database.find(item => (
            // @ts-ignore
            fields.reduce((state, [key, val]) => (item[key] === val && state), true as boolean)
        ));
        if (!data) return;
        return new this.entity(data);
    }

    public async delete(filter: Partial<Interface>) {
        const initial = this.database.length;
        const fields = Object.entries(filter) as [keyof Entity, number | Date][];
        this.database = !!fields.length ? this.database.filter(item => (
            // @ts-ignore
            fields.reduce((state, [key, val]) => (item[key] !== val && state), true as boolean)
        )) : this.database;
        return initial - this.database.length;
    }

    public async update(id: number, data: Partial<Interface>) {
        let value: Interface;
        this.database = this.database.map((item) => {
            // @ts-ignore
            if (item.id === id) {
                value = Object.assign(item, data);
            }
            return item;
        });
        // @ts-ignore
        return new this.entity(value);
    }

    public async count(filter: Partial<Interface>) {
        const data = await this.filter(filter);
        return data.length;
    }

    public async exists(filter: Filter<Interface>) {
        const exists = await this.filter(filter);
        return !!exists.length;
    }

    public async notifyAdmin(message: { text: string, subject: string }) {
        this.smtp.push(message);
    }
}