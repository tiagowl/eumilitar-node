import faker from "faker";
import Product from "../Product";

test('Produtos', () => {
    expect(() => {
        return new Product({
            id: faker.datatype.number(),
            code: faker.datatype.number(),
            name: faker.lorem.sentence(),
            course: 'esa',
            expirationTime: 444
        });
    }).not.toThrowError();
});


