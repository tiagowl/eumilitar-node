import Warning from "../Warning";
import faker from "faker";

test('Testes na entidade Warning', () => {
    const now = new Date();
    const theme = new Warning({
        id: 1,
        title: 'Tema da redação',
        message: faker.lorem.paragraph(3),
        lastModified: now,
        active: true,
    });
    expect(theme.id).toBe(1);
    expect(theme.title).toBe('Tema da redação');
    expect(theme.lastModified).toEqual(now);
});