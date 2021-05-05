import { RequestHandler } from "express";
import helmet from 'helmet';
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import cookieSession from 'cookie-session';
import CheckAuthController from "../../adapters/controllers/CheckAuth";
import { Context } from "./interfaces";


function getMiddlewares({ settings }: Context) {

    const middlewares: RequestHandler[] = [
        cors(settings.cors),
        express.json(),
        cookieParser(),
        cookieSession(settings.session),
        helmet(settings.helmet),
        morgan(settings.logging.format, settings.logging.options),
    ];

    return middlewares;
}


export default getMiddlewares;