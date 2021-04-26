const settings = Object.freeze({
    database: {
        client: 'mysql',
        connection: process.env.DATABASE_URL || {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        }
    },
    server: {
        port: Number(process.env.PORT) || 22000,
        host: process.env.HOST || '0.0.0.0'
    },
    helmet: {},
    logging: { format: 'common', options: {} },
    cors: {
        origin: process.env.CORS,
    },
    session: {
        keys: process.env.KEYS?.split(' ') || new Array(2).fill(5).map(() => Math.random().toString(32).substr(2))
    },
    smtp: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    },
    messageConfig: {
        sender: process.env.EMAIL_SENDER || "",
        url: process.env.PASSWORD_RECOVERY_URL || "",
    }
})

export default settings;