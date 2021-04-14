const settings = Object.freeze({
    database: {
        client: 'mysql',
        connection: {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        }
    },
    server: {
        port: Number(process.env.PORT) || 22000,
        host: process.env.HOST || '0.0.0.0'
    }
})

export default settings;