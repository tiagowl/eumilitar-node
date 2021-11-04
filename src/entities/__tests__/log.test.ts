import faker from "faker";
import Log from "../Log";

test('Recuperação de senha', () => {
    expect(() => {
        return new Log({
            id: faker.datatype.number(),
            user: faker.datatype.number(),
            registrationDate: new Date(),
            userAgent: faker.internet.userAgent(),
            ip: faker.internet.ip(),
            event: 'login',
        });
    }).not.toThrowError();
});