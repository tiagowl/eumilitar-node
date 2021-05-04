import { Knex } from "knex";
import { RequestHandler } from 'express';
import Mail from "nodemailer/lib/mailer";

export type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

export type Context = {
    driver: Knex;
    smtp: Mail;
}

export type Handler = (props: Context) => RequestHandler;

export interface HTTPHandler {
    method: Method;
    handler: Handler;
}

export interface Route {
    path: string;
    handlers: HTTPHandler[];
}
