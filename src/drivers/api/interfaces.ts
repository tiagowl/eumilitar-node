import { Knex } from "knex";
import { RequestHandler } from 'express';
import { Mail } from "../../adapters/interfaces";
import { Multer } from "multer";
import winston from "winston";

export type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

export type Context = {
    driver: Knex;
    smtp: Mail;
    storage: Multer;
    settings: any;
    logger: winston.Logger;
};

export type Handler = (props: Context) => RequestHandler<any, any, any>;

export interface HTTPHandler {
    method: Method;
    handler: Handler;
}

export interface Route {
    path: string;
    handlers: HTTPHandler[];
}
