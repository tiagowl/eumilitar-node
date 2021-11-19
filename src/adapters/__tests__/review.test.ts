import faker from "faker";
import { contextFactory, userFactory } from "../../../tests/shortcuts";
import { types } from "../../cases/ReviewCase";
import User from "../../entities/User";
import ReviewController from '../controllers/ReviewController';
import UserController from "../controllers/UserController";
import UserRepository from "../models/UserRepository";

const context = contextFactory();

describe('Teste nas avaliações', () => {
    const controller = new ReviewController(context);
    const users = new UserRepository(context);
    let student: User;
    const base = userFactory({ permission: 6 });
    beforeAll(async done => {
        const entity = await users.toEntity(base);
        const { id, ...data } = entity.data;
        student = await users.create(data);
        done();
    }, 10000)
    test('Criação', async done => {
        const data = {
            user: student.id,
            grade: 5,
            description: faker.lorem.paragraph(2),
        };
        const created = await controller.create(data);
        expect(typeof created).toBe('object');
        expect(typeof created.id).toBe('number');
        done();
    });
    test('Gráfico', async done => {
        const chart = await controller.resultChart({});
        expect(chart).toBeInstanceOf(Array);
        chart.forEach(({ key, booster, detractor, neutral }) => {
            expect(typeof key).toBe('string');
            expect(typeof booster).toBe('number');
            expect(typeof neutral).toBe('number');
            expect(typeof detractor).toBe('number');
            expect(booster).not.toBeNaN();
            expect(neutral).not.toBeNaN();
            expect(detractor).not.toBeNaN();
        });
        expect(chart.length).toBe(12);
        done();
    })
    test('Score', async done => {
        const score = await controller.score({});
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
});