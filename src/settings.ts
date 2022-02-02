import path from 'path';
import { config } from 'dotenv';
import { transports, format } from 'winston';
import { Settings } from './drivers/interfaces';
import fs from 'fs';

config({ path: path.resolve(__dirname, "..", ".env") });

const errorFormat = format.combine(
    format.printf(error => `[${new Date().toISOString()}]: ${JSON.stringify(error)};`),
);

const {
    DATABASE_URL,
    DB_HOST,
    DB_USER,
    DB_PASS,
    DB_NAME,
    PORT = 22000,
    HOST = '0.0.0.0',
    CORS = '',
    KEYS,
    SMTP_HOST = '',
    SMTP_PORT,
    SMTP_SECURE,
    MAILJET_API_KEY = '',
    MAILJET_API_SECRET = '',
    EMAIL_SENDER = '',
    NAME_SENDER = '',
    PASSWORD_RECOVERY_URL = '',
    EXPIRATION_TIME = 4,
    SUPPORT_MAIL = '',
    ADMIN_MAIL = '',
    BUCKET_NAME = '',
    S3_DESTINATION = '',
    STORAGE_PERMISSION = "authenticated-read",
    STORAGE_TYPE = 'local',
    MAX_SIZE_UPLOAD = 10,
    AWS_ACCESS_KEY_ID = '',
    AWS_SECRET_ACCESS_KEY = '',
    HOTTOK = '',
    HOTMART_TOKEN = '',
    HOTMART_ID = '',
    HOTMART_SECRET = '',
    HOTMART_ENV = 'sandbox',
    NODE_ENV = 'default',
    SMS_KEY = '',
    SMS_SENDER_ID = '',
} = process.env;

const settings = Object.freeze<Settings>({
    database: {
        client: 'mysql',
        connection: DATABASE_URL || {
            host: DB_HOST,
            user: DB_USER,
            password: DB_PASS,
            database: DB_NAME
        },
        pool: { min: 0, max: 5 },
        acquireConnectionTimeout: 10000
    },
    server: {
        port: Number(PORT),
        host: HOST,
    },
    helmet: {},
    logging: {
        format: 'common', options: NODE_ENV === 'test' ? {
            stream: fs.createWriteStream(path.resolve(__dirname, '..', 'logs', NODE_ENV, 'access.log'))
        } : {},
    },
    cors: {
        origin: CORS,
    },
    session: {
        keys: KEYS?.split(' ') || new Array(2).fill(5).map(() => Math.random().toString(32).substr(2))
    },
    smtp: {
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: SMTP_SECURE === 'true',
        auth: {
            key: MAILJET_API_KEY,
            secret: MAILJET_API_SECRET,
        },
    },
    messageConfig: {
        sender: {
            email: EMAIL_SENDER,
            name: NAME_SENDER,
        },
        url: PASSWORD_RECOVERY_URL,
        expirationTime: Number(EXPIRATION_TIME),
        supportMail: SUPPORT_MAIL,
        adminMail: ADMIN_MAIL,
    },
    storage: {
        bucket: BUCKET_NAME,
        destination: S3_DESTINATION,
        permission: STORAGE_PERMISSION,
        allowedMimes: [
            "application/pdf",
            "image/png",
            "image/jpeg",
            "image/gif",
        ],
        type: (STORAGE_TYPE as 's3' | 'local'),
        maxSize: Number(MAX_SIZE_UPLOAD) * 1024 * 1024,
        credentials: {
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_SECRET_ACCESS_KEY,
        },
        local: {
            destination: path.resolve(__dirname, "..", "tmp", "uploads")
        }
    },
    hotmart: {
        hottok: HOTTOK,
        token: HOTMART_TOKEN,
        id: HOTMART_ID,
        secret: HOTMART_SECRET,
        env: (HOTMART_ENV) as 'sandbox' | 'developers',
    },
    logger: {
        transports: NODE_ENV === 'test' ? [
            new transports.File({
                filename: 'error.log',
                level: 'error',
                format: errorFormat,
                dirname: path.resolve(__dirname, '..', 'logs', NODE_ENV)
            }),
            new transports.File({
                filename: 'info.log',
                level: 'info',
                format: errorFormat,
                dirname: path.resolve(__dirname, '..', 'logs', NODE_ENV)
            }),
        ] : [
            new transports.File({
                filename: 'error.log',
                level: 'error',
                format: errorFormat,
                dirname: path.resolve(__dirname, '..', '..', 'logs', NODE_ENV)
            }),
            new transports.File({
                filename: 'info.log',
                level: 'info',
                format: errorFormat,
                dirname: path.resolve(__dirname, '..', '..', 'logs', NODE_ENV)
            }),
            new transports.File({
                filename: 'warning.log',
                level: 'warn',
                format: errorFormat,
                dirname: path.resolve(__dirname, '..', '..', 'logs', NODE_ENV)
            }),
            new transports.Console({ level: 'error', format: errorFormat }),
            new transports.Console({
                level: 'info',
                format: format.combine(
                    format.colorize({ colors: { info: 'green' } }),
                    format.timestamp(),
                    format.printf(({ message }) => typeof message === 'string' ? message : JSON.stringify(message)),
                ),
            }),
            new transports.Console({
                level: 'warn',
                format: format.combine(
                    format.colorize({ colors: { info: 'yellow' } }),
                    format.timestamp(),
                    format.printf(({ message }) => typeof message === 'string' ? message : JSON.stringify(message)),
                ),
            }),
        ],
    },
    httpClient: {},
    sms: {
        authKey: SMS_KEY,
        senderID: SMS_SENDER_ID,
    },
    singleEssayExpiration: 48,
});

export default settings;