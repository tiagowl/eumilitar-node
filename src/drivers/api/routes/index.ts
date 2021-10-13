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
];

export default function getRouter(context: Context) {
    return routers.reduce((router, getRoutes) => {
        return router.use(getRoutes(context));
    }, Router({ mergeParams: true }));
}