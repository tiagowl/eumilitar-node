import faker from "faker";
import { userFactory, db, saveUser, deleteUser, contextFactory, jp } from "../../../tests/shortcuts";
import User, { Permissions } from "../../entities/User";
import UserController, { UserUpdate } from "../controllers/UserController";
import { EssayThemeService } from "../models/EssayThemeRepository";
import UserRepository, { UserService } from "../models/UserRepository";

const context = contextFactory();

describe('#7 Testes no usuário', () => {
    const repository = new UserRepository(context);
    const user = userFactory();
    const student = userFactory({ permission: 6 });
    const corrector = userFactory({ permission: 5 });
    const admin = userFactory({ permission: 1 });
    let agentStudent: User;
    let agentAdmin: User;
    let agentCorrector: User;
    beforeAll(async (done) => {
        const service = UserService(db)
            .onConflict(['email', 'user_id'])
            .merge();
        await saveUser(user, service);
        const themeService = EssayThemeService(db);
        await themeService.delete().del();
        await saveUser(student, service);
        await saveUser(admin, service);
        await saveUser(corrector, service);
        agentStudent = await repository.toEntity(student);
        agentAdmin = await repository.toEntity(admin);
        agentCorrector = await repository.toEntity(corrector);
        done();
    });
    afterAll(async (done) => {
        const service = UserService(db);
        await deleteUser(user, service);
        const themeService = EssayThemeService(db);
        await themeService.del().delete();
        done();
    });
    test('#71 Listagem', async done => {
        const controller = new UserController(context);
        const users = await controller.all({ status: 'active' });
        expect(users).toBeDefined();
        if (!(users instanceof Array)) throw new Error();
        expect(users.length).toBeGreaterThan(0);
        users.forEach(item => {
            expect(item.status).toBe('active');
            expect(item.id).toBeDefined();
        });
        done();
    });
    test('#71 Criação', async done => {
        const controller = new UserController(context);
        const created = await controller.create({
            email: faker.internet.email(),
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            password: faker.internet.password(),
            permission: 'admin',
            status: 'active',
            permissions: [Permissions.CORRECT_ESSAYS],
        });
        expect(created).toBeDefined();
        expect(created.id).toBeDefined();
        done();
    });
    test('#71 Listagem', async done => {
        const controller = new UserController(context);
        const page = await controller.all({ status: 'active', pagination: { 'page': 1, pageSize: 20, ordering: 'id', direction: 'desc' } });
        expect(page).toBeDefined();
        if ((page instanceof Array)) throw new Error();
        const users = page.page;
        expect(typeof page.count).toBe('number');
        expect(typeof page.pages).toBe('number');
        expect(users.length).toBeGreaterThan(0);
        users.forEach(item => {
            expect(item.status).toBe('active');
            expect(item.id).toBeDefined();
        });
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
            permissions: [Permissions.MANAGE_PRODUCTS],
        };
        const updated = await controller.update(user.user_id, data, agentAdmin);
        Object.entries(data).forEach(([key, val]) => {
            if (key === 'password') expect(updated[key as keyof typeof updated]).toBeUndefined();
            else expect(updated[(key as keyof typeof updated)], jp(data)).toStrictEqual(val);
        });
        done();
    });
    test('#73 recuperação', async done => {
        const controller = new UserController(context);
        const recovered = await controller.get(user.user_id);
        expect(recovered).toBeDefined();
        done();
    });
    test('#74 atualizar o próprio perfil', async done => {
        const controller = new UserController(context);
        const data = {
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            phone: faker.phone.phoneNumber('(##) 9 ####-####'),
        };
        const updated = await controller.update(student.user_id, data, agentStudent);
        Object.entries(data).forEach(([key, val]) => {
            if (key === 'phone') expect(updated[key as keyof typeof updated]).toBe(data.phone.replace(/[^0-9]/gm, ''));
            else expect(updated[(key as keyof typeof updated)]).toBe(val);
        });
        done();
    })
});
