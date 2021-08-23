import { RequestHandler } from "express";
import helmet from 'helmet';
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import cookieSession from 'cookie-session';
import { Context } from "../interfaces";


export default function getMiddlewares({ settings }: Context): RequestHandler[] {
    return [
        cors(settings.cors),
        cookieParser(),
        cookieSession(settings.session),
        helmet(settings.helmet),
        morgan(settings.logging.format, settings.logging.options),
        express.json(),
        express.urlencoded({ 'extended': true, 'type': 'application/x-www-form-urlencoded' }),
    ];
}