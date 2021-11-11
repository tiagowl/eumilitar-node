import faker from "faker";
import Essay, { EssayInterface } from "../../entities/Essay";
import EssayCase, { EssayChartFilter, EssayCreationData, EssayInsertionData, EssayPagination, EssayRepositoryInterface } from "../EssayCase";
import EssayInvalidationCase from "../EssayInvalidationCase";
import getDb from "./repositories/database";
import EssayTestRepository from "./repositories/EssayTestRepository";
import EssayInvalidationTestRepository from "./repositories/InvalidationTestRepository";
import SingleEssayTestRepository from "./repositories/SingleTestRepository";

const db = getDb();

describe('#3 Redações', () => {
    const repository = new EssayTestRepository(db);
    const useCase = new EssayCase(repository);
    const singles = new SingleEssayTestRepository(db);
    const invalidations = new EssayInvalidationTestRepository(db);
    const invalidationCase = new EssayInvalidationCase(invalidations);
    test('Criação', async done => {
        const data: EssayCreationData = {
            file: '/path/to/image.png',
            course: 'esa',
            student: 1,
        };
        const created = await useCase.create(data);
        expect(created).not.toBeUndefined();
        expect(created).not.toBeNull();
        expect(created.id).not.toBeUndefined();
        expect(created.id).not.toBeNull();
        const single = await singles.get({});
        if (!single) throw new Error();
        const dataToken: EssayCreationData = {
            file: '/path/to/image.png',
            student: single.student,
            token: single.token,
        };
        const createdWithToken = await useCase.create(dataToken);
        expect(createdWithToken).not.toBeUndefined();
        expect(createdWithToken).not.toBeNull();
        expect(typeof createdWithToken.id).toBe('number');
        done();
    });
    test('Listagem', async done => {
        const essays = await useCase.myEssays(6);
        expect(essays.length).not.toBeLessThan(1);
        const essay = essays[0];
        expect(essay.id).not.toBeUndefined();
        done();
    });
    test('Listagem de todas', async done => {
        const essays = await useCase.allEssays({}) as Essay[];
        expect(essays.length).not.toBeLessThan(1);
        const essay = essays[0];
        expect(essay.id).not.toBeUndefined();
        done();
    });
    test('Recuperação de uma redação', async done => {
        const essay = await useCase.get({ id: 2 });
        expect(essay).toBeDefined();
        expect(essay?.id).toBe(2);
        done();
    });
    test('Atualização da redação', async done => {
        const updated = await useCase.partialUpdate(1, { corrector: 0 });
        const essay = await useCase.get({ id: 1 });
        expect(updated).toBeDefined();
        expect(updated.corrector).toBe(0);
        // @ts-ignore
        expect(updated).toMatchObject(essay);
        expect(updated?.id).toEqual(essay?.id);
        expect(updated?.corrector).toEqual(essay?.corrector);
        expect(updated?.status).toEqual(essay?.status);
        done();
    });
    test('Gráfico de envios', async done => {
        const chart = await useCase.sentChart({
            period: {
                start: new Date(Date.now() - 2 * 360 * 24 * 60 * 60 * 1000),
                end: new Date()
            }
        });
        expect(chart).toBeInstanceOf(Array);
        expect(chart.length).toBe(24);
        chart.forEach(item => {
            expect(item, JSON.stringify(chart)).toBeDefined();
            expect(typeof item.key).toBe('string');
            expect(typeof item.value).toBe('number');
        });
        done();
    });
    test('#35 Reenvio da redação', async done => {
        const essay = await useCase.get({ 'status': 'pending' });
        await useCase.partialUpdate(essay.id, { 'corrector': 0, 'status': 'correcting' });
        await invalidationCase.create({ reason: 'invalid', corrector: 0, 'essay': essay.id, 'comment': faker.lorem.lines(5) });
        const can = await useCase.canResend(essay.id, essay.student);
        expect(can).toBeTruthy();
        const data: EssayCreationData = {
            file: '/path/to/image.png',
            student: essay.student,
            invalidEssay: essay.id,
        };
        const created = await useCase.create(data);
        expect(created).toBeInstanceOf(Essay);
        expect(typeof created.id).toBe('number');
        done();
    });
});
