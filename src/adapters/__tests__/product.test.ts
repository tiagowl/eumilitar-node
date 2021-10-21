import faker from "faker";
import { contextFactory, db } from "../../../tests/shortcuts";
import { ProductCreation } from "../../cases/Product";
import ProductController from "../controllers/Products";
import { ProductService } from "../models/Product";

const context = contextFactory();

describe('#9 Produtos', () => {
    const toRemove: number[] = [];
    afterAll(async done => {
        await ProductService(db)
            .whereIn('product_id', toRemove).del();
        done();
    }, 10000);
    beforeAll(async done => {
        const product = {
            'course_tag': 2,
            'expiration_time': faker.datatype.number(),
            'id_hotmart': faker.datatype.number(),
            'product_name': faker.name.title(),
        }
        const [id] = await ProductService(db).insert(product);
        toRemove.push(id);
        done();
    }, 10000);
    test('Criação', async done => {
        const controller = new ProductController(context);
        const created = await controller.create({
            code: faker.datatype.number(),
            course: 'esa',
            expirationTime: 30 * 24 * 60 * 60 * 1000,
            name: faker.company.companyName(),
        });
        toRemove.push(created.id);
        expect(created.id).toBeDefined();
        done();
    }, 10000);
    test('Listagem', async done => {
        const controller = new ProductController(context);
        const products = await controller.list();
        expect(products).toBeInstanceOf(Array);
        products.forEach(product => {
            expect(product).toBeDefined();
        });
        expect(products.length).toBeGreaterThan(0);
        done();
    }, 10000);
    test('Atualização', async done => {
        const controller = new ProductController(context);
        const [product] = await controller.list();
        const data: ProductCreation = {
            code: faker.datatype.number(),
            course: 'esa',
            expirationTime: 30 * 24 * 60 * 60 * 1000,
            name: faker.company.companyName(),
        };
        const updated = await controller.fullUpdate(product.id, data);
        expect(updated.id).toBe(product.id);
        (Object.entries(data) as [keyof typeof updated, any][]).forEach(([key, value]) => {
            expect(updated[key]).toBe(value);
        });
        done();
    }, 10000);
});