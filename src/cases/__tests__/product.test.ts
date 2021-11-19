import faker from "faker";
import Product, { ProductInterface } from "../../entities/Product";
import ProductCase, { ProductRepositoryInterface, ProductCreation } from "../ProductCase";
import getDb from "./repositories/database";
import ProductTestRepository from "./repositories/ProductTestRepository";

const db = getDb();

describe('#8 Produtos', () => {
    const repository = new ProductTestRepository(db);
    const useCase = new ProductCase(repository);
    test('Criação', async done => {
        const product = await useCase.create({
            code: faker.datatype.number(),
            course: 'esa',
            expirationTime: 30 * 24 * 60 * 60 * 1000,
            name: faker.company.companyName(),
        });
        expect(product).toBeInstanceOf(Product);
        expect(product.id).toBeDefined();
        done();
    });
    test('Listagem', async done => {
        const products = await useCase.list({ 'course': 'esa' }) as Product[];
        expect(products).toBeInstanceOf(Array);
        products.forEach(product => {
            expect(product).toBeInstanceOf(Product);
            expect(product.course).toBe('esa');
        });
        done();
    });
    test('Atualização', async done => {
        const [product] = db.products;
        expect(product).toBeDefined();
        const updated = await useCase.update(product.id, { expirationTime: 55 });
        expect(product.id).toBe(updated.id);
        expect(updated.expirationTime).toBe(55);
        done();
    });
});