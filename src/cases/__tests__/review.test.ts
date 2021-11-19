import faker from "faker";
import Review from "../../entities/Review";
import ReviewCase, { types } from "../ReviewCase";
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
    });
    test('Score', async done => {
        const score = await useCase.score({});
        types.forEach(([key]) => {
            ['percentage', 'total'].forEach((item) => {
                // @ts-ignore
                expect(typeof score[key][item]).toBe('number');
                // @ts-ignore
                expect(score[key][item]).not.toBeNaN();
            })
        })
        done();
    })
})