import Essay from "../Essay";

test('Entidade da redação', () => {
    const essay = new Essay({
        id: 20,
        file: '/path/to.pdf',
        student: 4,
        course: 'esa',
        theme: 5,
        lastModified: new Date(),
        status: 'pending',
        sendDate: new Date(),
    });
    expect(essay.id).toBe(20);
    expect(() => {
        // @ts-ignore
        essay.id = 5;
    }).toThrowError();
});