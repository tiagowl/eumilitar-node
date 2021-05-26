import { Route } from "./interfaces";
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
    }
]

export default routes;