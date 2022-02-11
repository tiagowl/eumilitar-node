// Update with your config settings.

import settings from './src/settings';

module.exports = {
  development: settings.database,
  staging: settings.database,
  production: settings.database,
  test: {
    client: 'mysql',
    connection: process.env.TEST_DATABASE_URL || {
      host: process.env.TEST_DB_HOST,
      user: process.env.TEST_DB_USER,
      password: process.env.TEST_DB_PASS,
      database: process.env.TEST_DB_NAME
    },
    pool: { min: 0, max: 5 },
    acquireConnectionTimeout: 10000,
    migrations: {
      tableName: 'knex_migrations',
    }
  }
};
