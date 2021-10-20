import faker from "faker";
import Subscription from "../Subscription";

test('Inscrições', () => {
    expect(() => {
        new Subscription({
            id: faker.datatype.number(),
            user: faker.datatype.number(),
            expiration: faker.date.future(),
            product: faker.datatype.number(),
            registrationDate: faker.date.past(),
            code: faker.datatype.number(),
            active: true,
            course: 'esa',
        });
    }).not.toThrowError();
});