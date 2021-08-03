import Application from './api';
import connect from './database';
import createTransport from './smtp';
import createStorage from './storage';
import createLogger from './logger';
import createHttpClient from './httpClient';
import { Settings } from './interfaces';

export default function createServer(settings: Settings) {
    return new Application({
        settings,
        driver: connect(settings.database),
        smtp: createTransport(settings.smtp),
        storage: createStorage(settings.storage),
        logger: createLogger(settings.logger),
        http: createHttpClient(settings.httpClient),
    });
}