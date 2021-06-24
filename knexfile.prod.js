"use strict";
const { config } = require('dotenv');
config();
console.log(process.env);
module.exports = {
    client: 'mysql',
    connection: process.env.DATABASE_URL || {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    },
    pool: { min: 0, max: 5 },
    acquireConnectionTimeout: 10000
};
