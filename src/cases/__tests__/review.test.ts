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
        const chart = await useCase.resultChart({});
        expect(chart).toBeInstanceOf(Array);
        chart.forEach(({ key, booster, detractor, neutral }) => {
            expect(typeof key).toBe('string');
            expect(typeof booster).toBe('number');
            expect(typeof neutral).toBe('number');
            expect(typeof detractor).toBe('number');
            expect(booster).not.toBeNaN();
            expect(neutral).not.toBeNaN();
            expect(detractor).not.toBeNaN();
            const total = booster + detractor + neutral;
            expect(total === 100 || total === 0).toBeTruthy();
        });
        expect(chart.length).toBe(12);
        done();
    })
})