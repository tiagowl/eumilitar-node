import faker from "faker";
import Correction, { CorrectionInterface } from "../../entities/Correction";
import CorrectionCase, { CorrectionBase, CorrectionInsertionData, CorrectionRepositoryInterface } from "../Correction";
import EssayCase, { EssayRepositoryInterface } from "../Essay";
import { UserRepositoryInterface } from "../User";
import getDb from "./database";
import { EssayTestRepository } from "./essay.test";
import { UserTestRepository } from "./user.test";

const db = getDb();
const userDatabase = db.users;

export class CorrectionTestRepository implements CorrectionRepositoryInterface {
    database: Correction[];
    users: UserRepositoryInterface;
    essays: EssayRepositoryInterface;

    constructor() {
        this.database = db.corrections;
        this.users = new UserTestRepository();
        this.essays = new EssayTestRepository();
    }

    public async create(data: CorrectionInsertionData) {
        const correction = new Correction({
            ...data,
            id: this.database.length,
        });
        this.database.push(correction);
        return correction;
    }

    public async get(filter: Partial<CorrectionInterface>) {
        return this.database.find((correction => (Object.entries(filter) as [keyof CorrectionInterface, any][])
            .reduce((valid, [key, value]) => valid && (correction[key] === value), true as boolean))
        ) as Correction;
    }

    public async update(id: number, data: Partial<CorrectionBase>) {
        let correction: Correction;
        this.database = this.database.map((item) => {
            if (item.id === id) {
                Object.assign(item, data);
                correction = item;
            }
            return item;
        });
        // @ts-ignore
        return correction;
    }
}



describe('#5 Correção', () => {
    test('Criação', async done => {
        const repository = new CorrectionTestRepository();
        const useCase = new CorrectionCase(repository);
        const essays = new EssayCase(repository.essays);
        const correction = await useCase.create({
            'essay': 1,
            'corrector': 0,
            'accentuation': "Sim",
            'agreement': "Sim",
            'cohesion': "Sim",
            'comment': faker.lorem.lines(5),
            'conclusion': "Sim",
            'erased': "Não",
            'followedGenre': "Sim",
            'hasMarginSpacing': "Sim",
            'isReadable': "Sim",
            'obeyedMargins': "Sim",
            'organized': "Sim",
            'orthography': "Sim",
            'points': 10,
            'repeated': "Não",
            'understoodTheme': "Sim",
            'veryShortSentences': "Não",
        });
        const essay = await essays.get({ id: 1 });
        expect(correction).toBeDefined();
        expect(correction).toBeInstanceOf(Correction);
        expect(correction.essay).toBe(essay.id);
        done();
    });
    test('Recuperação', async done => {
        const correction = new Correction({
            'id': 0,
            'essay': 1,
            'accentuation': "Sim",
            'agreement': "Sim",
            'cohesion': "Sim",
            'comment': faker.lorem.lines(5),
            'conclusion': "Sim",
            'erased': "Não",
            'followedGenre': "Sim",
            'hasMarginSpacing': "Sim",
            'isReadable': "Sim",
            'obeyedMargins': "Sim",
            'organized': "Sim",
            'orthography': "Sim",
            'points': 10,
            'repeated': "Não",
            'understoodTheme': "Sim",
            'veryShortSentences': "Não",
            'correctionDate': new Date(),
        });
        const repository = new CorrectionTestRepository();
        const useCase = new CorrectionCase(repository);
        const retrieved = await useCase.get({ essay: correction.essay });
        expect(correction).toMatchObject(correction);
        expect(retrieved).toBeInstanceOf(Correction);
        done();
    });
    test('Atualização', async done => {
        const repository = new CorrectionTestRepository();
        const useCase = new CorrectionCase(repository);
        const [user] = userDatabase;
        const updated = await useCase.update(1, user.id, {
            'accentuation': "Sim",
            'agreement': "Sim",
            'cohesion': "Sim",
            'comment': faker.lorem.lines(5),
            'conclusion': "Sim",
            'erased': "Não",
            'followedGenre': "Sim",
            'hasMarginSpacing': "Sim",
            'isReadable': "Sim",
            'obeyedMargins': "Sim",
            'organized': "Sim",
            'orthography': "Sim",
            'points': faker.datatype.number(10),
            'repeated': "Não",
            'understoodTheme': "Sim",
            'veryShortSentences': "Não",
        });
        expect(updated).toBeInstanceOf(Correction);
        done();
    });
});
