import { createLogger } from "winston";
import connect from "./database";
import createHttpClient from "./httpClient";
import { Context, Settings } from "../interfaces";
import createTransport from "./smtp";
import createStorage from "./storage";
import createSMS from "./sms";

export default function createContext(settings: Settings): Context {
    const logger = createLogger(settings.logger);
    return Object.freeze({
        logger,
        settings,
        db: connect(settings.database),
        smtp: createTransport(settings.smtp, logger),
        storage: createStorage(settings.storage),
        http: createHttpClient(settings.httpClient, logger),
        sms: createSMS(settings, logger),
    });
}