import path from 'path';
import { config } from 'dotenv';
import { transports, format } from 'winston';
import { Settings } from './drivers/interfaces';

config({ path: path.resolve(__dirname, "..", ".env") });

const errorFormat = format.combine(
    format.printf(error => `[${new Date()}]: ${JSON.stringify(error)};`),
);

const settings = Object.freeze<Settings>({
    database: {
        client: 'mysql',
        connection: process.env.DATABASE_URL || {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        },
        pool: { min: 0, max: 5 },
        acquireConnectionTimeout: 10000
    },
    server: {
        port: Number(process.env.PORT) || 22000,
        host: process.env.HOST || '0.0.0.0'
    },
    helmet: {},
    logging: { format: 'common', options: {} },
    cors: {
        origin: process.env.CORS || '',
    },
    session: {
        keys: process.env.KEYS?.split(' ') || new Array(2).fill(5).map(() => Math.random().toString(32).substr(2))
    },
    smtp: {
        host: process.env.SMTP_HOST || '',
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            key: process.env.MAILJET_API_KEY || '',
            secret: process.env.MAILJET_API_SECRET || '',
        },
    },
    messageConfig: {
        sender: {
            email: process.env.EMAIL_SENDER || "",
            name: process.env.NAME_SENDER || "",
        },
        url: process.env.PASSWORD_RECOVERY_URL || "",
        expirationTime: Number(process.env.EXPIRATION_TIME || 4),
        adminMail: process.env.ADMIN_MAIL || '',
    },
    storage: {
        bucket: process.env.BUCKET_NAME || '',
        destination: process.env.S3_DESTINATION || '',
        permission: process.env.STORAGE_PERMISSION || "authenticated-read",
        allowedMimes: [
            "application/pdf",
            "image/png",
            "image/jpeg",
            "image/gif",
        ],
        type: (process.env.STORAGE_TYPE as 's3' | 'local') || 'local',
        maxSize: Number(process.env.MAX_SIZE_UPLOAD || 10) * 1024 * 1024,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        },
        local: {
            destination: path.resolve(__dirname, "..", "tmp", "uploads")
        }
    },
    hotmart: {
        hottok: process.env.HOTTOK || '',
        token: process.env.HOTMART_TOKEN || '',
        id: process.env.HOTMART_ID || '',
        secret: process.env.HOTMART_SECRET || '',
        env: (process.env.HOTMART_ENV || 'sandbox') as 'sandbox' | 'developers',
    },
    logger: {
        transports: [
            new transports.File({
                filename: 'error.log',
                level: 'error',
                format: errorFormat,
                dirname: path.resolve(__dirname, '..', '..', 'logs', process.env.NODE_ENV || 'default')
            }),
            new transports.File({
                filename: 'info.log',
                level: 'info',
                format: errorFormat,
                dirname: path.resolve(__dirname, '..', '..', 'logs', process.env.NODE_ENV || 'default')
            }),
            new transports.Console({ level: 'error', format: errorFormat }),
            new transports.Console({
                level: 'info',
                format: format.combine(
                    format.colorize({ colors: { info: 'green' } }),
                    format.timestamp(),
                    format.printf(({ message }) => message),
                ),
            }),
        ],
    },
    httpClient: {}
});

export default settings;