import faker from "faker";
import Review from "../Review";

test('Entidade da redação', () => {
    const review = new Review({
        id: 20,
        user: 10,
        grade: 5,
        registrationDate: new Date(),
        description: faker.lorem.paragraph(19),
    });
    expect(review.id).toBe(20);
});