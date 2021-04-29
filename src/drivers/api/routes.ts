import { Route } from "./interfaces";
import * as handlers from './handlers';

const routes: Route[] = [
    {
        path: '/tokens/',
        handlers: [
            { handler: handlers.token, method: 'post' }
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
    }
]

export default routes;