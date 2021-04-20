import { RequestHandler } from "express";
import helmet from 'helmet';
import express from 'express';
import morgan from 'morgan';
import settings from "../../settings";
import cors from 'cors';

const middlewares: RequestHandler[] = [
    express.json(),
    helmet(settings.helmet),
    cors(settings.cors),
    morgan(settings.logging.format, settings.logging.options),
];

export default middlewares;