import faker from 'faker';
import knex, { Knex } from 'knex';
import bcrypt from 'bcrypt';
import settings from '../src/settings';

export const userFactory = () => ({
    email: faker.internet.email(),
    passwd: faker.internet.password(),
    first_name: faker.name.firstName(),
    last_name: faker.name.lastName(),
    status: 1,
    permission: 1,
    date_created: new Date(),
    date_modified: new Date()
})


export const dbSetting: Knex.Config = {
    client: 'sqlite3',
    connection: {
        filename: ':memory:'
    },
    useNullAsDefault: true,
    pool: {
        min: 1,
        max: 10,
        idleTimeoutMillis: 360000 * 1000,
    }
}

export const driverFactory = () => {
    const driver = knex(dbSetting);
    driver.migrate.latest();
    return driver;
}

export async function hashPassword(password: string) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

export async function saveUser(user: any, service: Knex.QueryBuilder) {
    const userDB = { ...user, passwd: await hashPassword(user.passwd) }
    return service.insert(userDB)
}

export async function deleteUser(user: any, service: Knex.QueryBuilder) {
    service
        .where('email', user.email)
        .del().delete()
}