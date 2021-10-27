import faker from "faker";
import { userFactory, db, saveUser, deleteUser, createEssay, contextFactory } from "../../../tests/shortcuts";
import EssayController from "../controllers/Essay";
import EssayInvalidationController from "../controllers/EssayInvalidation";
import { EssayThemeService } from "../models/EssayTheme";
import { UserService } from "../models/User";

const context = contextFactory();

describe('#5 Invalidações', () => {
    const user = userFactory();
    const controller = new EssayInvalidationController(context);
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
    test('Invalidação da redação', async done => {
        const essay = await createEssay(context, user.user_id);
        await essays.partialUpdate(essay.id,
            { corrector: user.user_id, status: 'correcting' }
        );
        const created = await controller.create({ essay: essay.id, corrector: user.user_id, comment: faker.lorem.lines(7), reason: 'other' });
        expect(created).toBeDefined();
        expect(created.id).toBeDefined();
        expect(created.essay).toBe(essay.id);
        done();
    }, 10000);
    test('Recuperação da invalidação', async done => {
        const essay = await createEssay(context, user.user_id, { corrector: user.user_id, status: 'correcting' });
        if(!essay) throw new Error();
        const created = await controller.create({ essay: essay.id, corrector: user.user_id, comment: faker.lorem.lines(7), reason: 'other' });
        expect(created).toBeDefined();
        const invalidation = await controller.get(essay.id);
        expect(invalidation).toMatchObject(created);
        expect(invalidation).toBeDefined();
        expect(invalidation.id).toBeDefined();
        expect(invalidation.essay).toBe(essay.id);
        done();
    }, 10000);
});
