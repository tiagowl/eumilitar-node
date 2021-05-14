import { Route } from "./interfaces";
import * as handlers from './handlers';

const routes: Route[] = [
    {
        path: '/tokens/',
        handlers: [
            { handler: handlers.createToken, method: 'post' }
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
            { handler: handlers.listEssayThemes, method: 'get' }
        ]
    },
    {
        path: '/themes/:id/',
        handlers: [
            { handler: handlers.updateEssayThemes, method: 'put' }
        ]
    }
]

export default routes;