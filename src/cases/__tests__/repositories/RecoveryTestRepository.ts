import faker from "faker";
import Recovery, { RecoveryInterface } from "../../../entities/Recovery";
import { RecoveryRepositoryInterface, RecoveryInsertionInterface } from "../../Recovery";
import { UserRepositoryInterface } from "../../User";
import getDb from "./database";
import { UserTestRepository } from "./UserTestRepository";


const db = getDb();

export class RecoveryTestRespository implements RecoveryRepositoryInterface {
    public readonly users: UserRepositoryInterface;
    private database: Recovery[] = new Array(10).fill(0).map((_, id) => new Recovery({
        id,
        expires: new Date(Date.now() + 60 * 60 * 1000),
        selector: faker.datatype.string(),
        token: faker.datatype.string(),
        user: id,
    }));

    constructor() {
        this.users = new UserTestRepository();
    }

    public async filter(filter: Partial<RecoveryInterface>) {
        const fields = Object.entries(filter) as [keyof RecoveryInterface, number | Date][];
        if (!fields.length) return this.database;
        return this.database.filter(item => (
            !!fields.filter(([key, value]) => item[key] === value).length
        ));
    }

    public async create(data: RecoveryInsertionInterface) {
        const recovery = new Recovery({
            ...data,
            id: this.database.length,
        });
        this.database.push(recovery);
        return recovery;
    }

    public async get(filter: Partial<RecoveryInterface>) {
        const fields = Object.entries(filter) as [keyof RecoveryInterface, number | Date][];
        return this.database.find(item => (
            !!fields.filter(([key, value]) => item[key] === value).length
        ));
    }

    public async delete(filter: Partial<RecoveryInterface>) {
        const toRemove = await this.filter(filter);
        this.database = this.database.filter(item => toRemove.indexOf(item) >= 0);
        return toRemove.length;
    }
}

