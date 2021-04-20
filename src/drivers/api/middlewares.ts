import { RequestHandler } from "express";
import helmet from 'helmet';
import express from 'express';
import morgan from 'morgan';

const middlewares: RequestHandler[] = [
    express.json(),
    helmet(),
    morgan('common'),
];

export default middlewares;

