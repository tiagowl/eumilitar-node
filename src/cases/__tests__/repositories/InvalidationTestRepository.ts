import EssayInvalidation from "../../../entities/EssayInvalidation";
import { EssayRepositoryInterface, EssayInvalidationData } from "../../Essay";
import { EssayInvalidationRepositoryInterface } from "../../EssayInvalidation";
import getDb from "./database";
import { EssayTestRepository } from "./EssayTestRepository";

const db = getDb();

export class EssayInvalidationTestRepository implements EssayInvalidationRepositoryInterface {
    private database: EssayInvalidation[];
    public essays: EssayRepositoryInterface;

    constructor() {
        this.database = db.essayInvalidations;
        this.essays = new EssayTestRepository();
    }

    public async create(data: EssayInvalidationData) {
        const invalidation = new EssayInvalidation({
            ...data,
            id: this.database.length,
            invalidationDate: new Date(),
        });
        this.database.push(invalidation);
        return invalidation;
    }

    public async get(essayId: number) {
        const invalidation = this.database.find(({ id }) => id === essayId);
        if (!invalidation) throw new Error('Não encontrado');
        return invalidation;
    }
}
