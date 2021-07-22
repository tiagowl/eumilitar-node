import { RequestHandler } from 'express';
import helmet from 'helmet';
import { Knex } from 'knex';
import morgan from 'morgan';
import { Logger, config } from 'winston';
import winston from 'winston';
import { Mail, Context as DefaultContext, Settings as DefaultSettings } from "../adapters/interfaces";

export type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

export type Handler = (props: Context) => RequestHandler<any, any, any>;

export interface HTTPHandler {
    method: Method;
    handler: Handler;
}

export interface Route {
    path: string;
    handlers: HTTPHandler[];
}

export interface Settings extends DefaultSettings {
    database: Knex.Config;
    server: {
        port: number;
        host: string;
    };
    helmet: Parameters<typeof helmet>[0];
    logging: {
        format: string;
        options: morgan.Options<any, any>;
    };
    cors: {
        origin: string;
    };
    session: {
        keys: string[]
    };
    smtp: {
        host: string;
        port: number;
        secure: boolean;
        auth: {
            key: string;
            secret: string;
        }
    };
    storage: {
        bucket: string;
        destination: string;
        permission: string;
        allowedMimes: string[];
        type: 's3' | 'local';
        maxSize: number;
        credentials: {
            accessKeyId: string;
            secretAccessKey: string;
        };
        local: {
            destination: string;
        }
    };
    logger: winston.LoggerOptions;
}

export interface Context extends DefaultContext {
    settings: Settings;
}