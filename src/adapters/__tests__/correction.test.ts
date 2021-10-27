import faker from "faker";
import { userFactory, db, saveUser, deleteUser, createEssay, contextFactory } from "../../../tests/shortcuts";
import CorrectionController from "../controllers/Correction";
import EssayController from "../controllers/Essay";
import { CorrectionService } from "../models/Correction";
import { EssayThemeService } from "../models/EssayTheme";
import { UserService } from "../models/User";

const context = contextFactory();

describe('#6 Correções', () => {
    const user = userFactory();
    const controller = new CorrectionController(context);
    const essays = new EssayController(context);
    beforeAll(async (done) => {
        const service = UserService(db)
            .onConflict('user_id').merge();
        await saveUser(user, service);
        done();
    });
    afterAll(async (done) => {
        const service = UserService(db);
        await deleteUser(user, service);
        const themeService = EssayThemeService(db);
        await themeService.delete().del();
        done();
    });
    test('Correção', async done => {
        const essay = await createEssay(context, user.user_id);
        await essays.partialUpdate(essay.id,
            { corrector: user.user_id, status: 'correcting' }
        );
        const data = {
            'essay': essay.id,
            'corrector': user.user_id,
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
            'points': 9.4,
            'repeated': "Não",
            'understoodTheme': "Sim",
            'veryShortSentences': "Não",
        };
        const created = await controller.create(data);
        expect(created.essay).toBe(essay.id);
        (Object.entries(data) as [keyof typeof data, any][])
            .forEach(([key, value]) => {
                if (key === 'corrector') return;
                expect(created[key]).toBeDefined();
                expect(created[key]).toBe(value);
            });
        done();
    });
    test('Recuperar correção', async (done) => {
        const essay = await createEssay(context, user.user_id);
        await essays.partialUpdate(essay.id,
            { corrector: user.user_id, status: 'correcting' }
        );
        const pre = {
            'essay': essay.id,
            'corrector': user.user_id,
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
            'points': 9.4,
            'repeated': "Não",
            'understoodTheme': "Sim",
            'veryShortSentences': "Não",
        };
        await controller.create(pre);
        const data = await controller.get({ essay: essay.id });
        expect(data).toBeDefined();
        expect(data.essay).toBe(essay.id);
        (Object.entries(pre) as [keyof typeof pre, any][])
            .forEach(([key, value]) => {
                if (key === 'corrector') return;
                expect(data[key]).toBeDefined();
                expect(data[key]).toBe(value);
            });
        done();
    });
    test('Atualização', async done => {
        const correction = await CorrectionService(db).first();
        if (!correction) throw new Error();
        const updatingData = {
            'comment': faker.lorem.lines(5),
            'conclusion': "Sim",
            'erased': "Não",
            'followedGenre': "Sim",
            'obeyedMargins': "Sim",
            'organized': "Sim",
            'orthography': "Sim",
            'points': 9.4,
            'repeated': "Não",
            'understoodTheme': "Sim",
            'veryShortSentences': "Não",
        };
        const updated = await controller.update(correction.essay_id, user.user_id, updatingData);
        expect(correction.grading_id).toBe(updated.id);
        expect(updated.accentuation).toBe('Sim');
        expect(updatingData.comment).toBe(updated.comment);
        done();
    });
});

