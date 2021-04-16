// Update with your config settings.

import settings from './src/settings';

module.exports = {
  development: settings.database,
  staging: settings.database,
  production: settings.database
};
