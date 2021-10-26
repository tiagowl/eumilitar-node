import faker from "faker";
import supertest from "supertest";
import { userFactory, db, saveUser, deleteUser, appFactory, jp, contextFactory } from "../../../tests/shortcuts";
import { ProductService } from "../../adapters/models/Product";
import { UserModel, UserService } from "../../adapters/models/User";
import { authenticate } from "./tools";

describe('#7 Produtos', () => {
    const app = appFactory();
    const api = supertest(app.server);
    const user: UserModel = userFactory();
    const toDelete: number[] = []
    beforeAll(async (done) => {
        const service = UserService(db)
            .onConflict('user_id').merge();
        await saveUser(user, service);
        done()
    });
    afterAll(async (done) => {
        const service = UserService(db);
        await deleteUser(user, service);
        await ProductService(db).whereIn('product_id', toDelete).del();
        done();
    });
    test('Criação', async done => {
        const data = {
            code: faker.datatype.number(),
            course: 'esa',
            expirationTime: 30 * 24 * 60 * 60 * 1000,
            name: faker.company.companyName(),
        }
        const header = await authenticate(user, api);
        const response = await api.post('/products/')
            .set('Authorization', header)
            .send(data);
        const msg = jp(response.body);
        expect(response.status, msg).toBe(201);
        expect(response.body.id, msg).toBeDefined();
        toDelete.push(response.body.id);
        done();
    });
    test('Listagem', async done => {
        const header = await authenticate(user, api);
        const response = await api.get('/products/')
            .set('Authorization', header);
        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBeGreaterThan(0);
        done();
    });
    test('Atualização', async done => {
        const header = await authenticate(user, api);
        const [id] = toDelete;
        const data = {
            code: faker.datatype.number(),
            course: 'espcex',
            expirationTime: 8 * 24 * 60 * 60 * 1000,
            name: faker.company.companyName(),
        }
        const response = await api.put(`/products/${id}/`)
            .send(data)
            .set('Authorization', header);
        expect(response.status, jp(response.body)).toBe(200);
        expect({ ...data, id }).toMatchObject(response.body);
        done();
    });
});
