import { RequestHandler } from "express";
import helmet from 'helmet';
import express from 'express';
import morgan from 'morgan';
import settings from "../../settings";
import cors from 'cors';
import cookieParser from 'cookie-parser';
import cookieSession from 'cookie-session';

const middlewares: RequestHandler[] = [
    express.json(),
    cookieParser(),
    cookieSession(settings.session),
    helmet(settings.helmet),
    cors(settings.cors),
    morgan(settings.logging.format, settings.logging.options),
];

export default middlewares;