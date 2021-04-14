import { Knex } from "knex";
import { RequestHandler } from 'express';

export type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

export type Handler = (driver: Knex) => RequestHandler;

export interface HTTPHandler {
    method: Method;
    handler: Handler;
}

export interface Route {
    path: string;
    handlers: HTTPHandler[];
}
