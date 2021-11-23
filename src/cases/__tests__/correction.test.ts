import faker from "faker";
import Correction, { CorrectionInterface } from "../../entities/Correction";
import User from "../../entities/User";
import CorrectionCase, { CorrectionBase, CorrectionInsertionData, CorrectionRepositoryInterface } from "../CorrectionCase";
import EssayCase, { EssayRepositoryInterface } from "../EssayCase";
import { UserRepositoryInterface } from "../UserCase";
import CorrectionTestRepository from "./repositories/CorrectionTestRepository";
import getDb from "./repositories/database";

const db = getDb();

describe('#5 Correção', () => {
    const repository = new CorrectionTestRepository(db);
    const useCase = new CorrectionCase(repository);
    test('Criação', async done => {
        const essays = new EssayCase(repository.essays);
        const essay = await essays.partialUpdate(1, { corrector: 0, status: 'correcting' });
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
        const retrieved = await useCase.get({ essay: correction.essay });
        expect(correction).toMatchObject(correction);
        expect(retrieved).toBeInstanceOf(Correction);
        done();
    });
    test('Atualização', async done => {
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
    test('Compra de mais correções', async done => {
        const [user] = db.users;
        await useCase.buyMore(new User(user));
        expect(typeof repository.smtp[0]?.text).toBe('string');
        done();
    });
});
