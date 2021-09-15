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

export default function getRouter(context: Context) {
    const users = userRouter(context);
    const session = sessionRouter(context);
    const correction = correctionRouter(context);
    const essay = essayRouter(context);
    const invalidation = invalidationRouter(context);
    const product = productRouter(context);
    const recovery = recoveryRouter(context);
    const subscription = subscriptionRouter(context);
    const theme = themeRouter(context);
    return Router({})
        .use(session)
        .use(users)
        .use(correction)
        .use(essay)
        .use(invalidation)
        .use(product)
        .use(recovery)
        .use(subscription)
        .use(theme);
}