import faker from "faker";
import Session, { SessionInterface } from "../../../entities/Session";
import { SessionRepositoryInterface, SessionInsertionInterface } from "../../Session";
import { UserRepositoryInterface } from "../../User";
import getDb from "./database";
import { UserTestRepository } from "./UserTestRepository";


const db = getDb()

export class SessionTestRepository implements SessionRepositoryInterface {
    public readonly users: UserRepositoryInterface;
    private database: Session[] = new Array(5).fill(0).map((_, id) => new Session({
        id,
        token: faker.random.alphaNumeric(),
        user: id,
        loginTime: new Date(),
        agent: faker.internet.userAgent(),
    }));

    constructor() {
        this.users = new UserTestRepository();
    }

    public async filter(filter: Partial<SessionInterface>) {
        const fields = Object.entries(filter) as [keyof SessionInterface, number | Date][];
        if (!fields.length) return this.database;
        return this.database.filter(item => (
            !!fields.filter(([key, value]) => item[key] === value).length
        ));
    }

    public async create(data: SessionInsertionInterface) {
        const session = new Session({
            ...data,
            id: this.database.length,
        });
        this.database.push(session);
        return session;
    }

    public async delete(filter: Partial<SessionInterface>) {
        const toRemove = await this.filter(filter);
        this.database = this.database.filter(item => toRemove.indexOf(item) >= 0);
        return toRemove.length;
    }

    public async get(filter: Partial<SessionInterface>) {
        const fields = Object.entries(filter) as [keyof SessionInterface, number | Date][];
        return this.database.find(item => (
            !!fields.filter(([key, value]) => item[key] === value).length
        ));
    }
}