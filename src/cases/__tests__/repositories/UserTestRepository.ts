import User from "../../../entities/User";
import { UserRepositoryInterface, UserFilter, UserSavingData } from "../../User";
import getDb from "./database";

const db = getDb();

export class UserTestRepository implements UserRepositoryInterface {
    database: User[];
    constructor() {
        this.database = db.users;
    }
    async get(filter: UserFilter) {
        const filtered = await this.filter(filter);
        return filtered[0];
    }
    async filter(filter: UserFilter) {
        const { pagination, search, ...params } = filter;
        // @ts-ignore
        const fields: [keyof typeof params, any][] = Object.entries(params);
        if (!fields.length) return this.database;
        return this.database.filter(item => (
            !!fields.filter(([key, value]) => item[key] === value).length
        ));
    }
    async update(id: number, data: UserFilter) {
        let updated = 0;
        this.database = this.database.map(item => {
            if (id === item.id) {
                item.update(data);
                updated++;
            }
            return item;
        });
        return updated;
    }

    async all() {
        return this.database;
    }

    async save(data: UserSavingData) {
        const user = new User({
            ...data,
            id: this.database.length,
        });
        this.database.push(user);
        return user;
    }
}