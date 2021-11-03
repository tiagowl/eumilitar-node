import { Filter } from "../../interfaces";
import { FakeDB } from "./database";

type Constructor<T> = new (...args: any[]) => T;

export default class TestRespository<Entity, Interface>  {
    protected readonly entity: Constructor<Entity>;
    protected db: FakeDB;
    private readonly table: keyof FakeDB;

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
        const { pagination, search, ...params } = filter;
        const { pageSize = 10, page = 1, ordering = 'id' } = pagination || {};
        const fields = Object.entries(params) as [keyof Entity, number | Date][];
        const filtered = !!fields.length ? this.database.filter(essay => Object.entries(params)
            .reduce((valid, [key, val]) => valid && (essay[key as keyof typeof params] === (val as any)), true as boolean)
        )
            // @ts-ignore
            .sort((a, b) => a[ordering] as any - (b[ordering] as any))
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

    public async exists(filter: Partial<Interface>) {
        const data = await this.filter(filter);
        return !!data.length;
    }
}