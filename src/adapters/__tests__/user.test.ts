import faker from "faker";
import { userFactory, db, saveUser, deleteUser, contextFactory } from "../../../tests/shortcuts";
import { UserUpdate } from "../../cases/User";
import UserController from "../controllers/User";
import { EssayThemeService } from "../models/EssayTheme";
import { UserService } from "../models/User";

const context = contextFactory();

describe('#7 Testes no usuário', () => {
    const user = userFactory()
    beforeAll(async (done) => {
        const service = UserService(db)
            .onConflict(['email', 'user_id'])
            .merge();
        await saveUser(user, service)
        const themeService = EssayThemeService(db);
        await themeService.delete().del()
        done();
    })
    afterAll(async (done) => {
        const service = UserService(db);
        await deleteUser(user, service)
        const themeService = EssayThemeService(db);
        await themeService.del().delete();
        done()
    })
    test('#71 Listagem', async done => {
        const controller = new UserController(context);
        const users = await controller.all({ status: 'active' });
        expect(users).toBeDefined();
        if (!(users instanceof Array)) throw new Error();
        expect(users.length).toBeGreaterThan(0);
        users.forEach(user => {
            expect(user.status).toBe('active');
            expect(user.id).toBeDefined();
        })
        done();
    });
    test('#71 Criação', async done => {
        const controller = new UserController(context);
        const user = await controller.create({
            email: faker.internet.email(),
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            password: faker.internet.password(),
            permission: 'admin',
            status: 'active',
        });
        expect(user).toBeDefined();
        expect(user.id).toBeDefined();
        done();
    });
    test('#71 Listagem', async done => {
        const controller = new UserController(context);
        const page = await controller.all({ status: 'active', pagination: { 'page': 1, pageSize: 20, ordering: 'id' } });
        expect(page).toBeDefined();
        if ((page instanceof Array)) throw new Error();
        const users = page.page;
        expect(typeof page.count).toBe('number');
        expect(typeof page.pages).toBe('number');
        expect(users.length).toBeGreaterThan(0);
        users.forEach(user => {
            expect(user.status).toBe('active');
            expect(user.id).toBeDefined();
        })
        done();
    });
    test('#72 Atualização', async done => {
        const controller = new UserController(context);
        const data: UserUpdate = {
            email: faker.internet.email(),
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            permission: 'student',
            status: 'active',
        };
        const updated = await controller.update(user.user_id, data);
        Object.entries(data).forEach(([key, val]) => {
            if (key === 'password') expect(updated[key as keyof typeof updated]).toBeUndefined();
            else expect(updated[(key as keyof typeof updated)]).toBe(val);
        });
        done();
    });
    test('#73 recuperação', async done => {
        const controller = new UserController(context);
        const recovered = await controller.get(user.user_id);
        expect(recovered).toBeDefined();
        done();
    });
});
