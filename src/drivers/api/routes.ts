import { Route } from "../interfaces";
import * as handlers from './handlers';

const routes: Route[] = [
    {
        path: '/tokens/',
        handlers: [
            { handler: handlers.createToken, method: 'post' },
            { handler: handlers.logOut, method: 'delete' },
        ]
    },
    {
        path: '/password-recoveries/',
        handlers: [
            { handler: handlers.passwordRecoveries, method: 'post' }
        ]
    },
    {
        path: '/password-recoveries/:token/',
        handlers: [
            { handler: handlers.checkChangePasswordToken, method: 'get' }
        ]
    },
    {
        path: '/users/profile/password/',
        handlers: [
            { handler: handlers.changePassword, method: 'put' }
        ]
    },
    {
        path: '/users/profile/',
        handlers: [
            { handler: handlers.profile, method: 'get' }
        ]
    },
    {
        path: '/themes/',
        handlers: [
            { handler: handlers.createEssayTheme, method: 'post' },
            { handler: handlers.listEssayThemes, method: 'get' },
        ]
    },
    {
        path: '/themes/:id/',
        handlers: [
            { handler: handlers.updateEssayThemes, method: 'put' },
            { handler: handlers.deactivateEssayTheme, method: 'delete' }
        ]
    },
    {
        path: '/essays/',
        handlers: [
            { handler: handlers.createEssay, method: 'post' },
            { handler: handlers.listEssays, method: 'get' },
        ]
    },
    {
        path: '/essays/:id/',
        handlers: [
            { handler: handlers.getEssay, method: 'get' }
        ]
    },
    {
        path: '/essays/:id/corrector/',
        handlers: [
            { handler: handlers.createEssayCorrector, method: 'post' },
            { handler: handlers.deleteEssayCorrector, method: 'delete' }
        ]
    },
    {
        path: '/essays/:id/invalidation/',
        handlers: [
            { handler: handlers.invalidateEssay, method: 'post' },
            { handler: handlers.getInvalidation, method: 'get' }
        ]
    },
    {
        path: '/essays/:id/correction/',
        handlers: [
            { handler: handlers.correctEssay, method: 'post' },
            { handler: handlers.getCorrection, method: 'get' },
        ]
    },
    {
        path: '/users/',
        handlers: [
            { handler: handlers.listUsers, method: 'get' }
        ]
    },
    {
        path: '/subscriptions/',
        handlers: [
            { handler: handlers.createSubscription, method: 'post' },
        ]
    },
    {
        path: '/subscriptions/cancelation/',
        handlers: [
            { handler: handlers.cancelSubscription, method: 'post' },
        ]
    },
];

export default routes;