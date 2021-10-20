import Correction, { CorrectionInterface } from "../../../entities/Correction";
import { CorrectionRepositoryInterface, CorrectionInsertionData, CorrectionBase } from "../../Correction";
import { EssayRepositoryInterface } from "../../Essay";
import { UserRepositoryInterface } from "../../User";
import getDb from './database';
import { EssayTestRepository } from "./EssayTestRepository";
import { UserTestRepository } from "./UserTestRepository";

const db = getDb();

export default class CorrectionTestRepository implements CorrectionRepositoryInterface {
    database: Correction[];
    users: UserRepositoryInterface;
    essays: EssayRepositoryInterface;

    constructor() {
        this.database = db.corrections;
        this.users = new UserTestRepository();
        this.essays = new EssayTestRepository();
    }

    public async create(data: CorrectionInsertionData) {
        const correction = new Correction({
            ...data,
            id: this.database.length,
        });
        this.database.push(correction);
        return correction;
    }

    public async get(filter: Partial<CorrectionInterface>) {
        return this.database.find((correction => (Object.entries(filter) as [keyof CorrectionInterface, any][])
            .reduce((valid, [key, value]) => valid && (correction[key] === value), true as boolean))
        ) as Correction;
    }

    public async update(id: number, data: Partial<CorrectionBase>) {
        let correction: Correction;
        this.database = this.database.map((item) => {
            if (item.id === id) {
                Object.assign(item, data);
                correction = item;
            }
            return item;
        });
        // @ts-ignore
        return correction;
    }
}