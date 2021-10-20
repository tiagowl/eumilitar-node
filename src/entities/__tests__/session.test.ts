import faker from "faker";
import Session from "../Session";

test('Sessões', () => {
    expect(() => {
        new Session({
            id: faker.datatype.number(),
            token: faker.datatype.string(),
            loginTime: new Date(),
            user: faker.datatype.number(),
            agent: faker.internet.userAgent(),
        });
    }).not.toThrowError();
});