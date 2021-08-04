import Application from './api';
import connect from './database';
import createTransport from './smtp';
import createStorage from './storage';
import createLogger from './logger';
import createHttpClient from './httpClient';
import { Settings } from './interfaces';

export default function createServer(settings: Settings) {
    const logger = createLogger(settings.logger);
    return new Application({
        logger,
        settings,
        driver: connect(settings.database),
        smtp: createTransport(settings.smtp, logger),
        storage: createStorage(settings.storage),
        http: createHttpClient(settings.httpClient),
    });
}