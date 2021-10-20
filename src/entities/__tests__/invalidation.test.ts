import EssayInvalidation from "../EssayInvalidation";

test('Entidade do cancelamento', () => {
    const invalidation = new EssayInvalidation({
        id: 0,
        reason: 'other',
        invalidationDate: new Date(),
        corrector: 5,
        essay: 3,
    });
    expect(invalidation.id).toBe(0);
});