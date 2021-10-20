import faker from "faker";
import Recovery from "../Recovery";

test('Recuperação de senha', () => {
    expect(() => {
        new Recovery({
            id: faker.datatype.number(),
            token: faker.datatype.string(),
            expires: new Date(),
            user: faker.datatype.number(),
            selector: faker.datatype.string(),
        });
    }).not.toThrowError();
});