import faker from 'faker';
import knex, { Knex } from 'knex';
import bcrypt from 'bcrypt';
import settings from '../src/settings';
import { Mail, MailData } from '../src/adapters/interfaces';
import crypto from 'crypto';
import { PasswordRecoveryInsert, PasswordRecoveryService } from '../src/adapters/models/PasswordRecoveries';
import User, { UserData } from '../src/entities/User';
import createStorage from '../src/drivers/storage';
import Application from '../src/drivers/api';
import { UserModel } from '../src/adapters/models/User';
import { EssayRepository } from '../src/adapters/models/Essay';
import EssayThemeRepository, { EssayThemeService } from '../src/adapters/models/EssayTheme';
import { EssayThemeCreation } from '../src/cases/EssayThemeCase';
import { Course } from '../src/entities/EssayTheme';
import createLogger from '../src/drivers/logger';
import createTransport from '../src/drivers/smtp';
import { Context } from '../src/drivers/interfaces';

export const now = new Date();
export const logger = createLogger(settings.logger);
export const mails: MailData[] = [];

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

export const userEntityFactory = (inject?: any): User => {
    const data: UserData = {
        id: Math.round(Math.random() * 2000),
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        email: faker.internet.email(),
        status: 'active',
        creationDate: now,
        lastModified: now,
        permission: 'admin',
        password: hashPassword(faker.internet.password()),
    }
    Object.assign(data, inject);
    return new User(data)
}

export const dbSetting: Knex.Config = {
    client: 'mysql',
    connection: process.env.TEST_DATABASE_URL || {
        host: process.env.TEST_DB_HOST,
        user: process.env.TEST_DB_USER,
        password: process.env.TEST_DB_PASS,
        database: process.env.TEST_DB_NAME
    },
    pool: { min: 0, max: 5 },
    acquireConnectionTimeout: 10000
}

export const driverFactory = () => {
    const driver = knex(dbSetting);
    return driver;
}

export function hashPassword(password: string) {
    const salt = bcrypt.genSaltSync(0);
    return bcrypt.hashSync(password, salt);
}

export async function saveUser(user: any, service: Knex.QueryBuilder) {
    const userDB = { ...user, passwd: await hashPassword(user.passwd) };
    return await service.insert(userDB);
}

export async function deleteUser(user: any, service: Knex.QueryBuilder) {
    await service
        .where({ user_id: user.user_id })
        .del().delete();
}

export async function smtpFactory(): Promise<Mail> {
    return {
        async sendMail(mail) {
            mails.push(mail);
        }
    }
}

export async function generateConfirmationToken() {
    return crypto.randomBytes(32).toString('hex');
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

export async function appFactory(driver: Knex = driverFactory(), customSettings = settings) {
    const smtp = await smtpFactory();
    const storage = createStorage(settings.storage);
    return new Application({ smtp, driver, storage, settings: customSettings, logger })
}

export async function createEssay(context: Context, id: number) {
    const themeRepository = new EssayThemeRepository(driver, logger);
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
    const repository = new EssayRepository(context);
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

export const driver = driverFactory();
export const hottok = faker.datatype.string();

export async function contextFactory(inject = {}): Promise<Context> {
    const smtp = await smtpFactory();
    const storage = createStorage(settings.storage);
    return Object.assign({
        driver,
        smtp,
        settings: { ...settings, hotmart: { hottok } },
        logger,
        storage,
    }, inject);
}