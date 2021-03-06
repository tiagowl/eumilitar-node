import { SessionInterface } from "../../entities/Session";
import SingleEssay, { SingleEssayInterface } from "../../entities/SingleEssay";
import SingleEssayCase, { SingleEssayInsertionInterface, SingleEssayRepositoryInterface } from "../SingleEssayCase";
import getDb from "./repositories/database";
import SingleEssayTestRepository from "./repositories/SingleTestRepository";

const db = getDb();

describe('Redação avulsa', () => {
    const repository = new SingleEssayTestRepository(db);
    const useCase = new SingleEssayCase(repository, { 'expiration': 48 * 60 * 60 * 1000 });
    test('Criação', async done => {
        const created = await useCase.create({ 'student': 1, 'theme': 1 });
        expect(created).toBeInstanceOf(SingleEssay);
        const validated = await useCase.checkToken({ token: created.token, student: 1 });
        expect(validated).toBeInstanceOf(SingleEssay);
        expect(validated).toMatchObject(created);
        done();
    });
});



