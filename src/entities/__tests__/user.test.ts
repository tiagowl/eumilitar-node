import bcrypt from 'bcrypt';
import faker from 'faker';
import User, { Permissions } from '../User';

export function hashPassword(password: string) {
    const salt = bcrypt.genSaltSync(0);
    return bcrypt.hashSync(password, salt);
}
const now = new Date();

test('Testes na entidade User', async (done) => {
    const password = 'l23jlk234';
    const user = new User({
        id: Math.round(Math.random() * 2000),
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        email: faker.internet.email(),
        status: 'active',
        creationDate: now,
        lastModified: now,
        permission: 'admin',
        password: hashPassword(faker.internet.password()),
        phone: faker.phone.phoneNumber(),
        permissions: new Set([Permissions.CORRECT_ESSAYS]),
    });
    expect(user.checkPassword(password)).toBeTruthy();
    expect(user.permissions.has(Permissions.CORRECT_ESSAYS)).toBeTruthy();
    expect(user.permissions.has(Permissions.CREATE_USERS)).toBeFalsy();
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
});