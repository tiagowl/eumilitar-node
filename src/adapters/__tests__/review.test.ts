import faker from "faker";
import { contextFactory } from "../../../tests/shortcuts";
import User from "../../entities/User";
import ReviewController from '../controllers/ReviewController';
import UserController from "../controllers/UserController";
import UserRepository from "../models/UserRepository";

const context = contextFactory();

describe('Teste nas avaliações', () => {
    const controller = new ReviewController(context);
    const users = new UserRepository(context);
    let student: User;
    beforeAll(async done => {
        const std = await users.get({ permission: 'student' });
        if (!std) throw new Error();
        student = std;
        done();
    })
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
    })
});