import { Route } from "./interfaces";
import * as handlers from './handlers';

const routes: Route[] = [
    {
        path: '/token/',
        handlers: [
            { handler: handlers.token, method: 'post' }
        ]
    }
]

export default routes;