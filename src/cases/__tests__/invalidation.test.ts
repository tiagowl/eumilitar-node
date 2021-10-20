import faker from "faker";
import { hashPassword, userEntityFactory } from "../../../tests/shortcuts";
import Essay from "../../entities/Essay";
import EssayInvalidation from "../../entities/EssayInvalidation";
import EssayCase, { EssayCreationData, EssayInvalidationData, EssayRepositoryInterface } from "../Essay";
import EssayInvalidationCase, { EssayInvalidationRepositoryInterface } from "../EssayInvalidation";
import User from "../../entities/User";
import getDb from "./repositories/database";
import { EssayInvalidationTestRepository } from "./repositories/InvalidationTestRepository";

const db = getDb();


describe('#4 Invalidação', () => {
    const repository = new EssayInvalidationTestRepository();
    const useCase = new EssayInvalidationCase(repository);
    test('Criação', async done => {
        const essays = new EssayCase(repository.essays);
        const selectedEssay = await essays.get({ 'status': 'pending' });
        await essays.partialUpdate(selectedEssay.id, { 'corrector': 0, 'status': 'correcting' });
        const invalidation = await useCase.create({ reason: 'invalid', corrector: 0, 'essay': selectedEssay.id, 'comment': faker.lorem.lines(5) });
        const essay = await essays.get({ id: selectedEssay.id });
        expect(invalidation).toBeDefined();
        expect(invalidation.essay).toBe(essay.id);
        done();
    });
    test('Recuperação', async done => {
        const invalidation = await useCase.get(0);
        expect(invalidation).toBeDefined();
        expect(invalidation.essay).toBe(0);
        done();
    });
});
