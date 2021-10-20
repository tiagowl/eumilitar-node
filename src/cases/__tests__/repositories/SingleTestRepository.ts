import { SessionInterface } from "../../../entities/Session";
import SingleEssay, { SingleEssayInterface } from "../../../entities/SingleEssay";
import { SingleEssayRepositoryInterface, SingleEssayInsertionInterface } from "../../SingleEssay";
import getDb from "./database";

const db = getDb();

export class SingleEssayTestRepository implements SingleEssayRepositoryInterface {
    public database: SingleEssay[];

    constructor() {
        this.database = db.singles;
    }

    public async create(data: SingleEssayInsertionInterface) {
        const singleEssay = new SingleEssay({
            ...data,
            id: this.database.length,
        });
        this.database.push(singleEssay);
        return singleEssay;
    }

    public async get(filter: Partial<SingleEssayInterface>) {
        const item = this.database.find((single) => {
            const keys = Object.entries(filter);
            // @ts-ignore
            return keys.reduce((state, [key, val]) => (single[key] === val) && state, true as boolean);
        });
        return item;
    }

    public async delete(filter: Partial<SingleEssayInterface>) {
        const toRemove = await this.filter(filter);
        this.database = this.database.filter(item => toRemove.indexOf(item) >= 0);
        return toRemove.length;
    }

    public async filter(filter: Partial<SessionInterface>) {
        const fields = Object.entries(filter) as [keyof SessionInterface, number | Date][];
        if (!fields.length) return this.database;
        return this.database.filter(item => (
            // @ts-ignore
            !!fields.filter(([key, value]) => item[key] === value).length
        ));
    }

    public async update(id: number, data: Partial<SingleEssayInterface>) {
        this.database = this.database.map(item => {
            if (id === item.id) {
                Object.assign(item, data);
            }
            return item;
        });
        return this.get({ id });
    }
}



