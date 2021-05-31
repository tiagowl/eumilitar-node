import bcrypt from 'bcrypt';
import { hashPassword, now, userEntityFactory } from './shortcuts';
import EssayTheme from '../src/entities/EssayTheme';
import Essay from '../src/entities/Essay';
import EssayInvalidation from '../src/entities/EssayInvalidation';

test('Testes na entidade User', async (done) => {
    const password = 'l23jlk234';
    const user = await userEntityFactory({ password: await hashPassword(password) });
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
    done();
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
        deactivated: false,
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
    })
    expect(essay.id).toBe(20);
    expect(() => {
        // @ts-ignore
        essay.id = 5
    }).toThrowError()
})

test('Entidade do cancelamento', () => {
    const invalidation = new EssayInvalidation({
        id: 0,
        reason: 'other',
        invalidationDate: new Date(),
        corrector: 5,
        essay: 3,
    });
    expect(invalidation.id).toBe(0);
})