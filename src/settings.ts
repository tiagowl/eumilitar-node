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
    authCookie: 'token',
    helmet: {
    },
    logging: { format: 'common', options: {} },
    cors: {
        origin: process.env.CORS,
    }
})

export default settings;