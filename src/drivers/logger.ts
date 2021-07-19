import winston from 'winston';

export default function create(settings: winston.LoggerOptions) {
    const logger = winston.createLogger(settings);
    logger.error = error => {
        if (error instanceof Error) {
            logger.log({ level: 'error', message: `${error.stack || Object.assign({}, error)}` });
        } else {
            logger.log({ level: 'error', message: error });
        }
        return logger;
    };
    return logger;
}