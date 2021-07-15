import Application from './api';
import connect from './database';
import createTransport from './smtp';
import createStorage from './storage';
import createLogger from './logger';

export default function createServer(settings: any) {
    const driver = connect(settings.database);
    const smtp = createTransport(settings.smtp);
    const storage = createStorage(settings.storage);
    const logger = createLogger(settings.logger);
    return new Application({ driver, smtp, storage, settings, logger });
}