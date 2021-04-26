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
    }
]

export default routes;