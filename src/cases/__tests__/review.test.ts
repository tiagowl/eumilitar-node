import faker from "faker";
import Review from "../../entities/Review";
import ReviewCase from "../ReviewCase";
import getDb from "./repositories/database";
import ReviewTestRepository from "./repositories/ReviewTestRepository";

const db = getDb();

describe("Testes nas avaliações", () => {
    const repository = new ReviewTestRepository(db);
    const useCase = new ReviewCase(repository);
    test('Criação', async done => {
        const created = await useCase.create({
            user: db.users[0].id,
            grade: 10,
            description: faker.lorem.paragraph(2),
        });
        expect(created).toBeInstanceOf(Review);
        done();
    });
    test('Gráfico', async done => {
        const chart = await useCase.resultChart({ type: 'booster' });
        expect(chart).toBeInstanceOf(Array);
        chart.forEach(({ key, value }) => {
            expect(typeof key).toBe('string');
            expect(typeof value).toBe('number');
            expect(value).not.toBeNaN();
        });
        expect(chart.length).toBe(12);
        done();
    })
})