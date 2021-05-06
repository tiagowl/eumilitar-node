import bcrypt from 'bcrypt';
import { hashPasswordSync, now, userEntityFactory } from './shortcuts';
import EssayTheme from '../src/entities/EssayTheme';

test('Testes na entidade User', () => {
    const password = 'l23jlk234';
    const user = userEntityFactory({ password: hashPasswordSync(password) });
    expect(user.checkPassword(password, bcrypt.compare)).toBeTruthy()
    user.update({
        firstName: 'Denis',
        lastName: 'Antonio',
        email: 'email@gmail.com',
    });
    expect(user.firstName).toBe('Denis');
    expect(user.lastName).toBe('Antonio');
    expect(user.email).toBe('email@gmail.com');
    expect(user.lastModified).not.toBe(now);
})

test('Testes na entidade EssayTheme', () => {
    const theme = new EssayTheme({
        id: 1,
        title: 'Tema da redação',
        helpText: 'Texto de ajuda',
        file: '/var/lib/app/data/file.pdf',
        startDate: now,
        endDate: now,
        lastModified: now,
        courses: new Set(['esa']),
    })
    expect(theme.id).toBe(1)
    expect(theme.title).toBe('Tema da redação')
    expect(theme.helpText).toEqual('Texto de ajuda')
    expect(theme.file).toEqual('/var/lib/app/data/file.pdf')
    theme.update({
        title: 'Novo título'
    })
    expect(theme.title).toEqual('Novo título')
    expect(theme.lastModified).not.toEqual(now)
})