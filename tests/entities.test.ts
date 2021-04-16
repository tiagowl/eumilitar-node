import User from '../src/entities/User'
import bcrypt from 'bcrypt';

test('Testes na entidade User', () => {
    const password = 'l23jlk234';
    const now = new Date();
    const user = new User({
        id: 5,
        firstName: 'John',
        lastName: 'Doe',
        email: 'teste@gmail.com',
        password: password,
        status: 'active',
        creationDate: now,
        lastModified: now,
        permission: 'admin',
    })
    expect(user.checkPassword(password, bcrypt.compare)).toBeTruthy()
    user.update({
        firstName: 'Denis',
        lastName: 'Antonio',
        email: 'email@gmail.com',
    })
    expect(user.firstName).toBe('Denis')
    expect(user.lastName).toBe('Antonio')
    expect(user.email).toBe('email@gmail.com')
    expect(user.lastModified).not.toBe(now)
})