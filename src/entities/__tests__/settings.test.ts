import faker from "faker";
import Settings from "../Settings";

test('Recuperação de senha', () => {
    expect(() => {
        return new Settings({
            id: faker.datatype.number(),
            lastModified: new Date(),
            reviewExpiration: faker.datatype.number(),
            reviewRecuseExpiration: faker.datatype.number(),
            sellCorrections: false,
        });
    }).not.toThrowError();
});