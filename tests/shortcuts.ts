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
import { UserModel } from '../src/adapters/models/User';
import EssayCase from '../src/cases/EssayCase';
import { EssayRepository } from '../src/adapters/models/Essay';
import EssayThemeRepository, { EssayThemeService } from '../src/adapters/models/EssayTheme';
import { EssayThemeCreation } from '../src/cases/EssayThemeCase';
import { Course } from '../src/entities/EssayTheme';

export const now = new Date();

export const userFactory = (inject?: Partial<UserModel>) => {
    const data = {
        email: faker.internet.email(),
        passwd: 'abda143501',
        first_name: faker.name.firstName(),
        last_name: faker.name.lastName(),
        status: 1,
        permission: 1,
        date_created: now,
        date_modified: now,
        user_id: faker.unique(faker.datatype.number),
    }
    Object.assign(data, inject);
    return data;
}

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
    ...settings.database,
    // debug: true,
}

export const driverFactory = () => {
    const driver = knex(dbSetting);
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
    await service
        .where({ user_id: user.user_id })
        .del().delete();
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

export async function appFactory(driver: Knex = driverFactory()) {
    const smtp = await smtpFactory();
    const storage = createStorage(settings.storage)
    return new Application({ smtp, driver, storage, settings })
}

export async function createEssay(driver: Knex, id: number) {
    const themeRepository = new EssayThemeRepository(driver);
    const themeData: EssayThemeCreation = {
        title: 'Título',
        endDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 60),
        startDate: new Date(Date.now() - 160 * 24 * 60 * 60 * 60),
        helpText: faker.lorem.lines(3),
        file: '/usr/share/data/theme.pdf',
        courses: new Set(['esa', 'espcex'] as Course[]),
        deactivated: false,
    }
    const exists = await themeRepository.hasActiveTheme(themeData);
    const theme = await (exists ? themeRepository.get({ courses: themeData.courses }, true) : themeRepository.create(themeData));
    const repository = new EssayRepository(driver);
    return repository.create({
        file: '/usr/share/data/theme.png',
        student: id,
        course: [...themeData.courses][1],
        sendDate: new Date(),
        status: 'pending',
        // @ts-ignore
        theme: theme?.id,
    })
}