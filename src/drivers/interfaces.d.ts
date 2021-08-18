import { RequestHandler } from 'express';
import helmet from 'helmet';
import { Knex } from 'knex';
import morgan from 'morgan';
import { Logger, config } from 'winston';
import winston from 'winston';
import { Mail, Context as DefaultContext, Settings as DefaultSettings } from "../adapters/interfaces";
import { AxiosRequestConfig } from 'axios';

export type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

export type Handler = (props: Context) => RequestHandler<any, any, any>;

export interface HTTPHandler {
    readonly method: Method;
    readonly handler: Handler;
}

export interface Route {
    readonly path: string;
    readonly handlers: HTTPHandler[];
}

export interface StorageSettings {
    readonly bucket: string;
    readonly destination: string;
    readonly permission: string;
    readonly allowedMimes: string[];
    readonly type: 's3' | 'local';
    readonly maxSize: number;
    readonly credentials: {
        readonly accessKeyId: string;
        readonly secretAccessKey: string;
    };
    readonly local: {
        readonly destination: string;
    };
}

export interface SMTPSettings {
    readonly host: string;
    readonly port: number;
    readonly secure: boolean;
    readonly auth: {
        readonly key: string;
        readonly secret: string;
    };
}

export interface Settings extends DefaultSettings {
    readonly database: Knex.Config;
    readonly server: {
        readonly port: number;
        readonly host: string;
    };
    readonly helmet: Parameters<typeof helmet>[0];
    readonly logging: {
        readonly format: string;
        readonly options: morgan.Options<any, any>;
    };
    readonly cors: {
        readonly origin: string;
    };
    readonly session: {
        readonly keys: string[];
    };
    readonly smtp: SMTPSettings;
    readonly storage: StorageSettings;
    readonly logger: winston.LoggerOptions;
    readonly httpClient: AxiosRequestConfig;
}

export interface Context extends DefaultContext {
    readonly settings: Settings;
}