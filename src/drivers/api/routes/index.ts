import { Context } from "../../interfaces";
import { Router } from 'express';
import userRouter from './user';
import sessionRouter from './session';
import correctionRouter from './correction';
import essayRouter from './essay';
import invalidationRouter from './invalidation';
import productRouter from './product';
import recoveryRouter from './recovery';
import subscriptionRouter from './subscription';
import themeRouter from './theme';
import singleEssayRouter from './singleEssay';
import warningRouter from './warning';
import logRouter from './log';

const routers = [
    userRouter,
    sessionRouter,
    correctionRouter,
    essayRouter,
    invalidationRouter,
    productRouter,
    recoveryRouter,
    subscriptionRouter,
    themeRouter,
    singleEssayRouter,
    warningRouter,
    logRouter,
];

export default function getRouter(context: Context) {
    const builded = routers.map(router => router(context));
    return Router({ mergeParams: true }).use(builded);
}