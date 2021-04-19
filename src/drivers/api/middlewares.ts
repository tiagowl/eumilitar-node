import { RequestHandler } from "express";
import helmet from 'helmet';
import express from 'express';

const middlewares: RequestHandler[] = [
    express.json(),
    helmet()
];

export default middlewares;

