import faker from 'faker';
import knex, { Knex } from 'knex';
import bcrypt from 'bcrypt';
import settings from '../src/settings';
import { Mail, MailData } from '../src/adapters/interfaces';
import crypto from 'crypto';
import { RecoveryService } from '../src/adapters/models/RecoveryRepository';
import User, { Permissions, UserData, UserInterface } from '../src/entities/User';
import createStorage from '../src/drivers/context/storage';
import Application from '../src/drivers/api';
import { UserModel } from '../src/adapters/models/UserRepository';
import { EssayRepository } from '../src/adapters/models/EssayRepository';
import EssayThemeRepository, { EssayThemeService } from '../src/adapters/models/EssayThemeRepository';
import { EssayThemeCreation } from '../src/cases/EssayThemeCase';
import { Course, EssayThemeInterface } from '../src/entities/EssayTheme';
import createLogger from '../src/drivers/context/logger';
import { Context } from '../src/drivers/interfaces';
import axios from 'axios';
import { EssayInterface } from '../src/entities/Essay';

export const now = new Date();
export const logger = createLogger(settings.logger);
export const mails: MailData[] = [];
export const sms: any[] = [];

const fullPermissions = Object.keys(Permissions);

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
        phone: faker.phone.phoneNumber('1122344445555'),
    }
    Object.assign(data, inject);
    if (data.permission === 1 && !('permissions' in data)) Object.assign(data, { permissions: JSON.stringify(fullPermissions) })
    return data;
}

export const userEntityFactory = (inject?: any): UserData => {
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
        phone: faker.phone.phoneNumber(),
        permissions: new Set(),
    }
    return Object.assign(data, inject);
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

export function hashPassword(password: string) {
    const salt = bcrypt.genSaltSync(0);
    return bcrypt.hashSync(password, salt);
}

export async function saveUser(user: any | any[], service: Knex.QueryBuilder) {
    const hasher = (val: any) => ({ ...val, passwd: hashPassword(val.passwd) });
    const userDB = user instanceof Array ? user.map(hasher) : hasher(user);
    return service.insert(userDB);
}

export async function deleteUser(user: any, service: Knex.QueryBuilder) {
    return service
        .where('user_id', user.user_id)
        .del();
}

export function smtpFactory(): Mail {
    return {
        async sendMail(mail) {
            mails.push(mail);
        }
    }
}

export function smsFactory() {
    return {
        async send(to: string, message: string) {
            sms.push({ to, message });
        }
    }
}

export async function generateConfirmationToken() {
    return crypto.randomBytes(32).toString('hex');
}

export async function saveConfirmationToken(token: string, userId: number, db: Knex, expiration?: Date) {
    const data = {
        token,
        expires: expiration || new Date(Date.now() + 24 * 60 * 60 * 1000),
        selector: crypto.randomBytes(24).toString('hex').substring(0, 16),
        user_id: userId,
    }
    const service = RecoveryService(db);
    return service.insert(data);
}

export function appFactory(connection?: Knex, customSettings?: any) {
    const context = contextFactory();
    return new Application({ ...context, db: connection || context.db, settings: customSettings || context.settings })
}

export async function createEssay(context: Context, student: number, inject: Partial<EssayInterface> = {}) {
    const themeRepository = new EssayThemeRepository(context);
    const themeData: EssayThemeCreation = {
        title: 'T??tulo',
        endDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 60),
        startDate: new Date(Date.now() - 160 * 24 * 60 * 60 * 60),
        helpText: faker.lorem.lines(3),
        file: '/usr/share/data/theme.pdf',
        courses: new Set(['esa', 'espcex'] as Course[]),
        deactivated: false,
    };
    const exists = await themeRepository.hasActiveTheme(themeData);
    const theme = await (exists ? themeRepository.get({ courses: themeData.courses }) : themeRepository.create(themeData));
    if (!theme) throw new Error('Falha ao recuperar tema ' + exists);
    const repository = new EssayRepository(context);
    return repository.create(Object.assign({
        file: '/usr/share/data/theme.png',
        student,
        course: [...themeData.courses][0],
        sendDate: new Date(),
        status: 'pending',
        theme: theme.id,
    }, inject));
}

export const db = knex(dbSetting);
export const hottok = faker.datatype.string();

export function contextFactory(inject = {}): Context {
    const smtp = smtpFactory();
    const storage = createStorage(settings.storage);
    return Object.assign({
        db,
        smtp,
        settings: { ...settings, hotmart: { ...settings.hotmart, hottok } },
        logger,
        storage,
        http: axios.create({}),
        sms: smsFactory(),
    }, inject);
}

export const jp = (data: any, ...args: any[]) => JSON.stringify({ ...data, ...args });