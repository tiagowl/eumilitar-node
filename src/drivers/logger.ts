import winston from 'winston';

export default function create(settings: winston.LoggerOptions) {
    const logger = winston.createLogger(settings);
    logger.error = (error: any) => {
        if (error instanceof Error) {
            logger.log({ level: 'error', message: error.stack || error.message });
        } else {
            logger.log({ level: 'error', message: error });
        }
        return logger;
    };
    return logger;
}