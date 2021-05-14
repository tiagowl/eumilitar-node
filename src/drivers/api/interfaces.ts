import { Knex } from "knex";
import { RequestHandler } from 'express';
import Mail from "nodemailer/lib/mailer";
import { Multer } from "multer";

export type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

export type Context = {
    driver: Knex;
    smtp: Mail;
    storage: Multer;
    settings: any;
}

export type Handler = (props: Context) => RequestHandler<any, any, any>;

export interface HTTPHandler {
    method: Method;
    handler: Handler;
}

export interface Route {
    path: string;
    handlers: HTTPHandler[];
}
