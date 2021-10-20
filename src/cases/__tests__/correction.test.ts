import faker from "faker";
import Correction, { CorrectionInterface } from "../../entities/Correction";
import CorrectionCase, { CorrectionBase, CorrectionInsertionData, CorrectionRepositoryInterface } from "../Correction";
import EssayCase, { EssayRepositoryInterface } from "../Essay";
import { UserRepositoryInterface } from "../User";
import CorrectionTestRepository from "./repositories/CorrectionTestRepository";
import getDb from "./repositories/database";

const db = getDb();

describe('#5 Correção', () => {
    const repository = new CorrectionTestRepository();
    const useCase = new CorrectionCase(repository);
    test('Criação', async done => {
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
        const [user] = db.users;
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
