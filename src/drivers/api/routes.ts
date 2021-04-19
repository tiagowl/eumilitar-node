import { Route } from "./interfaces";
import * as handlers from './handlers';

const routes: Route[] = [
    {
        path: '/tokens/',
        handlers: [
            { handler: handlers.token, method: 'post' }
        ]
    }
]

export default routes;