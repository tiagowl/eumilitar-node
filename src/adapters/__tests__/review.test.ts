import faker from "faker";
import { contextFactory, userFactory } from "../../../tests/shortcuts";
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
    })
});