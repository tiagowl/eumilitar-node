import faker from "faker";
import EssayCase, { EssayCreationData, EssayInvalidationData, EssayRepositoryInterface } from "../EssayCase";
import EssayInvalidationCase, { EssayInvalidationRepositoryInterface } from "../EssayInvalidationCase";
import getDb from "./repositories/database";
import EssayInvalidationTestRepository from "./repositories/InvalidationTestRepository";

const db = getDb();


describe('#4 Invalidação', () => {
    const repository = new EssayInvalidationTestRepository(db);
    const useCase = new EssayInvalidationCase(repository);
    const essays = new EssayCase(repository.essays);
    test('Criação', async done => {
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
        expect(invalidation?.essay).toBe(0);
        done();
    });
});
