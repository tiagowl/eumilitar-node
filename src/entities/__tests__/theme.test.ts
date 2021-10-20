import EssayTheme from "../EssayTheme";

test('Testes na entidade EssayTheme', () => {
    const now = new Date();
    const theme = new EssayTheme({
        id: 1,
        title: 'Tema da redação',
        helpText: 'Texto de ajuda',
        file: '/var/lib/app/data/file.pdf',
        startDate: now,
        endDate: now,
        lastModified: now,
        courses: new Set(['esa']),
        deactivated: false,
    });
    expect(theme.id).toBe(1);
    expect(theme.title).toBe('Tema da redação');
    expect(theme.helpText).toEqual('Texto de ajuda');
    expect(theme.file).toEqual('/var/lib/app/data/file.pdf');
    theme.update({
        title: 'Novo título'
    });
    expect(theme.title).toEqual('Novo título');
    expect(theme.lastModified).not.toEqual(now);
});