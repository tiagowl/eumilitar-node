import faker from "faker";
import SingleEssay from "../SingleEssay";

test('Redação avulsa', () => {
    expect(() => {
        new SingleEssay({
            id: faker.datatype.number(),
            token: faker.datatype.string(),
            sentDate: new Date(),
            registrationDate: new Date(),
            expiration: new Date(),
            student: faker.datatype.number(),
            theme: faker.datatype.number(),
        });
    }).not.toThrowError();
});