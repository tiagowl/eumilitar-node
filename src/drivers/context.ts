import { createLogger } from "winston";
import connect from "./database";
import createHttpClient from "./httpClient";
import { Settings } from "./interfaces";
import createTransport from "./smtp";
import createStorage from "./storage";

export default function createContext(settings: Settings) {
    const logger = createLogger(settings.logger);
    return {
        logger,
        settings,
        driver: connect(settings.database),
        smtp: createTransport(settings.smtp, logger),
        storage: createStorage(settings.storage),
        http: createHttpClient(settings.httpClient),
    };
}