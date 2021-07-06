"use strict";
const { config } = require('dotenv');
const path = require('path');
config({ path: path.resolve(__dirname, ".env") });
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
