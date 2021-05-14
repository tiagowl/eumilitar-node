import faker from 'faker';
import knex, { Knex } from 'knex';
import bcrypt from 'bcrypt';
import settings from '../src/settings';
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import crypto from 'crypto';
import { PasswordRecoveryInsert, PasswordRecoveryService } from '../src/adapters/models/PasswordRecoveries';
import User, { UserData } from '../src/entities/User';
import createStorage from '../src/drivers/storage';
import Application from '../src/drivers/api';

export const now = new Date();

export const userFactory = () => ({
    email: faker.internet.email(),
    passwd: faker.internet.password(),
    first_name: faker.name.firstName(),
    last_name: faker.name.lastName(),
    status: 1,
    permission: 1,
    date_created: now,
    date_modified: now,
    user_id: faker.unique(faker.datatype.number),
})

export const userEntityFactory = async (inject?: any): Promise<User> => {
    const data: UserData = {
        id: Math.round(Math.random() * 2000),
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        email: faker.internet.email(),
        status: 'active',
        creationDate: now,
        lastModified: now,
        permission: 'admin',
        password: await hashPassword(faker.internet.password()),
    }
    Object.assign(data, inject);
    return new User(data)
}

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
    const driver = knex(settings.database);
    driver.migrate.latest();
    return driver;
}

export async function hashPassword(password: string) {
    const salt = await bcrypt.genSalt(0);
    return bcrypt.hash(password, salt);
}

export async function saveUser(user: any, service: Knex.QueryBuilder) {
    const userDB = { ...user, passwd: await hashPassword(user.passwd) }
    return service.insert(userDB)
}

export async function deleteUser(user: any, service: Knex.QueryBuilder) {
    service
        .where(user)
        .del();
}

export async function smtpFactory(): Promise<Mail> {
    return new Promise((accept, reject) => {
        nodemailer.createTestAccount((err, account) => {
            if (account) {
                const transporter = nodemailer.createTransport({
                    ...account.smtp,
                    auth: {
                        user: account.user,
                        pass: account.pass,
                    }
                })
                accept(transporter)
            } else reject(err);
        })
    })
}

export async function generateConfirmationToken() {
    return crypto.randomBytes(64).toString('base64').substring(0, 64);
}

export async function saveConfirmationToken(token: string, userId: number, driver: Knex, expiration?: Date) {
    const data: PasswordRecoveryInsert = {
        token,
        expires: expiration || new Date(Date.now() + 24 * 60 * 60 * 1000),
        selector: crypto.randomBytes(24).toString('hex').substring(0, 16),
        user_id: userId,
    }
    const service = PasswordRecoveryService(driver);
    return service.insert(data);
}

export async function appFactory() {
    const smtp = await smtpFactory();
    const driver = driverFactory();
    const storage = createStorage(settings.storage)
    return new Application({ smtp, driver, storage, settings })
}