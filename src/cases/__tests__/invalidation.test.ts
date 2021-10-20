import faker from "faker";
import { hashPassword, userEntityFactory } from "../../../tests/shortcuts";
import Essay from "../../entities/Essay";
import EssayInvalidation from "../../entities/EssayInvalidation";
import EssayCase, { EssayCreationData, EssayInvalidationData, EssayRepositoryInterface } from "../Essay";
import EssayInvalidationCase, { EssayInvalidationRepositoryInterface } from "../EssayInvalidation";
import User from "../../entities/User";
import { EssayTestRepository } from "./essay.test";
import getDb from "./database";

const db = getDb();

export class EssayInvalidationTestRepository implements EssayInvalidationRepositoryInterface {
    private database: EssayInvalidation[];
    public essays: EssayRepositoryInterface;

    constructor() {
        this.database = [...db.essayInvalidations];
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


describe('#4 Invalidação', () => {
    test('Criação', async done => {
        const repository = new EssayInvalidationTestRepository();
        const useCase = new EssayInvalidationCase(repository);
        const essays = new EssayCase(repository.essays);
        const invalidation = await useCase.create({ reason: 'invalid', corrector: 0, 'essay': 2, 'comment': faker.lorem.lines(5) });
        const essay = await essays.get({ id: 2 });
        expect(invalidation).toBeDefined();
        expect(invalidation.essay).toBe(essay.id);
        const essayRepository = new EssayTestRepository();
        return done();
        const essayCase = new EssayCase(essayRepository);
        const data: EssayCreationData = {
            file: '/path/to/image.png',
            invalidEssay: essay.id,
            student: 1,
        };
        const created = await essayCase.create(data);
        expect(created).toBeInstanceOf(Essay);
        done();
    });
    test('Recuperação', async done => {
        const repository = new EssayInvalidationTestRepository();
        const useCase = new EssayInvalidationCase(repository);
        const invalidation = await useCase.get(0);
        expect(invalidation).toBeDefined();
        expect(invalidation.essay).toBe(0);
        done();
    });
});
