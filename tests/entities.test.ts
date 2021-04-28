import User from '../src/entities/User'
import bcrypt from 'bcrypt';
import { hashPasswordSync, now, userEntityFactory } from './shortcuts';

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