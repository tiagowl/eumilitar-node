import winston from 'winston';

export default function create(settings: winston.LoggerOptions) {
    return winston.createLogger(settings);
}