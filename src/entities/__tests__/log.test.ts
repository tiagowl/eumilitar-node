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
            details: faker.lorem.lines(4),
            error: faker.lorem.lines(1),
        });
    }).not.toThrowError();
});